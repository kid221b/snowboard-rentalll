/**
 * 冰雪之巅 - Phase 1：发布者相关 UI
 * 包含：host 入驻、发布雪具表单、我的发布、收藏
 */

import {
    createListing,
    updateListing,
    deleteListing,
    getMyListings,
    setUserRole,
    getListing
} from './api.js';

function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

const HostUI = {
    // 当前表单状态
    formData: {
        // 基础
        title: '', brand: '', model: '', year: '',
        // 规格
        type: 'all-mountain', length: '', width: '',
        flex: 5, shape: 'directional', camber: 'hybrid',
        // 适配
        skillLevel: [], terrain: [], heightMin: '', heightMax: '',
        weightMin: '', weightMax: '', bootMin: '', bootMax: '',
        // 使用
        condition: 'good', ageYears: '', defects: '',
        description: '',
        // 价格
        pricePerDay: '', deposit: '', minDays: 1, maxDays: 30,
        shipping: false, selfPickup: true,
        city: ''
    },

    /**
     * 显示发布者入驻弹窗
     */
    showOnboarding() {
        const html = `
            <div class="host-onboarding">
                <h2 style="text-align: center;">🏂 成为发布者</h2>
                <p style="text-align: center; color: var(--text-secondary); margin-bottom: 24px;">
                    把你的雪具租给有需要的人，赚取收益
                </p>

                <div class="onboarding-benefits">
                    <div class="benefit-item">
                        <span class="benefit-icon">💰</span>
                        <div>
                            <strong>赚取额外收入</strong>
                            <p>让闲置的雪具创造价值</p>
                        </div>
                    </div>
                    <div class="benefit-item">
                        <span class="benefit-icon">🛡️</span>
                        <div>
                            <strong>押金保障</strong>
                            <p>损坏可获赔付，平台担保</p>
                        </div>
                    </div>
                    <div class="benefit-item">
                        <span class="benefit-icon">📈</span>
                        <div>
                            <strong>积累信誉</strong>
                            <p>每完成一单都增加交易记录</p>
                        </div>
                    </div>
                </div>

                <div class="onboarding-types">
                    <h3>你是哪种发布者？</h3>
                    <div class="onboarding-type-options">
                        <label class="type-option">
                            <input type="radio" name="hostType" value="individual" checked>
                            <div class="type-option-content">
                                <strong>👤 个人</strong>
                                <p>我自己的雪具出租</p>
                            </div>
                        </label>
                        <label class="type-option">
                            <input type="radio" name="hostType" value="shop">
                            <div class="type-option-content">
                                <strong>🏪 雪具店</strong>
                                <p>店铺/商家批量发布</p>
                            </div>
                        </label>
                    </div>
                </div>

                <div class="onboarding-actions">
                    <button class="btn btn-outline" onclick="App.closeModal()">稍后再说</button>
                    <button class="btn btn-primary" onclick="HostUI.completeOnboarding()">成为发布者 →</button>
                </div>
            </div>
        `;
        App.showModal(html);
    },

    /**
     * 完成入驻（切换角色）
     */
    async completeOnboarding() {
        const type = document.querySelector('input[name="hostType"]:checked')?.value || 'individual';
        const role = type === 'shop' ? 'host' : 'host';  // 都用 host，加 source 区分

        const result = await setUserRole('host');
        if (result.success) {
            App.closeModal();
            App.showToast('🎉 欢迎成为发布者！');
            setTimeout(() => this.showListingForm(), 500);
        } else {
            App.showToast(result.error || '角色切换失败', 'error');
        }
    },

    /**
     * 显示雪具发布表单
     */
    showListingForm() {
        this.formData = {
            title: '', brand: '', model: '', year: '',
            type: 'all-mountain', length: '', width: '',
            flex: 5, shape: 'directional', camber: 'hybrid',
            skillLevel: [], terrain: [],
            heightMin: '', heightMax: '', weightMin: '', weightMax: '',
            bootMin: '', bootMax: '',
            condition: 'good', ageYears: '', defects: '',
            description: '', features: [],
            pricePerDay: '', deposit: '', minDays: 1, maxDays: 30,
            shipping: false, selfPickup: true, city: ''
        };

        const html = `
            <div class="listing-form">
                <h2 style="text-align: center;">📦 发布雪具</h2>
                <p style="text-align: center; color: var(--text-secondary); margin-bottom: 20px;">
                    描述越详细，租客越容易找到你
                </p>

                <form id="listingForm" onsubmit="event.preventDefault(); HostUI.submitListing();">
                    <!-- Section: 基础信息 -->
                    <fieldset class="form-section">
                        <legend>基础信息</legend>
                        <div class="form-group">
                            <label>标题 *</label>
                            <input type="text" id="lf_title" required maxlength="60" placeholder="例如：Burton Custom X 158 全能板 9.5 成新">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>品牌 *</label>
                                <input type="text" id="lf_brand" required placeholder="Burton">
                            </div>
                            <div class="form-group">
                                <label>型号</label>
                                <input type="text" id="lf_model" placeholder="Custom X">
                            </div>
                            <div class="form-group">
                                <label>上市年份</label>
                                <input type="number" id="lf_year" min="2015" max="2030" placeholder="2023">
                            </div>
                        </div>
                    </fieldset>

                    <!-- Section: 规格 -->
                    <fieldset class="form-section">
                        <legend>规格</legend>
                        <div class="form-row">
                            <div class="form-group">
                                <label>类型 *</label>
                                <select id="lf_type" required>
                                    <option value="all-mountain">🏂 全能板</option>
                                    <option value="freestyle">🎪 公园板</option>
                                    <option value="freeride">🏔️ 高山板</option>
                                    <option value="women">👩 女子板</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>板长</label>
                                <input type="text" id="lf_length" placeholder="158cm">
                            </div>
                            <div class="form-group">
                                <label>板宽</label>
                                <input type="text" id="lf_width" placeholder="25.5cm">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>硬度 (1-10) *</label>
                                <input type="number" id="lf_flex" min="1" max="10" value="5" required>
                            </div>
                            <div class="form-group">
                                <label>板型</label>
                                <select id="lf_shape">
                                    <option value="directional">方向板</option>
                                    <option value="twin">双向板</option>
                                    <option value="twin-tip">双向板尖</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>板底</label>
                                <select id="lf_camber">
                                    <option value="camber">正拱</option>
                                    <option value="rocker">反拱</option>
                                    <option value="flat">平底</option>
                                    <option value="hybrid" selected>混合</option>
                                </select>
                            </div>
                        </div>
                    </fieldset>

                    <!-- Section: 适配人群 -->
                    <fieldset class="form-section">
                        <legend>适配人群（推荐引擎用）</legend>
                        <div class="form-group">
                            <label>适合水平 *</label>
                            <div class="checkbox-group" id="lf_skillLevel">
                                ${SnowboardData.SKILL_LEVELS.map(s => `
                                    <label class="checkbox-pill">
                                        <input type="checkbox" value="${escapeHtml(s.value)}">
                                        <span>${escapeHtml(s.icon)} ${escapeHtml(s.name)}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                        <div class="form-group">
                            <label>适合地形 *</label>
                            <div class="checkbox-group" id="lf_terrain">
                                ${SnowboardData.TERRAIN_OPTIONS.map(t => `
                                    <label class="checkbox-pill">
                                        <input type="checkbox" value="${escapeHtml(t.value)}">
                                        <span>${escapeHtml(t.icon)} ${escapeHtml(t.name)}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                        <div class="form-row form-row-4">
                            <div class="form-group">
                                <label>适配身高 min</label>
                                <input type="number" id="lf_heightMin" placeholder="165" min="100" max="220">
                            </div>
                            <div class="form-group">
                                <label>cm max</label>
                                <input type="number" id="lf_heightMax" placeholder="180" min="100" max="220">
                            </div>
                            <div class="form-group">
                                <label>体重 min kg</label>
                                <input type="number" id="lf_weightMin" placeholder="60" min="30" max="200">
                            </div>
                            <div class="form-group">
                                <label>max kg</label>
                                <input type="number" id="lf_weightMax" placeholder="80" min="30" max="200">
                            </div>
                        </div>
                    </fieldset>

                    <!-- Section: 使用情况 -->
                    <fieldset class="form-section">
                        <legend>使用情况</legend>
                        <div class="form-row">
                            <div class="form-group">
                                <label>成色 *</label>
                                <select id="lf_condition" required>
                                    <option value="new">全新</option>
                                    <option value="like-new">9.5 成新</option>
                                    <option value="good" selected>良好</option>
                                    <option value="fair">一般</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>使用年限</label>
                                <input type="number" id="lf_ageYears" min="0" max="20" step="0.5" placeholder="2">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>已知瑕疵</label>
                            <textarea id="lf_defects" rows="2" placeholder="板头有轻微划痕、固定器 logo 褪色等"></textarea>
                        </div>
                        <div class="form-group">
                            <label>详细描述 *</label>
                            <textarea id="lf_description" required rows="4" placeholder="描述板子的使用感受、适合场景、是否有任何特殊故事..."></textarea>
                        </div>
                    </fieldset>

                    <!-- Section: 租赁设置 -->
                    <fieldset class="form-section">
                        <legend>租赁设置</legend>
                        <div class="form-row">
                            <div class="form-group">
                                <label>日租金 (¥) *</label>
                                <input type="number" id="lf_pricePerDay" required min="1" max="10000" placeholder="150">
                            </div>
                            <div class="form-group">
                                <label>押金 (¥) *</label>
                                <input type="number" id="lf_deposit" required min="0" max="50000" placeholder="500">
                            </div>
                            <div class="form-group">
                                <label>所在城市</label>
                                <input type="text" id="lf_city" placeholder="北京">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>最少租期 (天)</label>
                                <input type="number" id="lf_minDays" min="1" max="30" value="1">
                            </div>
                            <div class="form-group">
                                <label>最多租期 (天)</label>
                                <input type="number" id="lf_maxDays" min="1" max="365" value="30">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>交付方式</label>
                            <div class="checkbox-group">
                                <label class="checkbox-pill">
                                    <input type="checkbox" id="lf_selfPickup" checked>
                                    <span>📍 自提</span>
                                </label>
                                <label class="checkbox-pill">
                                    <input type="checkbox" id="lf_shipping">
                                    <span>📦 邮寄</span>
                                </label>
                            </div>
                        </div>
                    </fieldset>

                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" onclick="App.closeModal()">取消</button>
                        <button type="submit" class="btn btn-primary" id="lf_submit">发布</button>
                    </div>
                </form>
            </div>
        `;
        App.showModal(html);
    },

    /**
     * 收集并提交发布表单
     */
    async submitListing() {
        // 收集基础字段
        const data = {
            title: document.getElementById('lf_title')?.value.trim(),
            brand: document.getElementById('lf_brand')?.value.trim(),
            model: document.getElementById('lf_model')?.value.trim() || null,
            year: parseInt(document.getElementById('lf_year')?.value) || null,
            type: document.getElementById('lf_type')?.value,
            length: document.getElementById('lf_length')?.value.trim() || null,
            width: document.getElementById('lf_width')?.value.trim() || null,
            flex: parseInt(document.getElementById('lf_flex')?.value) || 5,
            shape: document.getElementById('lf_shape')?.value,
            camber: document.getElementById('lf_camber')?.value,
            condition: document.getElementById('lf_condition')?.value,
            age_years: parseFloat(document.getElementById('lf_ageYears')?.value) || null,
            defects: document.getElementById('lf_defects')?.value.trim() || null,
            description: document.getElementById('lf_description')?.value.trim(),
            price_per_day: parseInt(document.getElementById('lf_pricePerDay')?.value),
            deposit: parseInt(document.getElementById('lf_deposit')?.value) || 0,
            min_days: parseInt(document.getElementById('lf_minDays')?.value) || 1,
            max_days: parseInt(document.getElementById('lf_maxDays')?.value) || 30,
            shipping: document.getElementById('lf_shipping')?.checked || false,
            self_pickup: document.getElementById('lf_selfPickup')?.checked || true,
            city: document.getElementById('lf_city')?.value.trim() || null,
            // 数组字段
            skill_level: Array.from(document.querySelectorAll('#lf_skillLevel input:checked')).map(el => el.value),
            terrain: Array.from(document.querySelectorAll('#lf_terrain input:checked')).map(el => el.value),
            height_range: this._buildRange('lf_heightMin', 'lf_heightMax'),
            weight_range: this._buildRange('lf_weightMin', 'lf_weightMax'),
            boot_size: this._buildRange('lf_bootMin', 'lf_bootMax')
        };

        // 校验
        if (!data.title || !data.brand || !data.type || !data.description || !data.price_per_day) {
            App.showToast('请填写必填项（标记 * 的字段）', 'error');
            return;
        }
        if (data.skill_level.length === 0) {
            App.showToast('请至少选择一个适合水平', 'error');
            return;
        }
        if (data.terrain.length === 0) {
            App.showToast('请至少选择一个适合地形', 'error');
            return;
        }
        if (data.shipping === false && data.self_pickup === false) {
            App.showToast('至少选择一种交付方式', 'error');
            return;
        }

        const submitBtn = document.getElementById('lf_submit');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '发布中...';
        }

        const result = await createListing(data);
        if (result.success) {
            App.closeModal();
            App.showToast('🎉 发布成功！');
            setTimeout(() => this.showMyListings(), 500);
        } else {
            App.showToast(result.error || '发布失败', 'error');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '发布';
            }
        }
    },

    /**
     * 构造 [min, max] 范围数组
     */
    _buildRange(minId, maxId) {
        const min = parseFloat(document.getElementById(minId)?.value);
        const max = parseFloat(document.getElementById(maxId)?.value);
        if (!isFinite(min) || !isFinite(max) || min <= 0 || max <= 0) return null;
        if (min > max) return null;
        return [min, max];
    },

    /**
     * 我的发布（host 视角）
     */
    async showMyListings() {
        const listings = await getMyListings('active');
        const html = `
            <div class="my-listings">
                <h2 style="text-align: center;">📦 我的发布</h2>
                <p style="text-align: center; color: var(--text-secondary); margin-bottom: 20px;">
                    ${listings.length} 个商品在租
                </p>
                <div class="my-listings-actions">
                    <button class="btn btn-primary" onclick="HostUI.showListingForm()">+ 发布新雪具</button>
                </div>
                <div class="my-listings-list">
                    ${listings.length === 0 ? `
                        <div class="empty-recommendation">
                            <div class="empty-icon">📦</div>
                            <h3>还没有发布任何雪具</h3>
                            <p>把你的闲置雪具租出去赚点外快</p>
                            <button class="btn btn-primary" onclick="HostUI.showListingForm()">发布第一个雪具</button>
                        </div>
                    ` : listings.map(l => this._renderMyListingItem(l)).join('')}
                </div>
            </div>
        `;
        App.showModal(html);
    },

    _renderMyListingItem(l) {
        return `
            <div class="my-listing-item">
                <div class="my-listing-image">${escapeHtml(String(l.images?.[0] || '🏂'))}</div>
                <div class="my-listing-info">
                    <div class="my-listing-title">${escapeHtml(l.title)}</div>
                    <div class="my-listing-meta">
                        <span>¥${escapeHtml(String(l.price_per_day))}/天</span>
                        <span>👁 ${escapeHtml(String(l.view_count || 0))}</span>
                        <span>⭐ ${escapeHtml(String(l.rating || '暂无'))}</span>
                    </div>
                </div>
                <div class="my-listing-actions">
                    <button class="btn btn-sm btn-outline" onclick="HostUI.editListing('${escapeHtml(l.id)}')">编辑</button>
                    <button class="btn btn-sm btn-outline" onclick="HostUI.removeListing('${escapeHtml(l.id)}')">下架</button>
                </div>
            </div>
        `;
    },

    async editListing(listingId) {
        const { getListing } = await import('./api.js');
        const listing = await getListing(listingId);
        if (!listing) {
            App.showToast('找不到该商品', 'error');
            return;
        }
        // 复用 showListingForm 但预填充
        this.showListingForm();
        // 等待 DOM 渲染后填充
        setTimeout(() => {
            if (listing.title) document.getElementById('lf_title').value = listing.title;
            if (listing.brand) document.getElementById('lf_brand').value = listing.brand;
            if (listing.model) document.getElementById('lf_model').value = listing.model;
            if (listing.year) document.getElementById('lf_year').value = listing.year;
            if (listing.type) document.getElementById('lf_type').value = listing.type;
            if (listing.length) document.getElementById('lf_length').value = listing.length;
            if (listing.width) document.getElementById('lf_width').value = listing.width;
            if (listing.flex) document.getElementById('lf_flex').value = listing.flex;
            if (listing.shape) document.getElementById('lf_shape').value = listing.shape;
            if (listing.camber) document.getElementById('lf_camber').value = listing.camber;
            if (listing.condition) document.getElementById('lf_condition').value = listing.condition;
            if (listing.age_years) document.getElementById('lf_ageYears').value = listing.age_years;
            if (listing.defects) document.getElementById('lf_defects').value = listing.defects;
            if (listing.description) document.getElementById('lf_description').value = listing.description;
            if (listing.price_per_day) document.getElementById('lf_pricePerDay').value = listing.price_per_day;
            if (listing.deposit) document.getElementById('lf_deposit').value = listing.deposit;
            if (listing.city) document.getElementById('lf_city').value = listing.city;
            // 数组字段
            (listing.skill_level || []).forEach(s => {
                const el = document.querySelector(`#lf_skillLevel input[value="${s}"]`);
                if (el) el.checked = true;
            });
            (listing.terrain || []).forEach(t => {
                const el = document.querySelector(`#lf_terrain input[value="${t}"]`);
                if (el) el.checked = true;
            });
            // 切换为更新模式
            const submitBtn = document.getElementById('lf_submit');
            if (submitBtn) {
                submitBtn.textContent = '保存修改';
                submitBtn.onclick = () => HostUI.updateExistingListing(listingId);
            }
        }, 100);
    },

    async updateExistingListing(listingId) {
        // 复用 submitListing 但调 updateListing
        const data = this._collectFormData();
        // 校验
        if (!data.title || !data.brand || !data.type || !data.description || !data.price_per_day) {
            App.showToast('请填写必填项', 'error');
            return;
        }
        const result = await updateListing(listingId, data);
        if (result.success) {
            App.closeModal();
            App.showToast('保存成功');
        } else {
            App.showToast(result.error || '保存失败', 'error');
        }
    },

    _collectFormData() {
        return {
            title: document.getElementById('lf_title')?.value.trim(),
            brand: document.getElementById('lf_brand')?.value.trim(),
            model: document.getElementById('lf_model')?.value.trim() || null,
            year: parseInt(document.getElementById('lf_year')?.value) || null,
            type: document.getElementById('lf_type')?.value,
            length: document.getElementById('lf_length')?.value.trim() || null,
            width: document.getElementById('lf_width')?.value.trim() || null,
            flex: parseInt(document.getElementById('lf_flex')?.value) || 5,
            shape: document.getElementById('lf_shape')?.value,
            camber: document.getElementById('lf_camber')?.value,
            condition: document.getElementById('lf_condition')?.value,
            age_years: parseFloat(document.getElementById('lf_ageYears')?.value) || null,
            defects: document.getElementById('lf_defects')?.value.trim() || null,
            description: document.getElementById('lf_description')?.value.trim(),
            price_per_day: parseInt(document.getElementById('lf_pricePerDay')?.value),
            deposit: parseInt(document.getElementById('lf_deposit')?.value) || 0,
            min_days: parseInt(document.getElementById('lf_minDays')?.value) || 1,
            max_days: parseInt(document.getElementById('lf_maxDays')?.value) || 30,
            shipping: document.getElementById('lf_shipping')?.checked || false,
            self_pickup: document.getElementById('lf_selfPickup')?.checked || true,
            city: document.getElementById('lf_city')?.value.trim() || null,
            skill_level: Array.from(document.querySelectorAll('#lf_skillLevel input:checked')).map(el => el.value),
            terrain: Array.from(document.querySelectorAll('#lf_terrain input:checked')).map(el => el.value),
            height_range: this._buildRange('lf_heightMin', 'lf_heightMax'),
            weight_range: this._buildRange('lf_weightMin', 'lf_weightMax'),
            boot_size: this._buildRange('lf_bootMin', 'lf_bootMax')
        };
    },

    async removeListing(listingId) {
        if (!confirm('确定要下架这个雪具吗？')) return;
        const result = await deleteListing(listingId);
        if (result.success) {
            App.showToast('已下架');
            this.showMyListings();
        } else {
            App.showToast(result.error || '操作失败', 'error');
        }
    }
};

// 暴露到全局
window.HostUI = HostUI;