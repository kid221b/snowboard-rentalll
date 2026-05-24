/**
 * 冰雪之巅 - 购物车模块
 * 负责购物车操作、价格计算、套餐处理
 */

const Cart = {
    // 购物车数据
    items: [],

    // 套餐天数
    packageDays: 0,

    /**
     * 初始化购物车
     */
    init() {
        this.items = SnowboardData.getCart();
    },

    /**
     * 获取购物车商品列表
     */
    getItems() {
        return SnowboardData.getCart();
    },

    /**
     * 添加商品到购物车
     */
    addItem(productId, quantity = 1) {
        const product = SnowboardData.getProduct(productId);
        if (!product) {
            App.showToast('产品不存在', 'error');
            return false;
        }

        if (product.stock <= 0) {
            App.showToast('当前缺货', 'error');
            return false;
        }

        const cart = SnowboardData.getCart();
        const existingIndex = cart.findIndex(item => item.productId === productId);

        if (existingIndex !== -1) {
            // 已存在的商品，增加数量
            const newQuantity = cart[existingIndex].quantity + quantity;
            if (newQuantity > product.stock) {
                App.showToast('库存不足', 'error');
                return false;
            }
            cart[existingIndex].quantity = newQuantity;
        } else {
            // 新增商品
            cart.push({
                productId: productId,
                quantity: quantity,
                addedAt: new Date().toISOString()
            });
        }

        SnowboardData.saveCart(cart);
        App.updateCartCount();
        return true;
    },

    /**
     * 更新商品数量
     */
    updateQuantity(productId, quantity) {
        const cart = SnowboardData.getCart();
        const index = cart.findIndex(item => item.productId === productId);

        if (index === -1) return false;

        const product = SnowboardData.getProduct(productId);
        if (!product) return false;

        if (quantity <= 0) {
            return this.removeItem(productId);
        }

        if (quantity > product.stock) {
            App.showToast('库存不足', 'error');
            return false;
        }

        cart[index].quantity = quantity;
        SnowboardData.saveCart(cart);
        return true;
    },

    /**
     * 移除商品
     */
    removeItem(productId) {
        const cart = SnowboardData.getCart();
        const filtered = cart.filter(item => item.productId !== productId);
        SnowboardData.saveCart(filtered);
        App.updateCartCount();
        return true;
    },

    /**
     * 清空购物车
     */
    clear() {
        SnowboardData.clearCart();
        this.packageDays = 0;
        App.updateCartCount();
    },

    /**
     * 设置套餐天数
     */
    setPackage(days) {
        this.packageDays = days;
    },

    /**
     * 获取套餐天数
     */
    getPackageDays() {
        return this.packageDays;
    },

    /**
     * 计算购物车总价
     */
    calculateTotal() {
        const cart = SnowboardData.getCart();
        let subtotal = 0;

        cart.forEach(item => {
            const product = SnowboardData.getProduct(item.productId);
            if (product) {
                subtotal += product.price * item.quantity;
            }
        });

        return subtotal;
    },

    /**
     * 计算押金总额
     */
    calculateDeposit() {
        const cart = SnowboardData.getCart();
        let deposit = 0;

        cart.forEach(item => {
            const product = SnowboardData.getProduct(item.productId);
            if (product) {
                deposit += product.deposit * item.quantity;
            }
        });

        return deposit;
    },

    /**
     * 获取套餐折扣
     */
    getPackageDiscount() {
        const packages = SnowboardData.PACKAGES;
        const packageInfo = packages.find(p => p.days === this.packageDays);
        return packageInfo ? packageInfo.discount : 1;
    },

    /**
     * 计算总价（考虑套餐折扣）
     */
    calculateFinalTotal(days = 1) {
        const subtotal = this.calculateTotal();
        const discount = this.getPackageDiscount();
        return Math.round(subtotal * days * discount);
    },

    /**
     * 计算节省金额
     */
    calculateSavings(days = 1) {
        const subtotal = this.calculateTotal();
        const finalTotal = this.calculateFinalTotal(days);
        return subtotal * days - finalTotal;
    },

    /**
     * 渲染购物车页面
     */
    render() {
        const itemsContainer = document.getElementById('cartItems');
        const summaryContainer = document.getElementById('cartSummary');

        if (!itemsContainer) return;

        const cart = SnowboardData.getCart();

        if (cart.length === 0) {
            itemsContainer.innerHTML = `
                <div class="cart-empty">
                    <div class="cart-empty-icon">🛒</div>
                    <h3>购物车是空的</h3>
                    <p>快去挑选心仪的单板吧</p>
                    <button class="btn btn-primary" onclick="App.navigateTo('products')">去逛逛</button>
                </div>
            `;

            if (summaryContainer) {
                summaryContainer.style.display = 'none';
            }
            return;
        }

        if (summaryContainer) {
            summaryContainer.style.display = 'block';
        }

        // 渲染购物车商品
        let itemsHTML = '';
        cart.forEach(item => {
            const product = SnowboardData.getProduct(item.productId);
            if (!product) return;

            const typeConfig = SnowboardData.TYPE_CONFIG[product.type] || {};

            itemsHTML += `
                <div class="cart-item" data-id="${item.productId}">
                    <div class="cart-item-image">${product.images[0]}</div>
                    <div class="cart-item-info">
                        <div class="cart-item-name">${product.name}</div>
                        <div class="cart-item-meta">
                            ${typeConfig.icon || ''} ${typeConfig.name || product.type} | ${product.brand} | ${product.length}
                        </div>
                        <div class="cart-item-price">¥${product.price}/天 × ${item.quantity}</div>
                    </div>
                    <div class="cart-item-actions">
                        <div class="quantity-control">
                            <button onclick="Cart.decreaseQuantity('${item.productId}')">-</button>
                            <input type="number" value="${item.quantity}" min="1" max="${product.stock}"
                                   onchange="Cart.changeQuantity('${item.productId}', this.value)">
                            <button onclick="Cart.increaseQuantity('${item.productId}')">+</button>
                        </div>
                        <button class="remove-btn" onclick="Cart.removeItem('${item.productId}'); Cart.render();">
                            🗑️ 删除
                        </button>
                    </div>
                </div>
            `;
        });

        itemsContainer.innerHTML = itemsHTML;

        // 渲染费用明细
        this.renderSummary();
    },

    /**
     * 渲染费用明细
     */
    renderSummary(days = 1) {
        const boardTotal = document.getElementById('cartBoardTotal');
        const accessoryTotal = document.getElementById('cartAccessoryTotal');
        const daysEl = document.getElementById('cartDays');
        const discountEl = document.getElementById('cartDiscount');
        const totalEl = document.getElementById('cartTotal');
        const depositEl = document.getElementById('cartDeposit');
        const checkoutBtn = document.getElementById('checkoutBtn');

        const cart = SnowboardData.getCart();
        let subtotal = 0;
        let deposit = 0;

        cart.forEach(item => {
            const product = SnowboardData.getProduct(item.productId);
            if (product) {
                subtotal += product.price * item.quantity;
                deposit += product.deposit * item.quantity;
            }
        });

        const discount = this.getPackageDiscount();
        const finalTotal = Math.round(subtotal * days * discount);
        const savings = Math.round(subtotal * days * (1 - discount));

        if (boardTotal) boardTotal.textContent = App.formatPrice(subtotal);
        if (accessoryTotal) accessoryTotal.textContent = '¥0';
        if (daysEl) daysEl.textContent = `${days}天`;
        if (discountEl) discountEl.textContent = savings > 0 ? `-${App.formatPrice(savings)}` : '¥0';
        if (totalEl) totalEl.textContent = App.formatPrice(finalTotal);
        if (depositEl) depositEl.textContent = App.formatPrice(deposit);
        if (checkoutBtn) {
            checkoutBtn.disabled = cart.length === 0;
        }
    },

    /**
     * 增加商品数量
     */
    increaseQuantity(productId) {
        const cart = SnowboardData.getCart();
        const item = cart.find(i => i.productId === productId);
        if (item) {
            this.updateQuantity(productId, item.quantity + 1);
            this.render();
        }
    },

    /**
     * 减少商品数量
     */
    decreaseQuantity(productId) {
        const cart = SnowboardData.getCart();
        const item = cart.find(i => i.productId === productId);
        if (item && item.quantity > 1) {
            this.updateQuantity(productId, item.quantity - 1);
            this.render();
        }
    },

    /**
     * 修改商品数量
     */
    changeQuantity(productId, value) {
        const quantity = parseInt(value) || 1;
        if (this.updateQuantity(productId, quantity)) {
            this.render();
        }
    },

    /**
     * 获取已选配件列表
     */
    getSelectedAccessories() {
        // 从 OrderFlow 中获取
        return OrderFlow ? OrderFlow.selectedAccessories : [];
    },

    /**
     * 计算配件总租金
     */
    calculateAccessoryTotal(days = 1) {
        const accessories = this.getSelectedAccessories();
        let total = 0;

        accessories.forEach(acc => {
            total += acc.price * days;
        });

        return total;
    }
};

// 初始化购物车
Cart.init();