/**
 * 冰雪之巅 - Phase 3：社区 UI
 * 雪场攻略、装备讨论、问答、晒板
 */

import {
    listPosts,
    getPost,
    createPost,
    deletePost,
    getPostComments,
    createPostComment,
    togglePostLike,
    getProfile,
    subscribeToPostComments,
    uploadImage
} from './api.js';
import { getCurrentUser } from './auth.js';

function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

const CommunityUI = {
    currentPost: null,
    unsubscribeComments: null,

    // ============================================
    // 攻略列表 / Feed
    // ============================================
    async showFeed(category = null) {
        const posts = await listPosts({ category, limit: 30 });
        const html = `
            <div class="community-feed">
                <h2 style="text-align: center;">🏂 雪友社区</h2>
                <p style="text-align: center; color: var(--text-secondary); margin-bottom: 20px;">
                    分享你的雪场、装备、技术
                </p>
                <div class="community-tabs">
                    <button class="tab-btn ${!category ? 'active' : ''}" onclick="CommunityUI.showFeed(null)">全部</button>
                    <button class="tab-btn ${category === 'resort' ? 'active' : ''}" onclick="CommunityUI.showFeed('resort')">🏔️ 雪场攻略</button>
                    <button class="tab-btn ${category === 'gear' ? 'active' : ''}" onclick="CommunityUI.showFeed('gear')">🛹 装备讨论</button>
                    <button class="tab-btn ${category === 'qna' ? 'active' : ''}" onclick="CommunityUI.showFeed('qna')">❓ 问答</button>
                    <button class="tab-btn ${category === 'showcase' ? 'active' : ''}" onclick="CommunityUI.showFeed('showcase')">📸 晒板</button>
                </div>
                <button class="btn btn-primary btn-block mb-20" onclick="CommunityUI.showCreatePostForm()">+ 发布新帖</button>
                <div class="post-list">
                    ${posts.length === 0 ? `
                        <div class="empty-recommendation">
                            <div class="empty-icon">📭</div>
                            <h3>还没有帖子</h3>
                            <p>做第一个分享的人！</p>
                            <button class="btn btn-primary" onclick="CommunityUI.showCreatePostForm()">发布第一帖</button>
                        </div>
                    ` : posts.map(p => this._renderPostCard(p)).join('')}
                </div>
            </div>
        `;
        App.showModal(html);
    },

    _renderPostCard(post) {
        const author = post.author || {};
        const authorName = escapeHtml(author.display_name || '雪友');
        const avatar = escapeHtml(String(author.avatar_url || '🏂'));
        const date = new Date(post.created_at).toLocaleDateString('zh-CN');
        const categoryIcons = {
            resort: '🏔️', gear: '🛹', qna: '❓', showcase: '📸'
        };
        const icon = categoryIcons[post.category] || '📄';

        return `
            <div class="post-card" onclick="CommunityUI.showPostDetail('${escapeHtml(post.id)}')">
                <div class="post-card-header">
                    <div class="post-author-avatar">${avatar}</div>
                    <div class="post-author-info">
                        <strong>${authorName}</strong>
                        ${author.verified ? '<span class="verified-badge">✓</span>' : ''}
                        <div class="post-meta">${icon} ${date}</div>
                    </div>
                </div>
                <h3 class="post-card-title">${icon} ${escapeHtml(post.title)}</h3>
                ${post.resort_name ? `<div class="post-card-resort">📍 ${escapeHtml(post.resort_name)}</div>` : ''}
                <p class="post-card-excerpt">${escapeHtml(post.content.slice(0, 120))}${post.content.length > 120 ? '...' : ''}</p>
                ${post.images && post.images.length > 0 ? `
                    <div class="post-card-images">
                        ${post.images.slice(0, 3).map(img => `<div class="post-card-image">${escapeHtml(String(img))}</div>`).join('')}
                    </div>
                ` : ''}
                <div class="post-card-stats">
                    <span>👁 ${post.view_count || 0}</span>
                    <span>❤️ ${post.like_count || 0}</span>
                    <span>💬 ${post.comment_count || 0}</span>
                </div>
            </div>
        `;
    },

    // ============================================
    // 帖子详情
    // ============================================
    async showPostDetail(postId) {
        const post = await getPost(postId);
        if (!post) {
            App.showToast('帖子不存在', 'error');
            return;
        }
        this.currentPost = post;

        const comments = await getPostComments(postId);
        const author = post.author || {};
        const date = new Date(post.created_at).toLocaleString('zh-CN');
        const categoryIcons = { resort: '🏔️', gear: '🛹', qna: '❓', showcase: '📸' };
        const icon = categoryIcons[post.category] || '📄';

        const html = `
            <div class="post-detail">
                <div class="post-detail-header">
                    <div class="post-author-avatar">${escapeHtml(String(author.avatar_url || '🏂'))}</div>
                    <div>
                        <strong>${escapeHtml(author.display_name || '雪友')}</strong>
                        ${author.verified ? '<span class="verified-badge">✓</span>' : ''}
                        <div class="post-meta">${icon} ${date}</div>
                    </div>
                </div>
                <h1 class="post-detail-title">${icon} ${escapeHtml(post.title)}</h1>
                ${post.resort_name ? `
                    <div class="post-detail-resort">
                        📍 <strong>${escapeHtml(post.resort_name)}</strong>
                        ${post.resort_location ? '· ' + escapeHtml(post.resort_location) : ''}
                    </div>
                ` : ''}
                <div class="post-detail-content">${this._formatContent(post.content)}</div>
                ${post.images && post.images.length > 0 ? `
                    <div class="post-detail-images">
                        ${post.images.map(img => `<div class="post-detail-image">${escapeHtml(String(img))}</div>`).join('')}
                    </div>
                ` : ''}
                ${post.tags && post.tags.length > 0 ? `
                    <div class="post-detail-tags">
                        ${post.tags.map(t => `<span class="post-tag">${escapeHtml(t)}</span>`).join('')}
                    </div>
                ` : ''}
                <div class="post-detail-actions">
                    <button class="post-action-btn" onclick="CommunityUI.likePost('${escapeHtml(post.id)}')">
                        ❤️ <span id="likeCount">${post.like_count || 0}</span>
                    </button>
                    <button class="post-action-btn" onclick="document.getElementById('commentInput').focus()">
                        💬 <span>${post.comment_count || 0}</span>
                    </button>
                </div>
                <div class="comments-section">
                    <h3>💬 评论 (${post.comment_count || 0})</h3>
                    <form class="comment-form" onsubmit="event.preventDefault(); CommunityUI.submitComment('${escapeHtml(post.id)}');">
                        <textarea id="commentInput" rows="2" placeholder="说点什么..." required></textarea>
                        <button type="submit" class="btn btn-primary">发送</button>
                    </form>
                    <div id="commentsList" class="comments-list">
                        ${comments.map(c => this._renderComment(c)).join('')}
                    </div>
                </div>
            </div>
        `;
        App.showModal(html);

        // Realtime 订阅新评论
        if (this.unsubscribeComments) this.unsubscribeComments();
        this.unsubscribeComments = subscribeToPostComments(postId, (newComment) => {
            const list = document.getElementById('commentsList');
            if (list && newComment) {
                // 拉取完整 comment（含 author profile）
                getPostComments(postId).then(all => {
                    list.innerHTML = all.map(c => this._renderComment(c)).join('');
                });
            }
        });
    },

    _formatContent(text) {
        if (!text) return '';
        return escapeHtml(text)
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    },

    _renderComment(c) {
        const author = c.author || {};
        const date = new Date(c.created_at).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        return `
            <div class="comment-item ${c.parent_id ? 'comment-reply' : ''}">
                <div class="comment-avatar">${escapeHtml(String(author.avatar_url || '🏂'))}</div>
                <div class="comment-body">
                    <div class="comment-header">
                        <strong>${escapeHtml(author.display_name || '雪友')}</strong>
                        <span class="comment-time">${date}</span>
                    </div>
                    <p>${escapeHtml(c.content)}</p>
                </div>
            </div>
        `;
    },

    async likePost(postId) {
        const result = await togglePostLike(postId);
        if (result.success) {
            // 局部刷新点赞数
            const el = document.getElementById('likeCount');
            if (el) {
                const cur = parseInt(el.textContent) || 0;
                el.textContent = result.liked ? cur + 1 : Math.max(cur - 1, 0);
            }
        } else {
            App.showToast(result.error || '操作失败', 'error');
        }
    },

    async submitComment(postId) {
        const content = document.getElementById('commentInput')?.value.trim();
        if (!content) return;
        const result = await createPostComment(postId, content);
        if (result.success) {
            document.getElementById('commentInput').value = '';
            // 刷新评论列表
            const comments = await getPostComments(postId);
            const list = document.getElementById('commentsList');
            if (list) list.innerHTML = comments.map(c => this._renderComment(c)).join('');
        } else {
            App.showToast(result.error || '评论失败', 'error');
        }
    },

    // ============================================
    // 发布新帖
    // ============================================
    showCreatePostForm() {
        const html = `
            <div class="post-form">
                <h2 style="text-align: center;">✍️ 发布新帖</h2>
                <form onsubmit="event.preventDefault(); CommunityUI.submitCreatePost();">
                    <div class="form-group">
                        <label>分类 *</label>
                        <select id="newPostCategory" required>
                            <option value="resort">🏔️ 雪场攻略</option>
                            <option value="gear">🛹 装备讨论</option>
                            <option value="qna">❓ 问答</option>
                            <option value="showcase">📸 晒板</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>标题 *</label>
                        <input type="text" id="newPostTitle" required maxlength="80" placeholder="一句话总结你的分享">
                    </div>
                    <div class="form-group" id="resortFields" style="display:none;">
                        <label>雪场名</label>
                        <input type="text" id="newPostResortName" placeholder="如：将军山滑雪场">
                    </div>
                    <div class="form-group" id="resortLocationFields" style="display:none;">
                        <label>雪场地点</label>
                        <input type="text" id="newPostResortLocation" placeholder="如：新疆阿勒泰">
                    </div>
                    <div class="form-group">
                        <label>正文 *</label>
                        <textarea id="newPostContent" required rows="8" placeholder="详细分享你的经验、问题或装备..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>标签</label>
                        <input type="text" id="newPostTags" placeholder="逗号分隔，如：将军山,中级,粉雪">
                    </div>
                    <div class="form-group">
                        <label>图片 URL（最多 3 张）</label>
                        <input type="text" id="newPostImage1" placeholder="图片 URL 1（可选）">
                        <input type="text" id="newPostImage2" placeholder="图片 URL 2（可选）" style="margin-top: 6px;">
                        <input type="text" id="newPostImage3" placeholder="图片 URL 3（可选）" style="margin-top: 6px;">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" onclick="App.closeModal()">取消</button>
                        <button type="submit" class="btn btn-primary">发布</button>
                    </div>
                </form>
            </div>
        `;
        App.showModal(html);

        // 动态显示雪场字段
        setTimeout(() => {
            const sel = document.getElementById('newPostCategory');
            const toggleResort = () => {
                const isResort = sel.value === 'resort';
                document.getElementById('resortFields').style.display = isResort ? 'block' : 'none';
                document.getElementById('resortLocationFields').style.display = isResort ? 'block' : 'none';
            };
            sel.addEventListener('change', toggleResort);
        }, 50);
    },

    async submitCreatePost() {
        const category = document.getElementById('newPostCategory')?.value;
        const title = document.getElementById('newPostTitle')?.value.trim();
        const content = document.getElementById('newPostContent')?.value.trim();
        const resort_name = document.getElementById('newPostResortName')?.value.trim() || null;
        const resort_location = document.getElementById('newPostResortLocation')?.value.trim() || null;
        const tagsRaw = document.getElementById('newPostTags')?.value.trim() || '';
        const tags = tagsRaw ? tagsRaw.split(/[,，]/).map(t => t.trim()).filter(Boolean) : [];
        const images = [
            document.getElementById('newPostImage1')?.value.trim(),
            document.getElementById('newPostImage2')?.value.trim(),
            document.getElementById('newPostImage3')?.value.trim()
        ].filter(Boolean);

        const result = await createPost({
            category, title, content, resort_name, resort_location, tags, images
        });

        if (result.success) {
            App.closeModal();
            App.showToast('🎉 发布成功');
            setTimeout(() => this.showFeed(), 500);
        } else {
            App.showToast(result.error || '发布失败', 'error');
        }
    }
};

// 暴露
window.CommunityUI = CommunityUI;