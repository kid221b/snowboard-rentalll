/**
 * 冰雪之巅 - Phase 3：个人资料编辑
 */

import {
    getProfile,
    updateMyProfile,
    getMyListings
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

const ProfileUI = {
    /**
     * 显示个人主页（公开）
     */
    async showProfile(userId) {
        const profile = await getProfile(userId);
        if (!profile) {
            App.showToast('用户不存在', 'error');
            return;
        }

        const listings = await getMyListings('active');

        const html = `
            <div class="profile-page">
                <div class="profile-header">
                    <div class="profile-avatar-large">${escapeHtml(String(profile.avatar_url || '🏂'))}</div>
                    <div class="profile-info">
                        <h2>
                            ${escapeHtml(profile.display_name || '雪友')}
                            ${profile.verified ? '<span class="verified-badge">✓ 已认证</span>' : ''}
                        </h2>
                        <div class="profile-meta">
                            <span>📍 ${escapeHtml(profile.city || '未填')}</span>
                            <span>🎯 ${escapeHtml(profile.skill_level || '未标注')}</span>
                            <span>⭐ ${(profile.rating || 0).toFixed(1)}/5 (${profile.rating_count || 0} 评)</span>
                            ${profile.listing_count > 0 ? `<span>📦 ${profile.listing_count} 件在租</span>` : ''}
                            ${profile.completed_rentals > 0 ? `<span>✅ ${profile.completed_rentals} 单成交</span>` : ''}
                        </div>
                        ${profile.bio ? `<p class="profile-bio">${escapeHtml(profile.bio)}</p>` : ''}
                    </div>
                </div>
                ${listings.length > 0 ? `
                    <h3>📦 在租雪具 (${listings.length})</h3>
                    <div class="profile-listings">
                        ${listings.map(l => this._renderListingPreview(l)).join('')}
                    </div>
                ` : '<p style="text-align: center; color: var(--text-secondary); padding: 24px;">暂无在租雪具</p>'}
            </div>
        `;
        App.showModal(html);
    },

    _renderListingPreview(l) {
        return `
            <div class="profile-listing-item" onclick="App.closeModal(); App.showProductDetail('${escapeHtml(l.id)}');">
                <div class="profile-listing-image">${escapeHtml(String((l.images && l.images[0]) || '🏂'))}</div>
                <div>
                    <strong>${escapeHtml(l.title)}</strong>
                    <div class="profile-listing-meta">¥${l.price_per_day}/天 · ${escapeHtml(l.brand)}</div>
                </div>
            </div>
        `;
    },

    /**
     * 显示个人资料编辑表单
     */
    async showEditForm() {
        const user = await getCurrentUser();
        if (!user) {
            App.showToast('请先登录', 'error');
            return;
        }

        const profile = await getProfile(user.id);
        const p = profile || {};

        const html = `
            <div class="profile-edit">
                <h2 style="text-align: center;">✏️ 编辑个人资料</h2>
                <form onsubmit="event.preventDefault(); ProfileUI.submitEdit();">
                    <div class="form-group">
                        <label>显示名 *</label>
                        <input type="text" id="editDisplayName" required maxlength="30" value="${escapeHtml(p.display_name || '')}" placeholder="昵称，会展示在商品页">
                    </div>
                    <div class="form-group">
                        <label>头像 URL</label>
                        <input type="text" id="editAvatarUrl" value="${escapeHtml(p.avatar_url || '')}" placeholder="https://...">
                    </div>
                    <div class="form-group">
                        <label>所在城市</label>
                        <input type="text" id="editCity" value="${escapeHtml(p.city || '')}" placeholder="如：北京">
                    </div>
                    <div class="form-group">
                        <label>滑雪技能</label>
                        <select id="editSkill">
                            <option value="">未标注</option>
                            <option value="beginner" ${p.skill_level === 'beginner' ? 'selected' : ''}>🌱 新手</option>
                            <option value="intermediate" ${p.skill_level === 'intermediate' ? 'selected' : ''}>⛷️ 初中级</option>
                            <option value="advanced" ${p.skill_level === 'advanced' ? 'selected' : ''}>🏂 中高级</option>
                            <option value="expert" ${p.skill_level === 'expert' ? 'selected' : ''}>🏆 专业</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>个人简介</label>
                        <textarea id="editBio" rows="3" maxlength="200" placeholder="说说你和滑雪的故事...">${escapeHtml(p.bio || '')}</textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" onclick="App.closeModal()">取消</button>
                        <button type="submit" class="btn btn-primary">保存</button>
                    </div>
                </form>
            </div>
        `;
        App.showModal(html);
    },

    async submitEdit() {
        const data = {
            display_name: document.getElementById('editDisplayName')?.value.trim(),
            avatar_url: document.getElementById('editAvatarUrl')?.value.trim() || null,
            city: document.getElementById('editCity')?.value.trim() || null,
            skill_level: document.getElementById('editSkill')?.value || null,
            bio: document.getElementById('editBio')?.value.trim() || null
        };

        if (!data.display_name) {
            App.showToast('显示名不能为空', 'error');
            return;
        }

        const result = await updateMyProfile(data);
        if (result.success) {
            App.closeModal();
            App.showToast('✅ 个人资料已更新');
            // 刷新 UI
            const user = await getCurrentUser();
            if (user) App.updateAuthUI(user);
        } else {
            App.showToast(result.error || '保存失败', 'error');
        }
    }
};

window.ProfileUI = ProfileUI;