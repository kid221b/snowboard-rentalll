/**
 * 冰雪之巅 - 智能推荐模块
 * 包含规则引擎推荐、板长计算、快速选板问卷
 */

/**
 * HTML 转义，防止 XSS
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

// ============== 板长计算器 ==============
const BoardSizeCalculator = {
    /**
     * 根据身高体重和偏好地形计算推荐板长
     * 公式：基础板长 = 身高(cm)，按体重和偏好地形微调
     * @param {number} height - 身高 cm
     * @param {number} weight - 体重 kg
     * @param {string} terrain - 偏好地形 groomed/park/powder/backcountry
     * @returns {number} 推荐板长 cm
     */
    calculate(height, weight, terrain = 'groomed') {
        if (!height || typeof height !== 'number' || !isFinite(height) || height < 80 || height > 220) return 0;
        let base = height;

        // 体重调整（边界保护：仅当 weight 在合理范围时调整）
        if (weight && typeof weight === 'number' && isFinite(weight) && weight > 0 && weight < 200) {
            if (weight > 85) base += 4;
            else if (weight > 75) base += 2;
            else if (weight < 55) base -= 3;
            else if (weight < 65) base -= 1;
        }

        // 地形调整
        const terrainAdjust = {
            park: -3,        // 公园板短一点好做动作
            groomed: 0,      // 标准
            powder: +3,      // 粉雪要长一点增加浮力
            backcountry: +4  // 野雪更长更稳
        };
        base += terrainAdjust[terrain] || 0;

        // 取整到 2cm
        return Math.round(base / 2) * 2;
    },

    /**
     * 根据推荐板长给出说明
     */
    explain(height, weight, terrain) {
        const length = this.calculate(height, weight, terrain);
        const terrainNames = { park: '公园', groomed: '机压雪道', powder: '粉雪', backcountry: '野雪' };
        const reasons = [];
        if (weight && weight > 85) reasons.push('体重偏重，板长加长增加浮力');
        if (weight && weight < 55) reasons.push('体重偏轻，板长缩短便于控制');
        if (terrain === 'park') reasons.push('公园玩法需要更短的板便于旋转和花式');
        if (terrain === 'powder' || terrain === 'backcountry') reasons.push('粉雪/野雪需要更长板增加浮力');
        if (reasons.length === 0) reasons.push(`基于您的身高 ${height}cm 和默认参数推荐`);
        return {
            length,
            reasons,
            terrainName: terrainNames[terrain] || '通用'
        };
    }
};

// ============== 推荐引擎 ==============
const RecommendationEngine = {
    /**
     * 核心推荐算法 — 基于用户画像打分排序
     * @param {object} profile - {skillLevel, terrain, height, weight, bootSize, gender}
     * @param {Array} products - 候选产品列表
     * @returns {Array} [{product, score, reasons}]
     */
    recommend(profile, products) {
        if (!profile || !products) return [];

        const scored = products.map(product => {
            const result = this._scoreProduct(profile, product);
            return {
                product,
                score: result.score,
                reasons: result.reasons,
                matched: result.matched
            };
        });

        return scored
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score);
    },

    /**
     * 单产品打分
     */
    _scoreProduct(profile, product) {
        let score = 0;
        const reasons = [];
        const matched = [];

        // 1. 技能匹配 (权重 30)
        if (product.skillLevel && product.skillLevel.includes(profile.skillLevel)) {
            const skillWeight = { beginner: 30, intermediate: 30, advanced: 30, expert: 30 };
            score += skillWeight[profile.skillLevel] || 30;
            matched.push('skill');
            const levelName = { beginner: '新手', intermediate: '初中级', advanced: '中高级', expert: '专业' }[profile.skillLevel];
            reasons.push(`✓ 适合${levelName}水平`);
        } else if (product.skillLevel) {
            // 技能不匹配时降权
            score -= 10;
        }

        // 2. 地形匹配 (权重 25)
        if (product.terrain && profile.terrain) {
            const terrainMatch = product.terrain.filter(t => profile.terrain.includes(t));
            if (terrainMatch.length > 0) {
                score += 25 * terrainMatch.length;
                matched.push('terrain');
                const terrainNames = { groomed: '机压雪道', park: '公园', powder: '粉雪', backcountry: '野雪' };
                terrainMatch.forEach(t => {
                    reasons.push(`✓ 适合${terrainNames[t] || t}`);
                });
            }
        }

        // 3. 身高匹配 (权重 20)
        if (product.heightRange && profile.height) {
            if (profile.height >= product.heightRange[0] && profile.height <= product.heightRange[1]) {
                score += 20;
                matched.push('height');
                reasons.push(`✓ 身高 ${profile.height}cm 在适配范围`);
            } else {
                // 偏离越大扣分越多
                const minDist = Math.min(
                    Math.abs(profile.height - product.heightRange[0]),
                    Math.abs(profile.height - product.heightRange[1])
                );
                if (minDist > 10) score -= 15;
                else score -= 5;
            }
        }

        // 4. 体重匹配 (权重 10)
        if (product.weightRange && profile.weight) {
            if (profile.weight >= product.weightRange[0] && profile.weight <= product.weightRange[1]) {
                score += 10;
                matched.push('weight');
            }
        }

        // 5. 雪鞋尺码匹配 (权重 5)
        if (product.bootSize && profile.bootSize) {
            if (profile.bootSize >= product.bootSize[0] && profile.bootSize <= product.bootSize[1]) {
                score += 5;
            }
        }

        // 6. 性别匹配 (女士板专属加分)
        if (profile.gender === 'female' && product.type === 'women') {
            score += 15;
            matched.push('gender');
            reasons.push('✓ 女士专用设计');
        } else if (profile.gender === 'male' && product.type === 'women') {
            score -= 20; // 男生选女士板不推荐
        }

        // 7. 库存加分（有货加 5 分）
        if (product.stock > 0) {
            score += 5;
        } else {
            score -= 50; // 缺货严重扣分
        }

        // 8. 销量口碑加分 (权重 5)
        if (product.sales > 100) {
            score += 5;
        }
        if (product.rating && product.rating >= 4.7) {
            score += 3;
            reasons.push(`✓ 高分好评 ${product.rating}/5`);
        }

        return { score, reasons, matched };
    },

    /**
     * 快速推荐（仅技能+地形，无身材数据）
     * 用于产品列表 tab 切换
     */
    quickRecommend(skillLevel, terrain, products) {
        return this.recommend(
            { skillLevel, terrain: terrain ? [terrain] : null },
            products
        );
    }
};

// ============== 用户问卷状态 ==============
const RecommendationState = {
    currentProfile: null,

    save(profile) {
        this.currentProfile = profile;
        try {
            localStorage.setItem('snowboard_user_profile', JSON.stringify(profile));
        } catch (e) {}
    },

    load() {
        if (this.currentProfile) return this.currentProfile;
        try {
            const data = localStorage.getItem('snowboard_user_profile');
            if (data) {
                this.currentProfile = JSON.parse(data);
                return this.currentProfile;
            }
        } catch (e) {}
        return null;
    },

    clear() {
        this.currentProfile = null;
        try {
            localStorage.removeItem('snowboard_user_profile');
        } catch (e) {}
    }
};

// ============== 快速问卷 UI ==============
const RecommendationWizard = {
    step: 1,
    totalSteps: 3,
    answers: {},

    /**
     * 打开推荐问卷弹窗
     */
    show() {
        this.step = 1;
        // 状态恢复：标记已选答案
        const step1 = `
            <h2 style="text-align: center; margin-bottom: 8px;">🏂 找到适合你的单板</h2>
            <p style="text-align: center; color: var(--text-secondary); margin-bottom: 24px;">回答 3 个简单问题，AI 帮你智能推荐</p>
            <div class="wizard-progress">
                <div class="wizard-step active" data-step="1">1</div>
                <div class="wizard-line"></div>
                <div class="wizard-step" data-step="2">2</div>
                <div class="wizard-line"></div>
                <div class="wizard-step" data-step="3">3</div>
            </div>
            <div class="wizard-content">
                <h3>你的滑雪水平是？</h3>
                <div class="wizard-options" id="wizardSkillOptions">
                    ${SnowboardData.SKILL_LEVELS.map(s => `
                        <div class="wizard-option" data-value="${escapeHtml(String(s.value))}" onclick="RecommendationWizard.selectSkill('${escapeHtml(String(s.value))}', this)">
                            <div class="wizard-option-icon">${escapeHtml(String(s.icon))}</div>
                            <div class="wizard-option-name">${escapeHtml(s.name)}</div>
                            <div class="wizard-option-desc">${escapeHtml(s.desc)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        App.showModal(step1);
        // 恢复已选
        if (this.answers.skillLevel) {
            const el = document.querySelector(`#wizardSkillOptions [data-value="${this.answers.skillLevel}"]`);
            if (el) el.classList.add('selected');
        }
    },

    selectSkill(value, el) {
        this.answers.skillLevel = value;
        document.querySelectorAll('#wizardSkillOptions .wizard-option').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
        setTimeout(() => this.next(), 300);
    },

    next() {
        this.step++;
        if (this.step === 2) {
            this._renderStep2();
        } else if (this.step === 3) {
            this._renderStep3();
        }
    },

    prev() {
        this.step--;
        if (this.step === 1) this.show();
        else if (this.step === 2) this._renderStep2();
    },

    _updateProgress() {
        document.querySelectorAll('.wizard-step').forEach(s => {
            const stepNum = parseInt(s.dataset.step);
            s.classList.remove('active', 'completed');
            if (stepNum === this.step) s.classList.add('active');
            else if (stepNum < this.step) s.classList.add('completed');
        });
    },

    _renderStep2() {
        this._updateProgress();
        const html = `
            <h2 style="text-align: center; margin-bottom: 8px;">🏂 找到适合你的单板</h2>
            <p style="text-align: center; color: var(--text-secondary); margin-bottom: 24px;">第 2 步 / 共 3 步</p>
            <div class="wizard-progress">
                <div class="wizard-step completed" data-step="1">1</div>
                <div class="wizard-line active"></div>
                <div class="wizard-step active" data-step="2">2</div>
                <div class="wizard-line"></div>
                <div class="wizard-step" data-step="3">3</div>
            </div>
            <div class="wizard-content">
                <h3>你最想去哪种地形玩？<br><small style="color: var(--text-secondary); font-weight: 400;">（可多选）</small></h3>
                <div class="wizard-options" id="wizardTerrainOptions">
                    ${SnowboardData.TERRAIN_OPTIONS.map(t => `
                        <div class="wizard-option" data-value="${escapeHtml(String(t.value))}" onclick="RecommendationWizard.toggleTerrain('${escapeHtml(String(t.value))}', this)">
                            <div class="wizard-option-icon">${escapeHtml(String(t.icon))}</div>
                            <div class="wizard-option-name">${escapeHtml(t.name)}</div>
                            <div class="wizard-option-desc">${escapeHtml(t.desc)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="wizard-actions">
                <button class="btn btn-outline" onclick="RecommendationWizard.prev()">上一步</button>
                <button class="btn btn-primary" onclick="RecommendationWizard.next()" id="wizardStep2Next" ${(this.answers.terrain && this.answers.terrain.length > 0) ? '' : 'disabled'}>下一步</button>
            </div>
        `;
        App.showModal(html);
        // 恢复已选
        if (this.answers.terrain) {
            this.answers.terrain.forEach(v => {
                const el = document.querySelector(`#wizardTerrainOptions [data-value="${v}"]`);
                if (el) el.classList.add('selected');
            });
        }
    },

    toggleTerrain(value, el) {
        if (!this.answers.terrain) this.answers.terrain = [];
        const idx = this.answers.terrain.indexOf(value);
        if (idx >= 0) {
            this.answers.terrain.splice(idx, 1);
            el.classList.remove('selected');
        } else {
            this.answers.terrain.push(value);
            el.classList.add('selected');
        }
        const nextBtn = document.getElementById('wizardStep2Next');
        if (nextBtn) nextBtn.disabled = this.answers.terrain.length === 0;
    },

    _renderStep3() {
        this._updateProgress();
        const html = `
            <h2 style="text-align: center; margin-bottom: 8px;">🏂 找到适合你的单板</h2>
            <p style="text-align: center; color: var(--text-secondary); margin-bottom: 24px;">第 3 步 / 共 3 步</p>
            <div class="wizard-progress">
                <div class="wizard-step completed" data-step="1">1</div>
                <div class="wizard-line active"></div>
                <div class="wizard-step completed" data-step="2">2</div>
                <div class="wizard-line active"></div>
                <div class="wizard-step active" data-step="3">3</div>
            </div>
            <div class="wizard-content">
                <h3>补充信息（可选，让推荐更精准）</h3>
                <div class="form-group">
                    <label>性别</label>
                    <div class="gender-options" id="wizardGenderOptions">
                        <div class="wizard-option-small" data-value="male" onclick="RecommendationWizard.selectGender('male', this)">
                            👨 男士
                        </div>
                        <div class="wizard-option-small" data-value="female" onclick="RecommendationWizard.selectGender('female', this)">
                            👩 女士
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label>身高 (cm)</label>
                    <input type="number" id="wizardHeight" placeholder="例如 175" min="100" max="220">
                </div>
                <div class="form-group">
                    <label>体重 (kg)</label>
                    <input type="number" id="wizardWeight" placeholder="例如 70" min="30" max="200">
                </div>
                <div class="form-group">
                    <label>雪鞋尺码 (欧码，可选)</label>
                    <input type="number" id="wizardBootSize" placeholder="例如 42" min="30" max="50">
                </div>
            </div>
            <div class="wizard-actions">
                <button class="btn btn-outline" onclick="RecommendationWizard.prev()">上一步</button>
                <button class="btn btn-primary" onclick="RecommendationWizard.finish()">查看推荐</button>
            </div>
        `;
        App.showModal(html);
    },

    selectGender(value, el) {
        this.answers.gender = value;
        document.querySelectorAll('#wizardGenderOptions .wizard-option-small').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
    },

    /**
     * 提交问卷，跳转到推荐结果
     */
    finish() {
        // 严格数值解析：parseFloat + 边界校验 + 拒绝 0/负数
        const numOrNull = (id) => {
            const el = document.getElementById(id);
            const v = el ? parseFloat(el.value) : NaN;
            return Number.isFinite(v) && v > 0 ? Math.round(v) : null;
        };
        const profile = {
            ...this.answers,
            height: numOrNull('wizardHeight'),
            weight: numOrNull('wizardWeight'),
            bootSize: numOrNull('wizardBootSize')
        };

        RecommendationState.save(profile);
        App.closeModal();
        App.showToast('推荐生成中...');
        setTimeout(() => this.showResults(profile), 200);
    },

    /**
     * 展示推荐结果
     */
    showResults(profile) {
        const products = SnowboardData.getProducts();
        const recommendations = RecommendationEngine.recommend(profile, products);
        const top3 = recommendations.slice(0, 3);

        // 计算推荐板长
        const sizeCalc = profile.height ? BoardSizeCalculator.explain(
            profile.height,
            profile.weight,
            profile.terrain && profile.terrain[0]
        ) : null;

        const skillName = SnowboardData.SKILL_LEVELS.find(s => s.value === profile.skillLevel)?.name || '';
        const terrainNames = profile.terrain ? profile.terrain.map(t =>
            SnowboardData.TERRAIN_OPTIONS.find(o => o.value === t)?.name || t
        ).join('、') : '';

        const html = `
            <h2 style="text-align: center; margin-bottom: 8px;">🎯 为你推荐</h2>
            <p style="text-align: center; color: var(--text-secondary); margin-bottom: 20px;">
                基于 <strong>${escapeHtml(skillName)}</strong> · <strong>${escapeHtml(terrainNames)}</strong> 智能匹配
            </p>
            ${sizeCalc ? `
                <div class="size-recommendation">
                    <div class="size-recommendation-title">📏 推荐板长</div>
                    <div class="size-recommendation-value">${escapeHtml(String(sizeCalc.length))} cm</div>
                    <div class="size-recommendation-reasons">
                        ${sizeCalc.reasons.map(r => `<span class="size-reason">${escapeHtml(r)}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
            <div class="recommendation-list">
                ${top3.map((rec, idx) => this._renderRecommendationCard(rec, idx + 1)).join('')}
            </div>
            <div class="wizard-actions">
                <button class="btn btn-outline" onclick="RecommendationWizard.show()">重新测试</button>
                <button class="btn btn-primary" onclick="App.closeModal(); App.navigateTo('products');">查看全部装备</button>
            </div>
        `;
        App.showModal(html);
    },

    _renderRecommendationCard(rec, rank) {
        const product = rec.product;
        const typeConfig = SnowboardData.TYPE_CONFIG[product.type] || {};
        return `
            <div class="recommendation-card rank-${rank}" onclick="App.closeModal(); App.showProductDetail('${escapeHtml(product.id)}');">
                <div class="recommendation-rank">No.${rank}</div>
                <div class="recommendation-image">${escapeHtml(String(product.images?.[0] || '🏂'))}</div>
                <div class="recommendation-info">
                    <div class="recommendation-type">${escapeHtml(String(typeConfig.icon || ''))} ${escapeHtml(typeConfig.name || product.type)} · ${escapeHtml(product.brand)}</div>
                    <div class="recommendation-name">${escapeHtml(product.name)}</div>
                    <div class="recommendation-reasons">
                        ${rec.reasons.slice(0, 3).map(r => `<span class="rec-reason">${escapeHtml(r)}</span>`).join('')}
                    </div>
                    <div class="recommendation-meta">
                        <span>📏 ${escapeHtml(String(product.length))}</span>
                        <span>💪 硬度 ${escapeHtml(String(product.flex))}/10</span>
                        <span class="recommendation-price">¥${escapeHtml(String(product.price))}/天</span>
                    </div>
                </div>
            </div>
        `;
    }
};

// 暴露到全局
window.BoardSizeCalculator = BoardSizeCalculator;
window.RecommendationEngine = RecommendationEngine;
window.RecommendationState = RecommendationState;
window.RecommendationWizard = RecommendationWizard;