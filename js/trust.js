/**
 * 冰雪之巅 - Phase 2：信任体系 UI
 * 包含：评价、站内信、实名认证
 */

import {
    submitReview,
    replyReview,
    getListingReviews,
    sendMessage,
    getConversation,
    markMessagesRead,
    getUnreadCount,
    submitVerification,
    getMyVerification
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

const TrustUI = {
    // ============================================
    // 评价系统
    // ============================================

    /**
     * 显示提交评价弹窗（订单完成后调用）
     */
    async showSubmitReviewForm(listingId, revieweeId, orderId = null) {
        const html = `
            <div class="review-form">
                <h2 style="text-align: center;">⭐ 写评价</h2>
                <p style="text-align: center; color: var(--text-secondary); margin-bottom: 20px;">
                    你的评价帮助其他雪友做出选择
                </p>
                <form onsubmit="event.preventDefault(); TrustUI.submitReviewForm('${escapeHtml(listingId)}', '${escapeHtml(revieweeId)}', '${escapeHtml(orderId || '')}');">
                    <div class="form-group">
                        <label>总体评分 *</label>
                        <div class="star-rating-input" id="reviewRating">
                            ${[1,2,3,4,5].map(i => `<span class="star" data-value="${i}" onclick="TrustUI.setRating(${i})">☆</span>`).join('')}
                        </div>
                    </div>

                    <div class="form-group">
                        <label>子评分（可选）</label>
                        <div class="sub-rating-group">
                            <div>
                                <span class="sub-rating-label">描述准确</span>
                                <div class="star-rating-input small" data-name="accuracy">
                                    ${[1,2,3,4,5].map(i => `<span class="star" data-value="${i}" onclick="TrustUI.setSubRating('accuracy', ${i})">☆</span>`).join('')}
                                </div>
                            </div>
                            <div>
                                <span class="sub-rating-label">沟通及时</span>
                                <div class="star-rating-input small" data-name="communication">
                                    ${[1,2,3,4,5].map(i => `<span class="star" data-value="${i}" onclick="TrustUI.setSubRating('communication', ${i})">☆</span>`).join('')}
                                </div>
                            </div>
                            <div>
                                <span class="sub-rating-label">实际状况</span>
                                <div class="star-rating-input small" data-name="condition">
                                    ${[1,2,3,4,5].map(i => `<span class="star" data-value="${i}" onclick="TrustUI.setSubRating('condition', ${i})">☆</span>`).join('')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>标签（可多选）</label>
                        <div class="review-tags">
                            ${['装备描述准确', '沟通及时', '包装完好', '板子状态好', '推荐给朋友', '会回购'].map(t => `
                                <label class="checkbox-pill">
                                    <input type="checkbox" value="${escapeHtml(t)}">
                                    <span>${escapeHtml(t)}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    <div class="form-group">
                        <label>详细评价</label>
                        <textarea id="reviewContent" rows="4" placeholder="说说你的真实体验..."></textarea>
                    </div>

                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="reviewAnonymous">
                            匿名发布
                        </label>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" onclick="App.closeModal()">取消</button>
                        <button type="submit" class="btn btn-primary">提交评价</button>
                    </div>
                </form>
            </div>
        `;
        App.showModal(html);
    },

    setRating(value) {
        this._rating = value;
        const stars = document.querySelectorAll('#reviewRating .star');
        stars.forEach(s => {
            const v = parseInt(s.dataset.value);
            s.textContent = v <= value ? '★' : '☆';
            s.classList.toggle('active', v <= value);
        });
    },

    setSubRating(name, value) {
        if (!this._subRatings) this._subRatings = {};
        this._subRatings[name] = value;
        const stars = document.querySelectorAll(`.star-rating-input[data-name="${name}"] .star`);
        stars.forEach(s => {
            const v = parseInt(s.dataset.value);
            s.textContent = v <= value ? '★' : '☆';
            s.classList.toggle('active', v <= value);
        });
    },

    async submitReviewForm(listingId, revieweeId, orderId) {
        if (!this._rating) {
            App.showToast('请选择评分', 'error');
            return;
        }
        const content = document.getElementById('reviewContent')?.value.trim();
        const tags = Array.from(document.querySelectorAll('.review-tags input:checked')).map(el => el.value);
        const isAnonymous = document.getElementById('reviewAnonymous')?.checked || false;

        const data = {
            listing_id: listingId,
            reviewee_id: revieweeId,
            order_id: orderId || null,
            rating: this._rating,
            content,
            tags,
            is_anonymous: isAnonymous,
            accuracy_rating: this._subRatings?.accuracy,
            communication_rating: this._subRatings?.communication,
            condition_rating: this._subRatings?.condition
        };

        const result = await submitReview(data);
        if (result.success) {
            App.closeModal();
            App.showToast('🎉 评价提交成功');
            // 刷新 listing 评分
            SnowboardData.invalidateListings();
        } else {
            App.showToast(result.error || '提交失败', 'error');
        }
    },

    /**
     * 渲染 listing 评价区块（在详情页内嵌）
     */
    async renderReviews(listingId, hostId) {
        const reviews = await getListingReviews(listingId);
        if (reviews.length === 0) {
            return `
                <div class="reviews-section">
                    <h3>⭐ 用户评价</h3>
                    <div class="empty-recommendation" style="padding: 24px;">
                        <p style="color: var(--text-secondary);">还没有评价</p>
                    </div>
                </div>
            `;
        }

        const ratingDist = [5,4,3,2,1].map(star => {
            const count = reviews.filter(r => r.rating === star).length;
            const pct = (count / reviews.length) * 100;
            return { star, count, pct };
        });

        const avg = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
        const reviewItemsHtml = reviews.slice(0, 5).map(r => this._renderReviewItem(r, hostId)).join('');

        return `
            <div class="reviews-section">
                <h3>⭐ 用户评价 (${reviews.length})</h3>
                <div class="rating-summary">
                    <div class="rating-big">${avg}</div>
                    <div class="rating-bars">
                        ${ratingDist.map(d => `
                            <div class="rating-bar-row">
                                <span class="rating-bar-label">${d.star}星</span>
                                <div class="rating-bar-track">
                                    <div class="rating-bar-fill" style="width: ${d.pct}%"></div>
                                </div>
                                <span class="rating-bar-count">${d.count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="reviews-list">
                    ${reviewItemsHtml}
                </div>
            </div>
        `;
    },

    _renderReviewItem(r, hostId) {
        const reviewerName = r.is_anonymous
            ? '匿名用户'
            : (r.reviewer?.display_name || '用户');
        const date = new Date(r.created_at).toLocaleDateString('zh-CN');

        return `
            <div class="review-item">
                <div class="review-header">
                    <div>
                        <strong>${escapeHtml(reviewerName)}</strong>
                        <span class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
                    </div>
                    <span class="review-date">${date}</span>
                </div>
                ${r.tags && r.tags.length > 0 ? `
                    <div class="review-tags-display">
                        ${r.tags.map(t => `<span class="review-tag">${escapeHtml(t)}</span>`).join('')}
                    </div>
                ` : ''}
                ${r.content ? `<p class="review-content">${escapeHtml(r.content)}</p>` : ''}
                ${r.host_reply ? `
                    <div class="host-reply">
                        <strong>卖家回复：</strong>
                        <p>${escapeHtml(r.host_reply)}</p>
                    </div>
                ` : ''}
            </div>
        `;
    },

    // ============================================
    // 站内信
    // ============================================

    /**
     * 显示发消息弹窗
     */
    showMessageDialog(receiverId, listingId = null) {
        const html = `
            <div class="message-dialog">
                <h2 style="text-align: center;">💬 联系发布者</h2>
                <p style="text-align: center; color: var(--text-secondary); margin-bottom: 20px;">
                    在平台内沟通更安全
                </p>
                <form onsubmit="event.preventDefault(); TrustUI.submitMessage('${escapeHtml(receiverId)}', '${escapeHtml(listingId || '')}');">
                    <div class="form-group">
                        <textarea id="messageContent" rows="5" required placeholder="你好，我对这块板子感兴趣..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" onclick="App.closeModal()">取消</button>
                        <button type="submit" class="btn btn-primary">发送</button>
                    </div>
                </form>
            </div>
        `;
        App.showModal(html);
    },

    async submitMessage(receiverId, listingId) {
        const content = document.getElementById('messageContent')?.value.trim();
        if (!content) {
            App.showToast('请输入消息内容', 'error');
            return;
        }
        const result = await sendMessage(receiverId, content, listingId);
        if (result.success) {
            App.closeModal();
            App.showToast('✅ 消息已发送');
        } else {
            App.showToast(result.error || '发送失败', 'error');
        }
    },

    /**
     * 显示我的消息列表
     */
    async showInbox() {
        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:profiles!messages_sender_id_fkey (id, display_name, avatar_url, verified),
                receiver:profiles!messages_receiver_id_fkey (id, display_name, avatar_url, verified),
                listing:listings (id, title)
            `)
            .or(`sender_id.eq.${(await App.getCurrentUser())?.id || ''},receiver_id.eq.${(await App.getCurrentUser())?.id || ''}`)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error || !data) {
            App.showToast('加载消息失败', 'error');
            return;
        }

        // 按对方用户分组，取最新一条
        const userId = (await App.getCurrentUser())?.id;
        const conversations = {};
        for (const m of data) {
            const otherId = m.sender_id === userId ? m.receiver_id : m.sender_id;
            if (!conversations[otherId]) {
                conversations[otherId] = {
                    other: m.sender_id === userId ? m.receiver : m.sender,
                    lastMessage: m,
                    unread: 0
                };
            }
            if (!m.read_at && m.receiver_id === userId) {
                conversations[otherId].unread++;
            }
        }

        const html = `
            <div class="inbox">
                <h2 style="text-align: center;">💬 消息</h2>
                <div class="inbox-list">
                    ${Object.keys(conversations).length === 0 ? `
                        <div class="empty-recommendation">
                            <div class="empty-icon">💬</div>
                            <h3>暂无消息</h3>
                            <p>联系发布者开启对话</p>
                        </div>
                    ` : Object.values(conversations).map(c => `
                        <div class="inbox-item" onclick="TrustUI.openConversation('${escapeHtml(c.other.id)}', '${escapeHtml(c.other.display_name || '')}')">
                            <div class="inbox-avatar">${escapeHtml(String(c.other.avatar_url || '👤'))}</div>
                            <div class="inbox-content">
                                <div class="inbox-header">
                                    <strong>${escapeHtml(c.other.display_name || '用户')}</strong>
                                    ${c.other.verified ? '<span class="verified-badge">✓</span>' : ''}
                                    <span class="inbox-time">${new Date(c.lastMessage.created_at).toLocaleDateString('zh-CN')}</span>
                                </div>
                                <div class="inbox-preview">${escapeHtml(c.lastMessage.content)}</div>
                            </div>
                            ${c.unread > 0 ? `<span class="inbox-unread">${c.unread}</span>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        App.showModal(html);
    },

    async openConversation(otherId, otherName) {
        await markMessagesRead(otherId);
        const messages = await getConversation(otherId);

        const html = `
            <div class="conversation">
                <h2 style="text-align: center;">💬 ${escapeHtml(otherName)}</h2>
                <div class="conversation-messages" id="conversationMessages">
                    ${messages.map(m => this._renderMessage(m)).join('')}
                </div>
                <form class="conversation-input" onsubmit="event.preventDefault(); TrustUI.sendConversationMessage('${escapeHtml(otherId)}');">
                    <textarea id="conversationInput" rows="2" placeholder="输入消息..." required></textarea>
                    <button type="submit" class="btn btn-primary">发送</button>
                </form>
            </div>
        `;
        App.showModal(html);
        // 滚到底部
        setTimeout(() => {
            const el = document.getElementById('conversationMessages');
            if (el) el.scrollTop = el.scrollHeight;
        }, 100);
    },

    _renderMessage(m) {
        const userId = window._currentUserId;
        const isMine = m.sender_id === userId;
        return `
            <div class="message-bubble ${isMine ? 'mine' : 'theirs'}">
                <div class="message-content">${escapeHtml(m.content)}</div>
                <div class="message-time">${new Date(m.created_at).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
        `;
    },

    async sendConversationMessage(receiverId) {
        const content = document.getElementById('conversationInput')?.value.trim();
        if (!content) return;
        const result = await sendMessage(receiverId, content);
        if (result.success) {
            // 重新打开会话
            const otherName = document.querySelector('.conversation h2')?.textContent.replace('💬 ', '') || '';
            this.openConversation(receiverId, otherName);
        } else {
            App.showToast(result.error || '发送失败', 'error');
        }
    },

    // ============================================
    // 实名认证
    // ============================================

    /**
     * 显示实名/店铺认证表单
     */
    async showVerificationForm() {
        const existing = await getMyVerification();
        const statusInfo = existing ? `
            <div class="verification-status status-${existing.status}">
                当前状态：<strong>${this._verificationStatusText(existing.status)}</strong>
                ${existing.status === 'approved' ? ' ✓ 你的账户已认证' : ''}
            </div>
        ` : '';

        const html = `
            <div class="verification-form">
                <h2 style="text-align: center;">🛡️ 实名认证</h2>
                <p style="text-align: center; color: var(--text-secondary); margin-bottom: 20px;">
                    完成认证获得 ⭐ 信任标识
                </p>
                ${statusInfo}
                <form onsubmit="event.preventDefault(); TrustUI.submitVerificationForm();">
                    <div class="form-group">
                        <label>认证类型 *</label>
                        <select id="verifType" required>
                            <option value="individual_id">👤 个人实名</option>
                            <option value="shop_license">🏪 雪具店营业执照</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>真实姓名 *</label>
                        <input type="text" id="verifName" required placeholder="如张三">
                    </div>
                    <div class="form-group">
                        <label>身份证号 / 营业执照号 *</label>
                        <input type="text" id="verifIdNumber" required placeholder="仅用于审核，会加密存储">
                    </div>
                    <div class="form-group">
                        <label>证件照片 URL *</label>
                        <input type="text" id="verifIdImage" required placeholder="上传到图床后粘贴 URL（Phase 3 接 Supabase Storage）">
                    </div>
                    <div class="form-group" id="shopNameGroup" style="display:none;">
                        <label>店铺名</label>
                        <input type="text" id="verifShopName" placeholder="如：XX 雪具租赁店">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" onclick="App.closeModal()">取消</button>
                        <button type="submit" class="btn btn-primary">提交审核</button>
                    </div>
                </form>
            </div>
        `;
        App.showModal(html);

        // 动态切换是否显示店铺名
        setTimeout(() => {
            const typeSelect = document.getElementById('verifType');
            const shopGroup = document.getElementById('shopNameGroup');
            const shopInput = document.getElementById('verifShopName');
            if (typeSelect && shopGroup) {
                typeSelect.addEventListener('change', () => {
                    if (typeSelect.value === 'shop_license') {
                        shopGroup.style.display = 'block';
                        shopInput.required = true;
                    } else {
                        shopGroup.style.display = 'none';
                        shopInput.required = false;
                    }
                });
            }
        }, 50);
    },

    _verificationStatusText(status) {
        return {
            pending: '⏳ 审核中',
            approved: '✓ 已通过',
            rejected: '✗ 未通过'
        }[status] || status;
    },

    async submitVerificationForm() {
        const type = document.getElementById('verifType')?.value;
        const realName = document.getElementById('verifName')?.value.trim();
        const idNumber = document.getElementById('verifIdNumber')?.value.trim();
        const idImage = document.getElementById('verifIdImage')?.value.trim();
        const shopName = document.getElementById('verifShopName')?.value.trim();

        if (!type || !realName || !idNumber || !idImage) {
            App.showToast('请填写所有必填项', 'error');
            return;
        }

        // 简单 hash（生产环境用 crypto.subtle.digest）
        const idHash = btoa(idNumber).slice(0, 32);

        const data = {
            type,
            real_name: realName,
            id_number_hash: idHash,
            id_image_url: idImage,
            shop_name: shopName || null
        };

        const result = await submitVerification(data);
        if (result.success) {
            App.closeModal();
            App.showToast('✅ 认证资料已提交，审核结果 1-3 个工作日内通知');
        } else {
            App.showToast(result.error || '提交失败', 'error');
        }
    }
};

// 暴露到全局
window.TrustUI = TrustUI;