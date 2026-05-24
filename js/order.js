/**
 * 冰雪之巅 - 订单流程模块
 * 负责租赁日期选择、配件选择、个人信息填写、订单确认和提交
 */

import { createOrder, updateOrderStatus, getAllOrders } from './api.js';

const OrderFlow = {
    // 当前步骤
    currentStep: 1,
    totalSteps: 4,

    // 租赁信息
    rentStartDate: '',
    rentEndDate: '',
    rentDays: 0,

    // 已选配件
    selectedAccessories: [],

    // 个人信息
    personalInfo: {
        name: '',
        phone: '',
        idCard: '',
        pickupType: 'store',
        deliveryAddress: '',
        remarks: ''
    },

    /**
     * 初始化订单流程
     */
    init() {
        this.currentStep = 1;
        this.updateStepUI();
        this.loadCartData();
        this.initStep1();
        this.initStep2();
        this.initStep3();
    },

    /**
     * 加载购物车数据
     */
    loadCartData() {
        // 如果有默认套餐天数，设置日期范围
        const packageDays = Cart.getPackageDays();
        if (packageDays > 0) {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + packageDays);
            this.rentStartDate = App.formatDate(startDate);
            this.rentEndDate = App.formatDate(endDate);
        }
    },

    /**
     * 初始化步骤1
     */
    initStep1() {
        const startDateInput = document.getElementById('rentStartDate');
        const endDateInput = document.getElementById('rentEndDate');

        if (startDateInput && this.rentStartDate) {
            startDateInput.value = this.rentStartDate;
        }
        if (endDateInput && this.rentEndDate) {
            endDateInput.value = this.rentEndDate;
        }

        // 渲染价格日历
        this.renderPriceCalendar();

        // 更新天数显示
        this.updateDays();
    },

    /**
     * 更新租赁天数
     */
    updateDays() {
        const startDateInput = document.getElementById('rentStartDate');
        const endDateInput = document.getElementById('rentEndDate');
        const daysDisplay = document.getElementById('selectedDays');

        if (startDateInput && endDateInput) {
            this.rentStartDate = startDateInput.value;
            this.rentEndDate = endDateInput.value;

            if (this.rentStartDate && this.rentEndDate) {
                const start = new Date(this.rentStartDate);
                const end = new Date(this.rentEndDate);
                const diffTime = end - start;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > 0) {
                    this.rentDays = diffDays;
                    if (daysDisplay) {
                        daysDisplay.textContent = diffDays;
                    }
                    this.highlightCalendarDays(diffDays);
                } else {
                    this.rentDays = 0;
                    if (daysDisplay) {
                        daysDisplay.textContent = '0';
                    }
                }
            }
        }
    },

    /**
     * 渲染价格日历
     */
    renderPriceCalendar() {
        const container = document.getElementById('priceCalendar');
        if (!container) return;

        const cart = SnowboardData.getCart();
        let avgPrice = 150; // 默认价格

        if (cart.length > 0) {
            let total = 0;
            cart.forEach(item => {
                const product = SnowboardData.getProduct(item.productId);
                if (product) {
                    total += product.price * item.quantity;
                }
            });
            avgPrice = total / cart.length;
        }

        // 生成最近14天的日历
        const today = new Date();
        let calendarHTML = '';

        for (let i = 0; i < 14; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            const dateStr = App.formatDate(date);
            const dayName = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];

            calendarHTML += `
                <div class="calendar-day" data-date="${dateStr}">
                    <div class="day">${date.getMonth() + 1}/${date.getDate()} ${dayName}</div>
                    <div class="price">¥${Math.round(avgPrice)}</div>
                </div>
            `;
        }

        container.innerHTML = calendarHTML;
    },

    /**
     * 高亮显示租赁天数
     */
    highlightCalendarDays(days) {
        const calendarDays = document.querySelectorAll('.calendar-day');
        const today = new Date();

        calendarDays.forEach((day, index) => {
            if (index < days) {
                day.classList.add('highlight');
            } else {
                day.classList.remove('highlight');
            }
        });
    },

    /**
     * 初始化步骤2
     */
    initStep2() {
        const container = document.getElementById('accessoryList');
        if (!container) return;

        const accessories = SnowboardData.getAccessories();

        container.innerHTML = accessories.map(acc => `
            <div class="accessory-item" data-id="${acc.id}" onclick="OrderFlow.toggleAccessory('${acc.id}')">
                <input type="checkbox" ${this.selectedAccessories.find(a => a.id === acc.id) ? 'checked' : ''}>
                <div class="accessory-info">
                    <div class="accessory-name">${acc.name}</div>
                    <div class="accessory-desc">${acc.description}</div>
                </div>
                <div class="accessory-price">¥${acc.price}/天</div>
            </div>
        `).join('');
    },

    /**
     * 切换配件选择
     */
    toggleAccessory(accessoryId) {
        const accessories = SnowboardData.getAccessories();
        const accessory = accessories.find(a => a.id === accessoryId);

        if (!accessory) return;

        const index = this.selectedAccessories.findIndex(a => a.id === accessoryId);

        if (index !== -1) {
            this.selectedAccessories.splice(index, 1);
        } else {
            this.selectedAccessories.push({ ...accessory, quantity: 1 });
        }

        this.initStep2();
    },

    /**
     * 初始化步骤3
     */
    initStep3() {
        const pickupType = document.getElementById('pickupType');
        const deliveryAddressGroup = document.getElementById('deliveryAddressGroup');

        if (pickupType && deliveryAddressGroup) {
            pickupType.addEventListener('change', () => {
                if (pickupType.value === 'delivery') {
                    deliveryAddressGroup.style.display = 'flex';
                } else {
                    deliveryAddressGroup.style.display = 'none';
                }
            });
        }

        // 加载保存的个人信息
        const savedInfo = SnowboardData.getUserInfo();
        if (savedInfo) {
            this.personalInfo = savedInfo;
            document.getElementById('userName').value = savedInfo.name || '';
            document.getElementById('userPhone').value = savedInfo.phone || '';
            document.getElementById('userIdCard').value = savedInfo.idCard || '';
            document.getElementById('userRemarks').value = savedInfo.remarks || '';
        }
    },

    /**
     * 收集个人信息
     */
    collectPersonalInfo() {
        this.personalInfo = {
            name: document.getElementById('userName')?.value || '',
            phone: document.getElementById('userPhone')?.value || '',
            idCard: document.getElementById('userIdCard')?.value || '',
            pickupType: document.getElementById('pickupType')?.value || 'store',
            deliveryAddress: document.getElementById('deliveryAddress')?.value || '',
            remarks: document.getElementById('userRemarks')?.value || ''
        };

        // 保存个人信息
        SnowboardData.saveUserInfo(this.personalInfo);

        return this.personalInfo;
    },

    /**
     * 验证个人信息
     */
    validatePersonalInfo() {
        const info = this.personalInfo;
        const errors = [];

        if (!info.name || info.name.trim() === '') {
            errors.push('请输入姓名');
        }

        if (!info.phone || !/^1[3-9]\d{9}$/.test(info.phone)) {
            errors.push('请输入正确的手机号');
        }

        if (info.pickupType === 'delivery' && (!info.deliveryAddress || info.deliveryAddress.trim() === '')) {
            errors.push('请输入配送地址');
        }

        return errors;
    },

    /**
     * 初始化步骤4
     */
    initStep4() {
        const container = document.getElementById('orderConfirm');
        if (!container) return;

        const cart = SnowboardData.getCart();
        let cartHTML = '';
        let subtotal = 0;
        let deposit = 0;

        cart.forEach(item => {
            const product = SnowboardData.getProduct(item.productId);
            if (product) {
                subtotal += product.price * item.quantity;
                deposit += product.deposit * item.quantity;
                cartHTML += `
                    <div class="item-row">
                        <span>${product.name} × ${item.quantity}</span>
                        <span>¥${product.price * this.rentDays} (${this.rentDays}天)</span>
                    </div>
                `;
            }
        });

        // 配件费用
        let accessoryTotal = 0;
        this.selectedAccessories.forEach(acc => {
            accessoryTotal += acc.price * this.rentDays;
        });
        if (this.selectedAccessories.length > 0) {
            cartHTML += `
                <div class="item-row">
                    <span>配件 (${this.selectedAccessories.length}件)</span>
                    <span>¥${accessoryTotal}</span>
                </div>
            `;
        }

        const discount = Cart.getPackageDiscount();
        const total = Math.round((subtotal + accessoryTotal) * this.rentDays * discount);
        const savings = Math.round((subtotal + accessoryTotal) * this.rentDays * (1 - discount));

        container.innerHTML = `
            <div class="order-confirm-section">
                <h4>📅 租赁信息</h4>
                <div class="item-row">
                    <span>租赁日期</span>
                    <span>${this.rentStartDate} 至 ${this.rentEndDate}</span>
                </div>
                <div class="item-row">
                    <span>租赁天数</span>
                    <span>${this.rentDays} 天</span>
                </div>
            </div>

            <div class="order-confirm-section">
                <h4>🏂 租赁装备</h4>
                ${cartHTML}
            </div>

            <div class="order-confirm-section">
                <h4>📋 个人信息</h4>
                <div class="item-row">
                    <span>姓名</span>
                    <span>${this.personalInfo.name}</span>
                </div>
                <div class="item-row">
                    <span>手机号</span>
                    <span>${this.personalInfo.phone}</span>
                </div>
                <div class="item-row">
                    <span>取板方式</span>
                    <span>${this.personalInfo.pickupType === 'delivery' ? '雪场直送' : '门店自取'}</span>
                </div>
                ${this.personalInfo.pickupType === 'delivery' ? `
                    <div class="item-row">
                        <span>配送地址</span>
                        <span>${this.personalInfo.deliveryAddress}</span>
                    </div>
                ` : ''}
            </div>

            <div class="order-confirm-section">
                <h4>💰 费用明细</h4>
                <div class="item-row">
                    <span>租金合计</span>
                    <span>¥${total + savings}</span>
                </div>
                ${savings > 0 ? `
                    <div class="item-row" style="color: var(--success-color);">
                        <span>套餐优惠</span>
                        <span>-¥${savings}</span>
                    </div>
                ` : ''}
                <div class="item-row">
                    <span>押金（可退）</span>
                    <span>¥${deposit}</span>
                </div>
                <div class="item-row total">
                    <span>应付总额</span>
                    <span>¥${total + deposit}</span>
                </div>
            </div>
        `;
    },

    /**
     * 更新步骤 UI
     */
    updateStepUI() {
        const steps = document.querySelectorAll('.checkout-step');
        const prevBtn = document.getElementById('prevStepBtn');
        const nextBtn = document.getElementById('nextStepBtn');
        const submitBtn = document.getElementById('submitOrderBtn');

        // 更新步骤状态
        steps.forEach((step, index) => {
            const stepNum = index + 1;
            step.classList.remove('active');
            if (stepNum === this.currentStep) {
                step.classList.add('active');
            }
        });

        // 更新步骤进度
        document.querySelectorAll('.checkout-steps .step').forEach((step, index) => {
            const stepNum = index + 1;
            step.classList.remove('active', 'completed');
            if (stepNum === this.currentStep) {
                step.classList.add('active');
            } else if (stepNum < this.currentStep) {
                step.classList.add('completed');
            }
        });

        // 更新按钮状态
        if (prevBtn) {
            prevBtn.style.display = this.currentStep > 1 ? 'inline-flex' : 'none';
        }

        if (nextBtn) {
            nextBtn.style.display = this.currentStep < this.totalSteps ? 'inline-flex' : 'none';
        }

        if (submitBtn) {
            submitBtn.style.display = this.currentStep === this.totalSteps ? 'inline-flex' : 'none';
        }
    },

    /**
     * 下一步
     */
    nextStep() {
        // 验证当前步骤
        if (!this.validateCurrentStep()) {
            return;
        }

        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateStepUI();

            // 如果是步骤3结束时，收集信息并显示确认
            if (this.currentStep === 4) {
                this.collectPersonalInfo();
                this.initStep4();
            }
        }
    },

    /**
     * 上一步
     */
    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepUI();
        }
    },

    /**
     * 验证当前步骤
     */
    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                // 验证日期选择
                if (!this.rentStartDate || !this.rentEndDate || this.rentDays <= 0) {
                    App.showToast('请选择租赁日期', 'error');
                    return false;
                }
                return true;

            case 2:
                // 配件选择无需验证
                return true;

            case 3:
                // 收集并验证个人信息
                this.collectPersonalInfo();
                const errors = this.validatePersonalInfo();
                if (errors.length > 0) {
                    App.showToast(errors[0], 'error');
                    return false;
                }
                return true;

            default:
                return true;
        }
    },

    /**
     * 提交订单
     */
    async submitOrder() {
        // 检查同意协议
        const agreeCheckbox = document.getElementById('agreeTerms');
        if (agreeCheckbox && !agreeCheckbox.checked) {
            App.showToast('请阅读并同意租赁协议', 'error');
            return;
        }

        const cart = SnowboardData.getCart();
        if (cart.length === 0) {
            App.showToast('购物车为空', 'error');
            return;
        }

        // 收集个人信息
        this.collectPersonalInfo();
        const errors = this.validatePersonalInfo();
        if (errors.length > 0) {
            App.showToast(errors[0], 'error');
            return;
        }

        // 计算费用
        let subtotal = 0;
        let deposit = 0;
        const items = [];

        cart.forEach(item => {
            const product = SnowboardData.getProduct(item.productId);
            if (product) {
                subtotal += product.price * item.quantity;
                deposit += product.deposit * item.quantity;
                items.push({
                    productId: item.productId,
                    productName: product.name,
                    quantity: item.quantity,
                    pricePerDay: product.price,
                    deposit: product.deposit
                });
            }
        });

        // 配件费用
        let accessoryTotal = 0;
        const accessoryIds = [];
        this.selectedAccessories.forEach(acc => {
            accessoryTotal += acc.price * this.rentDays;
            accessoryIds.push(acc.id);
        });

        const discount = Cart.getPackageDiscount();
        const total = Math.round((subtotal + accessoryTotal) * this.rentDays * discount);

        // 构造订单数据（匹配 SQL schema）
        const orderData = {
            product_id: items[0]?.productId || '',
            accessory_ids: accessoryIds,
            start_date: this.rentStartDate,
            end_date: this.rentEndDate,
            total_days: this.rentDays,
            total_price: total,
            deposit: deposit
        };

        // 保存到 Supabase
        const result = await createOrder(orderData);

        if (!result.success) {
            App.showToast(result.error || '下单失败', 'error');
            return;
        }

        // 同时保存到本地作为备份
        const localOrder = {
            id: result.orderId || 'ORD' + Date.now().toString(36).toUpperCase(),
            items: items,
            accessories: this.selectedAccessories,
            rentStartDate: this.rentStartDate,
            rentEndDate: this.rentEndDate,
            rentDays: this.rentDays,
            subtotal: subtotal + accessoryTotal,
            discount: discount,
            total: total,
            deposit: deposit,
            pickupType: this.personalInfo.pickupType,
            deliveryAddress: this.personalInfo.deliveryAddress,
            userName: this.personalInfo.name,
            userPhone: this.personalInfo.phone,
            userIdCard: this.personalInfo.idCard,
            remarks: this.personalInfo.remarks,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        SnowboardData.addOrder(localOrder);

        // 清空购物车
        Cart.clear();

        // 显示成功消息
        App.showModal(`
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 4rem; margin-bottom: 16px;">🎉</div>
                <h2 style="color: var(--success-color); margin-bottom: 16px;">订单提交成功！</h2>
                <p>订单号：<strong style="color: var(--primary-color);">${localOrder.id}</strong></p>
                <p style="color: var(--text-secondary);">我们将在24小时内与您联系确认订单</p>
                <div style="margin-top: 24px;">
                    <button class="btn btn-primary btn-block" onclick="App.closeModal(); App.navigateTo('orders');">
                        查看我的订单
                    </button>
                    <button class="btn btn-outline btn-block" onclick="App.closeModal(); App.navigateTo('home');">
                        返回首页
                    </button>
                </div>
            </div>
        `);
    },

    /**
     * 更新或创建用户
     */
    updateUserIfNeeded() {
        const users = SnowboardData.getUsers();
        const phone = this.personalInfo.phone;

        let user = users.find(u => u.phone === phone);

        if (!user) {
            user = {
                name: this.personalInfo.name,
                phone: phone,
                idCard: this.personalInfo.idCard
            };
            SnowboardData.addUser(user);
        }

        return user.id;
    },

    /**
     * 重置订单流程
     */
    reset() {
        this.currentStep = 1;
        this.rentStartDate = '';
        this.rentEndDate = '';
        this.rentDays = 0;
        this.selectedAccessories = [];
        this.personalInfo = {
            name: '',
            phone: '',
            idCard: '',
            pickupType: 'store',
            deliveryAddress: '',
            remarks: ''
        };
    }
};

/**
 * 订单历史记录
 */
const OrderHistory = {
    filterStatus: 'all',

    /**
     * 初始化
     */
    init() {
        this.filter('all');
    },

    /**
     * 筛选订单
     */
    async filter(status) {
        this.filterStatus = status;

        // 更新标签状态
        document.querySelectorAll('.orders-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.status === status) {
                btn.classList.add('active');
            }
        });

        await this.render();
    },

    /**
     * 渲染订单列表
     */
    async render() {
        const container = document.getElementById('ordersList');
        if (!container) return;

        // 从 Supabase 获取所有订单（RLS 公开，游客也可查）
        let orders = await getAllOrders();

        // 如果 Supabase 无数据，从本地存储获取作为降级方案
        if (!orders || orders.length === 0) {
            const localOrders = SnowboardData.getOrders();
            if (localOrders && localOrders.length > 0) {
                orders = localOrders;
            }
        }

        // 筛选
        if (this.filterStatus !== 'all') {
            orders = orders.filter(o => o.status === this.filterStatus);
        }

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="cart-empty">
                    <div class="cart-empty-icon">📋</div>
                    <h3>暂无订单记录</h3>
                    <p>快去租赁心仪的单板吧</p>
                    <button class="btn btn-primary" onclick="App.navigateTo('products')">去逛逛</button>
                </div>
            `;
            return;
        }

        container.innerHTML = orders.map(order => {
            const firstItem = order.items?.[0] || {};
            const product = firstItem.productName || '单板';
            const statusText = {
                pending: '待取板',
                active: '租赁中',
                completed: '已归还',
                cancelled: '已取消'
            }[order.status] || order.status;

            return `
                <div class="order-card">
                    <div class="order-header">
                        <span class="order-id">${order.id}</span>
                        <span class="order-status ${order.status}">${statusText}</span>
                    </div>
                    <div class="order-content">
                        <div class="order-product">🏂</div>
                        <div class="order-info">
                            <p><strong>${product}</strong> 等${order.items?.length || 0}件装备</p>
                            <p>📅 ${App.formatDateDisplay(order.start_date || order.rentStartDate)} - ${App.formatDateDisplay(order.end_date || order.rentEndDate)} (${order.total_days || order.rentDays}天)</p>
                            <p>💰 总价 ¥${order.total_price || order.total} | 押金 ¥${order.deposit}</p>
                            <p>👤 ${order.user_name || order.userName || '游客'}</p>
                        </div>
                    </div>
                    <div class="order-actions">
                        ${order.status === 'pending' ? `
                            <button class="btn btn-sm btn-outline" onclick="OrderHistory.renewOrder('${order.id}')">申请续租</button>
                            <button class="btn btn-sm btn-outline" onclick="OrderHistory.cancelOrder('${order.id}')">取消订单</button>
                        ` : ''}
                        <button class="btn btn-sm btn-primary" onclick="App.navigateTo('orders')">查看详情</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * 续租订单
     */
    renewOrder(orderId) {
        App.showModal(`
            <h3>申请续租</h3>
            <div class="form">
                <div class="form-group">
                    <label>延长天数</label>
                    <select id="extendDays">
                        <option value="1">1天</option>
                        <option value="2">2天</option>
                        <option value="3">3天</option>
                        <option value="5">5天</option>
                    </select>
                </div>
                <button class="btn btn-primary btn-block" onclick="OrderHistory.confirmRenew('${orderId}')">
                    确认续租
                </button>
            </div>
        `);
    },

    /**
     * 确认续租
     */
    confirmRenew(orderId) {
        const days = parseInt(document.getElementById('extendDays').value) || 1;
        App.showModal(`
            <div style="text-align: center;">
                <div style="font-size: 3rem;">✅</div>
                <h3>续租请求已提交</h3>
                <p>原租期延长 ${days} 天</p>
                <p>请等待客服确认</p>
                <button class="btn btn-primary btn-block" onclick="App.closeModal(); OrderHistory.render();">
                    确定
                </button>
            </div>
        `);
    },

    /**
     * 取消订单
     */
    cancelOrder(orderId) {
        App.showModal(`
            <h3>确认取消订单</h3>
            <p style="color: var(--text-secondary); margin: 16px 0;">取消订单后，押金将在3-5个工作日内退还</p>
            <div style="display: flex; gap: 12px;">
                <button class="btn btn-outline" onclick="App.closeModal()">返回</button>
                <button class="btn btn-primary" onclick="OrderHistory.confirmCancel('${orderId}')">确认取消</button>
            </div>
        `);
    },

    /**
     * 确认取消订单
     */
    async confirmCancel(orderId) {
        // 更新 Supabase
        await updateOrderStatus(orderId, 'cancelled');
        // 同时更新本地
        SnowboardData.updateOrderStatus(orderId, 'cancelled');
        App.closeModal();
        App.showToast('订单已取消');
        await this.render();
    }
};