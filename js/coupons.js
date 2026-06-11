/**
 * 冰雪之巅 - 优惠券模块
 * 4 种类型：
 * 1. fixed：满减券（满 X 减 Y）
 * 2. percent：折扣券（X 折）
 * 3. shipping：免运费券
 * 4. newuser：新人专享（注册自动发放）
 *
 * 数据存储：localStorage（mock，等 Supabase 后端接 user_coupons 表）
 */

const Coupons = {
    STORAGE_KEY: 'snowboard_coupons',
    USER_COUPONS_KEY: 'snowboard_user_coupons',
    APPLIED_KEY: 'snowboard_applied_coupon',

    /**
     * 内置优惠券模板（前台可领取 / 自动发放）
     */
    TEMPLATES: [
        {
            code: 'WELCOME50',
            name: '新人专享 50 元券',
            type: 'newuser',
            amount: 50,
            minSpend: 200,
            expiresAt: '2026-12-31',
            description: '注册后自动发放，租赁满 200 立减 50',
            autoIssue: true
        },
        {
            code: 'SAVE20',
            name: '满 500 减 20',
            type: 'fixed',
            amount: 20,
            minSpend: 500,
            expiresAt: '2026-12-31',
            description: '租赁满 500 元立减 20'
        },
        {
            code: 'WEEKEND9',
            name: '周末 9 折',
            type: 'percent',
            discount: 0.9,  // 9 折
            minSpend: 0,
            expiresAt: '2026-12-31',
            description: '周末租赁 9 折优惠'
        },
        {
            code: 'FREESHIP',
            name: '免运费',
            type: 'shipping',
            amount: 0,
            minSpend: 0,
            expiresAt: '2026-12-31',
            description: '雪场直送 / 快递免运费'
        },
        {
            code: 'BIG500',
            name: '满 1000 减 100',
            type: 'fixed',
            amount: 100,
            minSpend: 1000,
            expiresAt: '2026-12-31',
            description: '租赁满 1000 元立减 100'
        }
    ],

    /**
     * 用户已领取的优惠券
     */
    getUserCoupons() {
        try {
            return JSON.parse(localStorage.getItem(this.USER_COUPONS_KEY) || '[]');
        } catch {
            return [];
        }
    },

    /**
     * 保存用户优惠券
     */
    saveUserCoupons(coupons) {
        localStorage.setItem(this.USER_COUPONS_KEY, JSON.stringify(coupons));
    },

    /**
     * 给用户发放优惠券（注册时自动调用）
     */
    issueCoupon(code) {
        const template = this.TEMPLATES.find(t => t.code === code);
        if (!template) return false;

        const userCoupons = this.getUserCoupons();
        // 去重
        if (userCoupons.some(c => c.code === code)) return false;

        userCoupons.push({
            ...template,
            issuedAt: new Date().toISOString(),
            status: 'available'
        });
        this.saveUserCoupons(userCoupons);
        return true;
    },

    /**
     * 新人注册时自动发放
     */
    issueNewUserCoupons() {
        const newuserTemplates = this.TEMPLATES.filter(t => t.autoIssue);
        newuserTemplates.forEach(t => this.issueCoupon(t.code));
    },

    /**
     * 按 code 查找模板
     */
    findByCode(code) {
        return this.TEMPLATES.find(t => t.code === code);
    },

    /**
     * 应用优惠券（输入 code）
     */
    applyCoupon(code) {
        const template = this.findByCode(code);
        if (!template) {
            return { success: false, error: '优惠码无效' };
        }
        if (template.expiresAt && new Date(template.expiresAt) < new Date()) {
            return { success: false, error: '优惠券已过期' };
        }
        // 自动加入用户券
        this.issueCoupon(code);
        // 存到应用
        localStorage.setItem(this.APPLIED_KEY, code);
        return { success: true, coupon: template };
    },

    /**
     * 取消已应用
     */
    unapplyCoupon() {
        localStorage.removeItem(this.APPLIED_KEY);
    },

    /**
     * 读取当前应用的优惠券
     */
    getAppliedCoupon() {
        const code = localStorage.getItem(this.APPLIED_KEY);
        if (!code) return null;
        return this.findByCode(code);
    },

    /**
     * 计算折扣
     * @param {object} orderSummary { subtotal, deliveryFee, accessoryTotal }
     * @param {object} coupon
     * @returns {object} { discountAmount, freeShipping, finalTotal }
     */
    calculateDiscount(orderSummary, coupon) {
        if (!coupon) return { discountAmount: 0, freeShipping: false, finalTotal: orderSummary.subtotal + orderSummary.deliveryFee + orderSummary.accessoryTotal };

        let discountAmount = 0;
        let freeShipping = false;

        // 满减门槛校验
        if (coupon.minSpend && orderSummary.subtotal < coupon.minSpend) {
            return {
                discountAmount: 0,
                freeShipping: false,
                finalTotal: orderSummary.subtotal + orderSummary.deliveryFee + orderSummary.accessoryTotal,
                belowMinSpend: true,
                minSpend: coupon.minSpend
            };
        }

        switch (coupon.type) {
            case 'fixed':
                discountAmount = coupon.amount;
                break;
            case 'percent':
                discountAmount = orderSummary.subtotal * (1 - coupon.discount);
                break;
            case 'shipping':
                freeShipping = true;
                break;
            case 'newuser':
                discountAmount = coupon.amount;
                break;
        }

        const finalDelivery = freeShipping ? 0 : orderSummary.deliveryFee;
        const finalTotal = orderSummary.subtotal - discountAmount + finalDelivery + orderSummary.accessoryTotal;
        return { discountAmount, freeShipping, finalTotal, finalDelivery };
    },

    /**
     * 渲染优惠券输入 UI
     */
    renderCouponInput() {
        const applied = this.getAppliedCoupon();
        return `
            <div class="coupon-section" id="couponSection">
                <div class="coupon-input-row">
                    <input type="text" id="couponCodeInput" placeholder="${window.I18N ? I18N.t('coupon.inputPlaceholder') : '输入优惠码'}" class="coupon-input" value="${applied ? applied.code : ''}">
                    <button type="button" class="coupon-apply-btn" onclick="Coupons.handleApply()">${window.I18N ? I18N.t('coupon.apply') : '应用'}</button>
                </div>
                ${applied ? `
                    <div class="coupon-applied">
                        ✓ ${this.escapeHtml(applied.name)} - ${this.getCouponDescription(applied)}
                        <button type="button" class="coupon-remove" onclick="Coupons.unapplyCoupon(); OrderFlow.refreshSummary();" aria-label="取消优惠">×</button>
                    </div>
                ` : ''}
                <div id="couponHint" class="coupon-hint"></div>
            </div>
        `;
    },

    /**
     * 处理应用按钮点击
     */
    handleApply() {
        const input = document.getElementById('couponCodeInput');
        if (!input) return;
        const code = input.value.trim().toUpperCase();
        if (!code) return;

        const result = this.applyCoupon(code);
        const hint = document.getElementById('couponHint');
        if (result.success) {
            if (hint) hint.innerHTML = `<span style="color: var(--success-color);">✓ ${this.escapeHtml(result.coupon.name)}</span>`;
            if (window.App && App.showToast) {
                App.showToast('优惠券已应用');
            }
            // 重新渲染并刷新订单摘要
            if (window.OrderFlow) {
                const section = document.getElementById('couponSection');
                if (section) {
                    section.outerHTML = this.renderCouponInput();
                }
                OrderFlow.refreshSummary();
            }
        } else {
            if (hint) hint.innerHTML = `<span style="color: var(--danger-color);">✗ ${this.escapeHtml(result.error)}</span>`;
        }
    },

    /**
     * 优惠描述
     */
    getCouponDescription(coupon) {
        if (coupon.type === 'fixed' || coupon.type === 'newuser') {
            return `立减 ¥${coupon.amount}`;
        }
        if (coupon.type === 'percent') {
            return `${(coupon.discount * 10).toFixed(1)} 折`;
        }
        if (coupon.type === 'shipping') {
            return '免运费';
        }
        return '';
    },

    /**
     * 渲染"我的优惠券"列表
     */
    renderMyCouponsList() {
        const userCoupons = this.getUserCoupons();
        if (userCoupons.length === 0) {
            return `<div class="empty-coupons">还没有优惠券。新用户注册后自动发放 50 元券。</div>`;
        }
        return `
            <div class="coupon-cards">
                ${userCoupons.map(c => `
                    <div class="coupon-card ${c.status === 'used' ? 'used' : ''}">
                        <div class="coupon-card-amount">${c.type === 'percent' ? (c.discount * 10).toFixed(1) + '折' : '¥' + c.amount}</div>
                        <div class="coupon-card-info">
                            <div class="coupon-card-name">${this.escapeHtml(c.name)}</div>
                            <div class="coupon-card-condition">${this.escapeHtml(c.description)}</div>
                            <div class="coupon-card-expire">至 ${c.expiresAt}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }
};

window.Coupons = Coupons;
