/**
 * 冰雪之巅 - 主应用逻辑
 * 负责页面导航、路由、UI交互等核心功能
 */

import { login, register, logout, getCurrentUser, onAuthStateChange } from './auth.js';

const App = {
    // 当前页面
    currentPage: 'home',

    // 购物车商品数量
    cartCount: 0,

    /**
     * 初始化应用
     */
    init() {
        this.setupNavigation();
        this.setupMobileMenu();
        this.updateCartCount();
        this.renderFeaturedProducts();
        this.setupEventListeners();
        this.initDatePicker();
        this.initAuth();
    },

    /**
     * 初始化认证状态
     */
    async initAuth() {
        // 检查登录状态
        const user = await getCurrentUser();
        if (user) {
            this.updateAuthUI(user);
        }

        // 监听认证状态变化
        onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                this.updateAuthUI(session.user);
                App.showToast('登录成功');
            } else if (event === 'SIGNED_OUT') {
                this.updateAuthUI(null);
                App.showToast('已退出登录');
            }
        });
    },

    /**
     * 更新认证相关UI
     */
    updateAuthUI(user) {
        const navActions = document.querySelector('.nav-actions');
        if (!navActions) return;

        // 移除现有登录/用户菜单
        const existingAuth = navActions.querySelector('.auth-buttons');
        if (existingAuth) {
            existingAuth.remove();
        }

        if (user) {
            // 显示用户菜单
            navActions.insertAdjacentHTML('beforeend', `
                <div class="auth-buttons">
                    <button class="user-menu-btn" onclick="App.toggleUserMenu()">
                        <span class="user-icon">👤</span>
                        <span class="user-name">${user.email?.split('@')[0] || '用户'}</span>
                    </button>
                    <div class="user-dropdown" id="userDropdown">
                        <button onclick="App.navigateTo('orders')">📋 我的订单</button>
                        <button onclick="Auth.logout(); App.closeUserMenu();">🚪 退出登录</button>
                    </div>
                </div>
            `);
        } else {
            // 显示登录按钮
            navActions.insertAdjacentHTML('beforeend', `
                <div class="auth-buttons">
                    <button class="login-btn" onclick="Auth.showModal()">登录</button>
                </div>
            `);
        }
    },

    /**
     * 切换用户菜单
     */
    toggleUserMenu() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    },

    /**
     * 关闭用户菜单
     */
    closeUserMenu() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    },

    /**
     * 设置导航链接
     */
    setupNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.navigateTo(page);
            });
        });
    },

    /**
     * 设置移动端菜单
     */
    setupMobileMenu() {
        // 移动端菜单切换由 HTML 内联 onclick 处理
    },

    /**
     * 移动端菜单切换
     */
    toggleMobileMenu() {
        const menu = document.querySelector('.nav-menu');
        menu.classList.toggle('show');
    },

    /**
     * 导航到指定页面
     */
    navigateTo(page) {
        // 隐藏当前页面
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });

        // 显示目标页面
        const targetPage = document.getElementById(`page-${page}`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // 更新导航状态
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === page) {
                link.classList.add('active');
            }
        });

        // 关闭移动端菜单
        document.querySelector('.nav-menu').classList.remove('show');

        // 更新当前页面
        this.currentPage = page;

        // 页面特定初始化
        this.initPage(page);

        // 滚动到顶部
        window.scrollTo(0, 0);
    },

    /**
     * 页面初始化
     */
    initPage(page) {
        switch (page) {
            case 'home':
                this.renderFeaturedProducts();
                break;
            case 'products':
                ProductFilter.init();
                break;
            case 'cart':
                Cart.render();
                break;
            case 'orders':
                OrderHistory.render();
                break;
            case 'checkout':
                OrderFlow.init();
                break;
            case 'admin':
                Admin.init();
                break;
            case 'product-detail':
                // 由 showProductDetail 处理
                break;
        }
    },

    /**
     * 设置全局事件监听
     */
    setupEventListeners() {
        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

        // 点击模态框背景关闭
        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });
    },

    /**
     * 初始化日期选择器
     */
    initDatePicker() {
        const startDate = document.getElementById('rentStartDate');
        const endDate = document.getElementById('rentEndDate');

        if (startDate && endDate) {
            // 设置最小日期为今天
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            startDate.min = this.formatDate(today);
            endDate.min = this.formatDate(tomorrow);
        }
    },

    /**
     * 格式化日期为 YYYY-MM-DD
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * 渲染首页热门单板
     */
    renderFeaturedProducts() {
        const container = document.getElementById('featuredProducts');
        if (!container) return;

        const products = SnowboardData.getProducts()
            .filter(p => p.featured)
            .slice(0, 4);

        container.innerHTML = products.map(product => this.createProductCard(product)).join('');
    },

    /**
     * 创建产品卡片 HTML
     */
    createProductCard(product) {
        const typeConfig = SnowboardData.TYPE_CONFIG[product.type] || {};
        const stockStatus = product.stock > 0
            ? `<span class="stock-ok">有货 (${product.stock})</span>`
            : '<span class="stock-out">缺货</span>';

        return `
            <div class="product-card" onclick="App.showProductDetail('${product.id}')">
                <div class="product-image">
                    ${product.images[0]}
                    ${product.featured ? '<span class="product-badge">热门</span>' : ''}
                </div>
                <div class="product-info">
                    <div class="product-type">${typeConfig.icon || ''} ${typeConfig.name || product.type}</div>
                    <div class="product-name">${product.name}</div>
                    <div class="product-meta">
                        <span>${product.brand}</span>
                        ${stockStatus}
                    </div>
                    <div class="product-price">
                        ¥${product.price}<span>/天</span>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 显示产品详情
     */
    showProductDetail(id) {
        const product = SnowboardData.getProduct(id);
        if (!product) {
            this.showToast('产品不存在', 'error');
            return;
        }

        const typeConfig = SnowboardData.TYPE_CONFIG[product.type] || {};
        const container = document.getElementById('productDetail');

        container.innerHTML = `
            <div class="detail-images">
                <div class="main-image">${product.images[0]}</div>
                <div class="thumbnails">
                    ${product.images.map((img, idx) => `
                        <div class="thumbnail ${idx === 0 ? 'active' : ''}" onclick="App.switchImage(this, '${img}')">${img}</div>
                    `).join('')}
                </div>
            </div>
            <div class="detail-info">
                <h1>${product.name}</h1>
                <p class="detail-brand">${typeConfig.icon || ''} ${typeConfig.name || product.type} | ${product.brand}</p>

                <div class="detail-price-box">
                    <div class="detail-price">
                        ¥${product.price}<span> / 天</span>
                    </div>
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">押金 ¥${product.deposit}（可退）</p>
                </div>

                <div class="detail-specs">
                    <h3>📐 规格参数</h3>
                    <div class="spec-grid">
                        <div class="spec-item">
                            <div class="spec-label">板长</div>
                            <div class="spec-value">${product.length}</div>
                        </div>
                        <div class="spec-item">
                            <div class="spec-label">板宽</div>
                            <div class="spec-value">${product.width}</div>
                        </div>
                        <div class="spec-item">
                            <div class="spec-label">硬度</div>
                            <div class="spec-value">${product.flex}/10</div>
                        </div>
                    </div>
                </div>

                <div class="detail-description">
                    <p>${product.description}</p>
                </div>

                <div class="detail-actions">
                    <button class="btn btn-primary" onclick="App.addToCart('${product.id}')">
                        🛒 加入购物车
                    </button>
                    <button class="btn btn-outline" onclick="App.buyNow('${product.id}')">
                        立即租赁
                    </button>
                </div>
            </div>
        `;

        this.navigateTo('product-detail');
    },

    /**
     * 切换产品图片
     */
    switchImage(thumbnail, image) {
        const mainImage = document.querySelector('.main-image');
        if (mainImage && thumbnail) {
            mainImage.textContent = image;
            document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
            thumbnail.classList.add('active');
        }
    },

    /**
     * 加入购物车
     */
    addToCart(productId) {
        const product = SnowboardData.getProduct(productId);
        if (!product) {
            this.showToast('产品不存在', 'error');
            return;
        }

        if (product.stock <= 0) {
            this.showToast('当前缺货', 'error');
            return;
        }

        Cart.addItem(productId, 1);
        this.showToast('已加入购物车');
    },

    /**
     * 立即租赁
     */
    buyNow(productId) {
        const product = SnowboardData.getProduct(productId);
        if (!product || product.stock <= 0) {
            this.showToast('当前缺货', 'error');
            return;
        }

        // 清空当前购物车，添加这个产品
        Cart.clear();
        Cart.addItem(productId, 1);
        this.navigateTo('checkout');
    },

    /**
     * 选择套餐
     */
    selectPackage(days) {
        Cart.setPackage(days);
        this.navigateTo('products');
        this.showToast(`已选择${days}天套餐`);
    },

    /**
     * 更新购物车数量
     */
    updateCartCount() {
        const cart = SnowboardData.getCart();
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        this.cartCount = count;

        const countEl = document.getElementById('cartCount');
        if (countEl) {
            countEl.textContent = count;
            countEl.style.display = count > 0 ? 'flex' : 'none';
        }
    },

    /**
     * 显示模态框
     */
    showModal(content) {
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = content;
        modal.classList.add('show');
    },

    /**
     * 关闭模态框
     */
    closeModal() {
        const modal = document.getElementById('modal');
        modal.classList.remove('show');
    },

    /**
     * 显示 Toast 提示
     */
    showToast(message, type = '') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');

        toastMessage.textContent = message;
        toast.className = 'toast show ' + type;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    },

    /**
     * 格式化金额
     */
    formatPrice(amount) {
        return '¥' + amount.toFixed(2);
    },

    /**
     * 格式化日期显示
     */
    formatDateDisplay(dateStr) {
        const date = new Date(dateStr);
        return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    },

    /**
     * 获取 URL 参数
     */
    getUrlParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }
};

/**
 * 产品筛选器
 */
const ProductFilter = {
    filters: {
        type: 'all',
        minPrice: 0,
        maxPrice: Infinity,
        brand: '',
        sort: 'default'
    },
    pageSize: 8,
    currentPage: 1,

    /**
     * 初始化筛选器
     */
    init() {
        this.renderFilters();
        this.apply();
    },

    /**
     * 渲染筛选选项
     */
    renderFilters() {
        // 渲染品牌筛选
        const brandContainer = document.getElementById('brandFilters');
        if (brandContainer) {
            const brands = [...new Set(SnowboardData.getProducts().map(p => p.brand))];
            brandContainer.innerHTML = `
                <label class="filter-option">
                    <input type="checkbox" name="brand" value="" checked onchange="ProductFilter.apply()">
                    <span>全部品牌</span>
                </label>
                ${brands.map(brand => `
                    <label class="filter-option">
                        <input type="checkbox" name="brand" value="${brand}" onchange="ProductFilter.apply()">
                        <span>${brand}</span>
                    </label>
                `).join('')}
            `;
        }
    },

    /**
     * 应用筛选
     */
    apply() {
        // 获取筛选值
        const typeCheckboxes = document.querySelectorAll('input[name="type"]:checked');
        const brandCheckboxes = document.querySelectorAll('input[name="brand"]:checked');
        const minPrice = document.getElementById('minPrice');
        const maxPrice = document.getElementById('maxPrice');
        const sortSelect = document.getElementById('sortSelect');

        // 类型筛选
        const selectedTypes = Array.from(typeCheckboxes).map(cb => cb.value);
        this.filters.type = selectedTypes.includes('all') || selectedTypes.length === 0
            ? 'all'
            : selectedTypes;

        // 品牌筛选
        const selectedBrands = Array.from(brandCheckboxes).map(cb => cb.value);
        this.filters.brand = selectedBrands.filter(b => b).join(',');

        // 价格筛选
        this.filters.minPrice = minPrice ? parseInt(minPrice.value) || 0 : 0;
        this.filters.maxPrice = maxPrice ? parseInt(maxPrice.value) || Infinity : Infinity;

        // 排序
        this.filters.sort = sortSelect ? sortSelect.value : 'default';

        // 重置页码
        this.currentPage = 1;

        // 渲染结果
        this.render();
    },

    /**
     * 重置筛选
     */
    reset() {
        // 重置所有筛选控件
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = cb.value === 'all' || cb.value === '';
        });
        const minPrice = document.getElementById('minPrice');
        const maxPrice = document.getElementById('maxPrice');
        if (minPrice) minPrice.value = '';
        if (maxPrice) maxPrice.value = '';

        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) sortSelect.value = 'default';

        // 重置筛选状态
        this.filters = {
            type: 'all',
            minPrice: 0,
            maxPrice: Infinity,
            brand: '',
            sort: 'default'
        };

        this.apply();
    },

    /**
     * 渲染产品列表
     */
    render() {
        const container = document.getElementById('productList');
        const countEl = document.getElementById('productCount');
        const paginationEl = document.getElementById('pagination');

        if (!container) return;

        // 获取筛选后的产品
        let products = SnowboardData.getProducts();

        // 类型筛选
        if (this.filters.type !== 'all') {
            const typeArray = Array.isArray(this.filters.type) ? this.filters.type : [this.filters.type];
            products = products.filter(p => typeArray.includes(p.type));
        }

        // 品牌筛选
        if (this.filters.brand) {
            const brands = this.filters.brand.split(',').filter(b => b);
            products = products.filter(p => brands.includes(p.brand));
        }

        // 价格筛选
        products = products.filter(p =>
            p.price >= this.filters.minPrice &&
            p.price <= this.filters.maxPrice
        );

        // 排序
        switch (this.filters.sort) {
            case 'price-asc':
                products.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                products.sort((a, b) => b.price - a.price);
                break;
            case 'sales-desc':
                products.sort((a, b) => b.sales - a.sales);
                break;
        }

        // 更新总数
        if (countEl) {
            countEl.textContent = products.length;
        }

        // 分页
        const totalPages = Math.ceil(products.length / this.pageSize);
        const start = (this.currentPage - 1) * this.pageSize;
        const pageProducts = products.slice(start, start + this.pageSize);

        // 渲染产品卡片
        container.innerHTML = pageProducts.map(product => App.createProductCard(product)).join('');

        // 渲染分页
        if (paginationEl) {
            if (totalPages <= 1) {
                paginationEl.innerHTML = '';
            } else {
                let paginationHTML = '';
                for (let i = 1; i <= totalPages; i++) {
                    paginationHTML += `
                        <button class="${i === this.currentPage ? 'active' : ''}"
                                onclick="ProductFilter.goPage(${i})">
                            ${i}
                        </button>
                    `;
                }
                paginationEl.innerHTML = paginationHTML;
            }
        }
    },

    /**
     * 跳转到指定页
     */
    goPage(page) {
        this.currentPage = page;
        this.render();
        window.scrollTo(0, 300);
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// 显示租赁协议
function showTerms() {
    App.showModal(`
        <h2>《单板租赁协议》</h2>
        <div style="max-height: 400px; overflow-y: auto; line-height: 1.8;">
            <h4>第一条 租赁物品</h4>
            <p>甲方（出租方）将单板及相关配件出租给乙方（承租方）使用。</p>

            <h4>第二条 租赁期限</h4>
            <p>租赁期限以双方约定的起止日期为准。</p>

            <h4>第三条 租金及押金</h4>
            <p>乙方需支付租金及押金，押金在归还装备且无损坏时全额退还。</p>

            <h4>第四条 使用规定</h4>
            <p>乙方应妥善保管租赁物品，因使用不当造成的损失需承担相应责任。</p>

            <h4>第五条 损坏赔偿</h4>
            <p>如租赁物品损坏，乙方需照价赔偿或支付维修费用。</p>
        </div>
        <button class="btn btn-primary btn-block mt-20" onclick="App.closeModal()">我已阅读</button>
    `);
}

/**
 * 认证模块 - 与 app.js 集成
 */
const Auth = {
    /**
     * 显示登录/注册模态框
     */
    showModal() {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.classList.add('show');
        }
    },

    /**
     * 关闭模态框
     */
    closeModal() {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.classList.remove('show');
        }
        // 清空表单
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('regName').value = '';
        document.getElementById('regPhone').value = '';
        document.getElementById('regEmail').value = '';
        document.getElementById('regPassword').value = '';
    },

    /**
     * 切换登录/注册选项卡
     */
    switchTab(tab) {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const tabs = document.querySelectorAll('.auth-tab');

        tabs.forEach(t => t.classList.remove('active'));
        document.querySelector(`.auth-tab[data-tab="${tab}"]`)?.classList.add('active');

        if (tab === 'login') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        }
    },

    /**
     * 用户登录
     */
    async login() {
        const email = document.getElementById('loginEmail')?.value.trim();
        const password = document.getElementById('loginPassword')?.value;

        if (!email || !password) {
            App.showToast('请输入邮箱和密码', 'error');
            return;
        }

        const result = await login(email, password);
        if (result.success) {
            this.closeModal();
        } else {
            App.showToast(result.error || '登录失败', 'error');
        }
    },

    /**
     * 用户注册
     */
    async register() {
        const name = document.getElementById('regName')?.value.trim();
        const phone = document.getElementById('regPhone')?.value.trim();
        const email = document.getElementById('regEmail')?.value.trim();
        const password = document.getElementById('regPassword')?.value;

        if (!name || !phone || !email || !password) {
            App.showToast('请填写所有必填项', 'error');
            return;
        }

        if (!/^1[3-9]\d{9}$/.test(phone)) {
            App.showToast('请输入正确的手机号', 'error');
            return;
        }

        if (password.length < 6) {
            App.showToast('密码至少6位', 'error');
            return;
        }

        const result = await register(email, password, name, phone);
        if (result.success) {
            App.showToast('注册成功');
            this.closeModal();
        } else {
            App.showToast(result.error || '注册失败', 'error');
        }
    }
};