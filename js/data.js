/**
 * 冰雪之巅 - 单板租赁平台数据层
 * 包含产品数据、配件数据、套餐数据及数据操作工具
 */

const SnowboardData = {
    // 单板类型配置
    TYPE_CONFIG: {
        'all-mountain': { name: '全能板', icon: '🏂', desc: '适合各种地形，初学者到进阶玩家首选' },
        'freestyle': { name: '公园板', icon: '🎪', desc: '专为公园道具和跳台设计' },
        'freeride': { name: '高山板', icon: '🏔️', desc: '适合粉雪和陡峭地形' },
        'women': { name: '女子板', icon: '👩', desc: '专为女性设计，轻量灵活' }
    },

    // 单板数据（12款）
    PRODUCTS: [
        {
            id: 'sb001',
            name: 'Burton Custom X 158',
            brand: 'Burton',
            type: 'all-mountain',
            length: '158cm',
            width: '25.5cm',
            flex: 7,
            price: 199,
            deposit: 500,
            stock: 8,
            sales: 156,
            featured: true,
            images: ['🏂', '❄️', '⛷️'],
            description: 'Burton旗舰款全能板，采用碳纤维增强技术，提供卓越的操控性和响应速度。适合有一定基础的滑雪者。'
        },
        {
            id: 'sb002',
            name: 'Rossignol Templar HP',
            brand: 'Rossignol',
            type: 'all-mountain',
            length: '156cm',
            width: '25.2cm',
            flex: 6,
            price: 168,
            deposit: 400,
            stock: 12,
            sales: 89,
            featured: true,
            images: ['🏂', '❄️'],
            description: '法国品牌经典全能板，拥有出色的稳定性和容错率，是入门到进阶的理想选择。'
        },
        {
            id: 'sb003',
            name: 'Jones Ultracraft',
            brand: 'Jones',
            type: 'freeride',
            length: '162cm',
            width: '26.0cm',
            flex: 8,
            price: 248,
            deposit: 600,
            stock: 5,
            sales: 67,
            featured: true,
            images: ['🏔️', '❄️'],
            description: '专为深粉雪设计，超宽板腰提供更大的浮力。锥形外形设计让这款板子在野雪中如鱼得水。'
        },
        {
            id: 'sb004',
            name: 'Never Summer Proto',
            brand: 'Never Summer',
            type: 'freestyle',
            length: '154cm',
            width: '24.8cm',
            flex: 5,
            price: 188,
            deposit: 450,
            stock: 9,
            sales: 112,
            featured: false,
            images: ['🎪', '❄️'],
            description: '经典的公园板，拥有均衡的弹性配置，适合各种公园道具和跳台动作。'
        },
        {
            id: 'sb005',
            name: 'GNU Grace女士板',
            brand: 'GNU',
            type: 'women',
            length: '146cm',
            width: '23.5cm',
            flex: 4,
            price: 148,
            deposit: 350,
            stock: 15,
            sales: 203,
            featured: true,
            images: ['👩', '❄️'],
            description: '专为女性设计的公园板，轻量化设计配合柔和的弹性，让女性滑雪者更容易上手。'
        },
        {
            id: 'sb006',
            name: 'CAPiTA Birds of Prey',
            brand: 'CAPiTA',
            type: 'freeride',
            length: '159cm',
            width: '25.8cm',
            flex: 7,
            price: 218,
            deposit: 550,
            stock: 6,
            sales: 54,
            featured: false,
            images: ['🏔️', '❄️'],
            description: '网红爆款高山板，超弹的板腰设计配合双向 rocker，在粉雪中表现卓越。'
        },
        {
            id: 'sb007',
            name: 'Arbor Cask',
            brand: 'Arbor',
            type: 'freeride',
            length: '161cm',
            width: '26.2cm',
            flex: 7,
            price: 228,
            deposit: 550,
            stock: 4,
            sales: 38,
            featured: false,
            images: ['🏔️', '❄️'],
            description: '采用环保材料制作的高山板，宽板腰设计配合锥形尾部，是探索野雪的利器。'
        },
        {
            id: 'sb008',
            name: 'Rome Agent Rocker',
            brand: 'Rome',
            type: 'freestyle',
            length: '157cm',
            width: '25.0cm',
            flex: 5,
            price: 158,
            deposit: 380,
            stock: 11,
            sales: 97,
            featured: false,
            images: ['🎪', '❄️'],
            description: '经典公园板的进化版，加入了 tip and tail rocker，让玩家在公园中更加自由。'
        },
        {
            id: 'sb009',
            name: 'Bataleon Whatever',
            brand: 'Bataleon',
            type: 'all-mountain',
            length: '155cm',
            width: '24.6cm',
            flex: 6,
            price: 178,
            deposit: 420,
            stock: 10,
            sales: 125,
            featured: false,
            images: ['🏂', '❄️'],
            description: '独特的3BT技术让这块板子拥有出色的刃抓能力，同时保持良好的漂浮性。'
        },
        {
            id: 'sb010',
            name: 'Roxy Sugar',
            brand: 'Roxy',
            type: 'women',
            length: '150cm',
            width: '24.0cm',
            flex: 4,
            price: 138,
            deposit: 320,
            stock: 18,
            sales: 178,
            featured: true,
            images: ['👩', '❄️'],
            description: 'Roxy女士专属全能板，采用轻型玻璃纤维结构，专为亚洲女性脚型设计。'
        },
        {
            id: 'sb011',
            name: 'Salomo Sight',
            brand: 'Salomon',
            type: 'all-mountain',
            length: '157cm',
            width: '25.4cm',
            flex: 6,
            price: 175,
            deposit: 420,
            stock: 7,
            sales: 88,
            featured: false,
            images: ['🏂', '❄️'],
            description: 'Salomon全能板力作，结合了公园的灵活性和高山板的稳定性，一板走天下。'
        },
        {
            id: 'sb012',
            name: 'Yes Typo 童年',
            brand: 'Yes.',
            type: 'freestyle',
            length: '152cm',
            width: '24.4cm',
            flex: 5,
            price: 155,
            deposit: 360,
            stock: 14,
            sales: 142,
            featured: false,
            images: ['🎪', '❄️'],
            description: '设计灵感来自80年代的复古风格，性能却不复古，是公园入门玩家的绝佳选择。'
        }
    ],

    // 配件数据（6种）
    ACCESSORIES: [
        {
            id: 'acc001',
            name: '固定器套装',
            price: 30,
            deposit: 100,
            description: '包含前后固定器，适用于所有型号单板',
            stock: 50
        },
        {
            id: 'acc002',
            name: '雪鞋租赁',
            price: 40,
            deposit: 200,
            description: '专业雪鞋，尺码35-48可选',
            stock: 30
        },
        {
            id: 'acc003',
            name: '头盔护具套装',
            price: 25,
            deposit: 150,
            description: '包含头盔、护臀、护膝全套',
            stock: 40
        },
        {
            id: 'acc004',
            name: '雪镜',
            price: 15,
            deposit: 80,
            description: '防雾防紫外线专业雪镜',
            stock: 45
        },
        {
            id: 'acc005',
            name: '护脸面罩',
            price: 10,
            deposit: 30,
            description: '保暖透气，有效防风',
            stock: 60
        },
        {
            id: 'acc006',
            name: '雪具包',
            price: 20,
            deposit: 100,
            description: '大容量防水雪具包，可装单板全套装备',
            stock: 25
        }
    ],

    // 套餐数据
    PACKAGES: [
        { days: 2, name: '周末畅滑', discount: 0.75, description: '适合周末短途出行' },
        { days: 3, name: '短途之旅', discount: 0.70, description: '三日连租更划算' },
        { days: 5, name: '深度体验', discount: 0.65, description: '周中连租超高性价比' },
        { days: 7, name: '度假首选', discount: 0.60, description: '一周畅滑，滑雪度假最佳选择' }
    ],

    // 用户数据
    USERS: [],

    // 订单数据
    ORDERS: [],

    /**
     * 数据存储键名
     */
    STORAGE_KEYS: {
        PRODUCTS: 'snowboard_products',
        ACCESSORIES: 'snowboard_accessories',
        CART: 'snowboard_cart',
        ORDERS: 'snowboard_orders',
        USERS: 'snowboard_users',
        USER_INFO: 'snowboard_user_info'
    },

    /**
     * 初始化数据
     * 如果本地存储为空，则写入初始数据
     */
    init() {
        // 检查是否需要初始化产品数据
        if (!localStorage.getItem(this.STORAGE_KEYS.PRODUCTS)) {
            this.saveProducts(this.PRODUCTS);
        }

        // 检查是否需要初始化配件数据
        if (!localStorage.getItem(this.STORAGE_KEYS.ACCESSORIES)) {
            this.saveAccessories(this.ACCESSORIES);
        }

        // 初始化订单列表（如果为空）
        if (!localStorage.getItem(this.STORAGE_KEYS.ORDERS)) {
            this.saveOrders([]);
        }

        // 初始化用户列表（如果为空）
        if (!localStorage.getItem(this.STORAGE_KEYS.USERS)) {
            this.saveUsers([]);
        }
    },

    /**
     * 从本地存储读取产品数据
     */
    getProducts() {
        const data = localStorage.getItem(this.STORAGE_KEYS.PRODUCTS);
        return data ? JSON.parse(this.decompress(data)) : this.PRODUCTS;
    },

    /**
     * 保存产品数据到本地存储
     */
    saveProducts(products) {
        localStorage.setItem(
            this.STORAGE_KEYS.PRODUCTS,
            this.compress(JSON.stringify(products))
        );
    },

    /**
     * 从本地存储读取配件数据
     */
    getAccessories() {
        const data = localStorage.getItem(this.STORAGE_KEYS.ACCESSORIES);
        return data ? JSON.parse(this.decompress(data)) : this.ACCESSORIES;
    },

    /**
     * 保存配件数据到本地存储
     */
    saveAccessories(accessories) {
        localStorage.setItem(
            this.STORAGE_KEYS.ACCESSORIES,
            this.compress(JSON.stringify(accessories))
        );
    },

    /**
     * 获取单个产品
     */
    getProduct(id) {
        const products = this.getProducts();
        return products.find(p => p.id === id);
    },

    /**
     * 更新产品库存
     */
    updateProductStock(id, change) {
        const products = this.getProducts();
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index].stock += change;
            products[index].stock = Math.max(0, products[index].stock);
            this.saveProducts(products);
            return true;
        }
        return false;
    },

    /**
     * 添加新产品
     */
    addProduct(product) {
        const products = this.getProducts();
        product.id = 'sb' + Date.now().toString(36);
        products.push(product);
        this.saveProducts(products);
        return product.id;
    },

    /**
     * 更新产品
     */
    updateProduct(id, updates) {
        const products = this.getProducts();
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index] = { ...products[index], ...updates };
            this.saveProducts(products);
            return true;
        }
        return false;
    },

    /**
     * 删除产品
     */
    deleteProduct(id) {
        const products = this.getProducts();
        const filtered = products.filter(p => p.id !== id);
        this.saveProducts(filtered);
    },

    /**
     * 获取购物车
     */
    getCart() {
        const data = localStorage.getItem(this.STORAGE_KEYS.CART);
        return data ? JSON.parse(this.decompress(data)) : [];
    },

    /**
     * 保存购物车
     */
    saveCart(cart) {
        const data = JSON.stringify(cart);
        // 数据压缩以节省 localStorage 空间
        localStorage.setItem(this.STORAGE_KEYS.CART, this.compress(data));
    },

    /**
     * 清空购物车
     */
    clearCart() {
        localStorage.removeItem(this.STORAGE_KEYS.CART);
    },

    /**
     * 获取订单列表
     */
    getOrders() {
        const data = localStorage.getItem(this.STORAGE_KEYS.ORDERS);
        return data ? JSON.parse(this.decompress(data)) : [];
    },

    /**
     * 保存订单列表
     */
    saveOrders(orders) {
        localStorage.setItem(
            this.STORAGE_KEYS.ORDERS,
            this.compress(JSON.stringify(orders))
        );
    },

    /**
     * 添加订单
     */
    addOrder(order) {
        const orders = this.getOrders();
        order.id = 'ORD' + Date.now().toString(36).toUpperCase();
        order.createdAt = new Date().toISOString();
        order.status = 'pending';
        orders.unshift(order);
        this.saveOrders(orders);
        return order.id;
    },

    /**
     * 更新订单状态
     */
    updateOrderStatus(id, status) {
        const orders = this.getOrders();
        const index = orders.findIndex(o => o.id === id);
        if (index !== -1) {
            orders[index].status = status;
            orders[index].updatedAt = new Date().toISOString();
            this.saveOrders(orders);
            return true;
        }
        return false;
    },

    /**
     * 获取用户列表
     */
    getUsers() {
        const data = localStorage.getItem(this.STORAGE_KEYS.USERS);
        return data ? JSON.parse(this.decompress(data)) : [];
    },

    /**
     * 保存用户列表
     */
    saveUsers(users) {
        localStorage.setItem(
            this.STORAGE_KEYS.USERS,
            this.compress(JSON.stringify(users))
        );
    },

    /**
     * 添加用户
     */
    addUser(user) {
        const users = this.getUsers();
        user.id = 'USR' + Date.now().toString(36).toUpperCase();
        user.createdAt = new Date().toISOString();
        users.push(user);
        this.saveUsers(users);
        return user.id;
    },

    /**
     * 获取当前用户信息
     */
    getUserInfo() {
        const data = localStorage.getItem(this.STORAGE_KEYS.USER_INFO);
        return data ? JSON.parse(data) : null;
    },

    /**
     * 保存当前用户信息
     */
    saveUserInfo(userInfo) {
        localStorage.setItem(this.STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));
    },

    /**
     * 数据压缩（简化版，实际可用LZ-string等库）
     * 针对 localStorage 约5MB的限制做优化
     */
    compress(data) {
        // 简单的字符串压缩：移除空格和换行
        return data
            .replace(/\s+/g, ' ')
            .replace(/\s*([{}[])\s*/g, '$1')
            .replace(/,\s*([}]])/g, '$1');
    },

    /**
     * 数据解压
     */
    decompress(data) {
        // 在这里实现解压逻辑
        // 目前压缩很轻量，解压直接返回原字符串
        return data;
    },

    /**
     * 生成唯一ID
     */
    generateId(prefix = '') {
        return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
};

// 初始化数据
SnowboardData.init();