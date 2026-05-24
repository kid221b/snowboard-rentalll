/**
 * 冰雪之巅 - 管理员面板模块
 * 负责库存管理、订单管理、用户管理
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

const Admin = {
    // 当前标签页
    currentTab: 'inventory',

    /**
     * 初始化
     */
    init() {
        this.switchTab('inventory');
    },

    /**
     * 切换标签页
     */
    switchTab(tab) {
        this.currentTab = tab;

        // 更新标签状态
        document.querySelectorAll('.admin-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.adminTab === tab) {
                btn.classList.add('active');
            }
        });

        // 切换面板显示
        document.querySelectorAll('.admin-panel').forEach(panel => {
            panel.style.display = 'none';
        });
        const targetPanel = document.getElementById(`admin-${tab}`);
        if (targetPanel) {
            targetPanel.style.display = 'block';
        }

        // 渲染对应内容
        switch (tab) {
            case 'inventory':
                this.renderInventory();
                break;
            case 'orders':
                this.renderOrders();
                break;
            case 'users':
                this.renderUsers();
                break;
        }
    },

    /**
     * 渲染库存管理
     */
    renderInventory() {
        const tbody = document.getElementById('inventoryTable');
        if (!tbody) return;

        const products = SnowboardData.getProducts();

        tbody.innerHTML = products.map(product => {
            const typeConfig = SnowboardData.TYPE_CONFIG[product.type] || {};
            return `
                <tr>
                    <td>${escapeHtml(product.id)}</td>
                    <td>${escapeHtml(product.name)}</td>
                    <td>${escapeHtml(typeConfig.name || product.type)}</td>
                    <td>${escapeHtml(product.brand)}</td>
                    <td>¥${product.price}/天</td>
                    <td>
                        <span class="${product.stock > 5 ? 'text-success' : product.stock > 0 ? 'text-warning' : 'text-danger'}">
                            ${product.stock}
                        </span>
                    </td>
                    <td>
                        <button class="action-btn edit" onclick="Admin.editProduct('${escapeHtml(product.id)}')">编辑</button>
                        <button class="action-btn delete" onclick="Admin.deleteProduct('${escapeHtml(product.id)}')">删除</button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    /**
     * 显示添加产品表单
     */
    showAddProduct() {
        const typeOptions = Object.entries(SnowboardData.TYPE_CONFIG).map(([key, config]) =>
            `<option value="${key}">${config.name}</option>`
        ).join('');

        App.showModal(`
            <h3>添加单板</h3>
            <form class="form" id="addProductForm">
                <div class="form-group">
                    <label>产品名称 *</label>
                    <input type="text" id="newProductName" required placeholder="如：Burton Custom X 158">
                </div>
                <div class="form-group">
                    <label>品牌 *</label>
                    <input type="text" id="newProductBrand" required placeholder="如：Burton">
                </div>
                <div class="form-group">
                    <label>类型 *</label>
                    <select id="newProductType" required>
                        ${typeOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>板长</label>
                    <input type="text" id="newProductLength" placeholder="如：158cm">
                </div>
                <div class="form-group">
                    <label>板宽</label>
                    <input type="text" id="newProductWidth" placeholder="如：25.5cm">
                </div>
                <div class="form-group">
                    <label>硬度 (1-10)</label>
                    <input type="number" id="newProductFlex" min="1" max="10" value="5">
                </div>
                <div class="form-group">
                    <label>日租金 *</label>
                    <input type="number" id="newProductPrice" required min="0" placeholder="如：199">
                </div>
                <div class="form-group">
                    <label>押金</label>
                    <input type="number" id="newProductDeposit" min="0" placeholder="如：500">
                </div>
                <div class="form-group">
                    <label>库存数量</label>
                    <input type="number" id="newProductStock" min="0" value="1">
                </div>
                <button type="submit" class="btn btn-primary btn-block">添加产品</button>
            </form>
        `);

        document.getElementById('addProductForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addProduct();
        });
    },

    /**
     * 添加产品
     */
    addProduct() {
        const name = document.getElementById('newProductName').value.trim();
        const brand = document.getElementById('newProductBrand').value.trim();
        const type = document.getElementById('newProductType').value;
        const length = document.getElementById('newProductLength').value.trim() || '150cm';
        const width = document.getElementById('newProductWidth').value.trim() || '25cm';
        const flex = parseInt(document.getElementById('newProductFlex').value) || 5;
        const price = parseInt(document.getElementById('newProductPrice').value) || 100;
        const deposit = parseInt(document.getElementById('newProductDeposit').value) || price * 2;
        const stock = parseInt(document.getElementById('newProductStock').value) || 1;

        if (!name || !brand || !type) {
            App.showToast('请填写必填项', 'error');
            return;
        }

        const product = {
            name,
            brand,
            type,
            length,
            width,
            flex,
            price,
            deposit,
            stock,
            sales: 0,
            featured: false,
            images: ['🏂', '❄️', '⛷️'],
            description: '新品上架'
        };

        SnowboardData.addProduct(product);
        App.closeModal();
        App.showToast('产品添加成功');
        this.renderInventory();
    },

    /**
     * 编辑产品
     */
    editProduct(productId) {
        const product = SnowboardData.getProduct(productId);
        if (!product) {
            App.showToast('产品不存在', 'error');
            return;
        }

        const typeOptions = Object.entries(SnowboardData.TYPE_CONFIG).map(([key, config]) =>
            `<option value="${key}" ${product.type === key ? 'selected' : ''}>${config.name}</option>`
        ).join('');

        App.showModal(`
            <h3>编辑产品</h3>
            <form class="form" id="editProductForm">
                <input type="hidden" id="editProductId" value="${escapeHtml(product.id)}">
                <div class="form-group">
                    <label>产品名称 *</label>
                    <input type="text" id="editProductName" required value="${escapeHtml(product.name)}">
                </div>
                <div class="form-group">
                    <label>品牌 *</label>
                    <input type="text" id="editProductBrand" required value="${escapeHtml(product.brand)}">
                </div>
                <div class="form-group">
                    <label>类型 *</label>
                    <select id="editProductType" required>
                        ${typeOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>板长</label>
                    <input type="text" id="editProductLength" value="${escapeHtml(product.length)}">
                </div>
                <div class="form-group">
                    <label>板宽</label>
                    <input type="text" id="editProductWidth" value="${escapeHtml(product.width)}">
                </div>
                <div class="form-group">
                    <label>硬度 (1-10)</label>
                    <input type="number" id="editProductFlex" min="1" max="10" value="${escapeHtml(String(product.flex))}">
                </div>
                <div class="form-group">
                    <label>日租金 *</label>
                    <input type="number" id="editProductPrice" required min="0" value="${escapeHtml(String(product.price))}">
                </div>
                <div class="form-group">
                    <label>押金</label>
                    <input type="number" id="editProductDeposit" min="0" value="${escapeHtml(String(product.deposit))}">
                </div>
                <div class="form-group">
                    <label>库存数量</label>
                    <input type="number" id="editProductStock" min="0" value="${escapeHtml(String(product.stock))}">
                </div>
                <button type="submit" class="btn btn-primary btn-block">保存修改</button>
            </form>
        `);

        document.getElementById('editProductForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });
    },

    /**
     * 保存产品修改
     */
    saveProduct() {
        const id = document.getElementById('editProductId').value;
        const updates = {
            name: document.getElementById('editProductName').value.trim(),
            brand: document.getElementById('editProductBrand').value.trim(),
            type: document.getElementById('editProductType').value,
            length: document.getElementById('editProductLength').value.trim(),
            width: document.getElementById('editProductWidth').value.trim(),
            flex: parseInt(document.getElementById('editProductFlex').value) || 5,
            price: parseInt(document.getElementById('editProductPrice').value) || 100,
            deposit: parseInt(document.getElementById('editProductDeposit').value) || 0,
            stock: parseInt(document.getElementById('editProductStock').value) || 0
        };

        if (SnowboardData.updateProduct(id, updates)) {
            App.closeModal();
            App.showToast('保存成功');
            this.renderInventory();
        } else {
            App.showToast('保存失败', 'error');
        }
    },

    /**
     * 删除产品
     */
    deleteProduct(productId) {
        const product = SnowboardData.getProduct(productId);
        if (!product) return;

        App.showModal(`
            <h3>确认删除</h3>
            <p style="margin: 16px 0;">确定要删除产品 <strong>${product.name}</strong> 吗？此操作不可撤销。</p>
            <div style="display: flex; gap: 12px;">
                <button class="btn btn-outline" onclick="App.closeModal()">取消</button>
                <button class="btn btn-primary" onclick="Admin.confirmDeleteProduct('${productId}')">确认删除</button>
            </div>
        `);
    },

    /**
     * 确认删除产品
     */
    confirmDeleteProduct(productId) {
        SnowboardData.deleteProduct(productId);
        App.closeModal();
        App.showToast('产品已删除');
        this.renderInventory();
    },

    /**
     * 渲染订单管理
     */
    renderOrders() {
        const tbody = document.getElementById('ordersTable');
        if (!tbody) return;

        let orders = SnowboardData.getOrders();

        // 应用筛选
        const filter = document.getElementById('adminOrderFilter');
        if (filter && filter.value !== 'all') {
            orders = orders.filter(o => o.status === filter.value);
        }

        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">暂无订单</td></tr>';
            return;
        }

        tbody.innerHTML = orders.map(order => {
            const firstItem = order.items[0] || {};
            const statusText = {
                pending: '待处理',
                active: '进行中',
                completed: '已完成',
                cancelled: '已取消'
            }[order.status] || order.status;

            const statusClass = {
                pending: 'pending',
                active: 'active',
                completed: 'completed',
                cancelled: 'completed'
            }[order.status] || '';

            return `
                <tr>
                    <td>${escapeHtml(order.id)}</td>
                    <td>${escapeHtml(order.userName || order.user_name || '-')}</td>
                    <td>${escapeHtml(firstItem.productName || '单板')}</td>
                    <td>${App.formatDateDisplay(order.start_date || order.rentStartDate)} ~ ${App.formatDateDisplay(order.end_date || order.rentEndDate)}</td>
                    <td>¥${order.total_price || order.total}</td>
                    <td><span class="order-status ${statusClass}">${statusText}</span></td>
                    <td>
                        <button class="action-btn view" onclick="Admin.viewOrderDetail('${escapeHtml(order.id)}')">查看</button>
                        ${order.status === 'pending' ? `
                            <button class="action-btn edit" onclick="Admin.updateOrderStatus('${escapeHtml(order.id)}', 'active')">确认取板</button>
                        ` : ''}
                        ${order.status === 'active' ? `
                            <button class="action-btn edit" onclick="Admin.updateOrderStatus('${escapeHtml(order.id)}', 'completed')">确认归还</button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    },

    /**
     * 筛选订单
     */
    filterOrders() {
        this.renderOrders();
    },

    /**
     * 查看订单详情
     */
    viewOrderDetail(orderId) {
        const orders = SnowboardData.getOrders();
        const order = orders.find(o => o.id === orderId);

        if (!order) {
            App.showToast('订单不存在', 'error');
            return;
        }

        let itemsHTML = order.items.map(item => `
            <div class="item-row">
                <span>${escapeHtml(item.productName)} × ${item.quantity}</span>
                <span>¥${item.pricePerDay * order.rentDays}/天</span>
            </div>
        `).join('');

        if (order.accessories && order.accessories.length > 0) {
            order.accessories.forEach(acc => {
                itemsHTML += `
                    <div class="item-row">
                        <span>${escapeHtml(acc.name)}</span>
                        <span>¥${acc.pricePerDay * acc.days}/天</span>
                    </div>
                `;
            });
        }

        App.showModal(`
            <h3>订单详情 - ${escapeHtml(order.id)}</h3>
            <div class="order-confirm">
                <div class="order-confirm-section">
                    <h4>📅 租赁信息</h4>
                    <div class="item-row">
                        <span>租赁日期</span>
                        <span>${App.formatDateDisplay(order.rentStartDate)} 至 ${App.formatDateDisplay(order.rentEndDate)}</span>
                    </div>
                    <div class="item-row">
                        <span>租赁天数</span>
                        <span>${order.rentDays} 天</span>
                    </div>
                    <div class="item-row">
                        <span>取板方式</span>
                        <span>${order.pickupType === 'delivery' ? '雪场直送' : '门店自取'}</span>
                    </div>
                    ${order.deliveryAddress ? `
                        <div class="item-row">
                            <span>配送地址</span>
                            <span>${escapeHtml(order.deliveryAddress)}</span>
                        </div>
                    ` : ''}
                </div>

                <div class="order-confirm-section">
                    <h4>🏂 租赁装备</h4>
                    ${itemsHTML}
                </div>

                <div class="order-confirm-section">
                    <h4>👤 客户信息</h4>
                    <div class="item-row">
                        <span>姓名</span>
                        <span>${escapeHtml(order.userName || '-')}</span>
                    </div>
                    <div class="item-row">
                        <span>手机号</span>
                        <span>${escapeHtml(order.userPhone || '-')}</span>
                    </div>
                    ${order.userIdCard ? `
                        <div class="item-row">
                            <span>身份证</span>
                            <span>${escapeHtml(order.userIdCard)}</span>
                        </div>
                    ` : ''}
                </div>

                <div class="order-confirm-section">
                    <h4>💰 费用明细</h4>
                    <div class="item-row">
                        <span>租金</span>
                        <span>¥${order.total}</span>
                    </div>
                    <div class="item-row">
                        <span>押金</span>
                        <span>¥${order.deposit}</span>
                    </div>
                    <div class="item-row total">
                        <span>合计</span>
                        <span>¥${order.total + order.deposit}</span>
                    </div>
                </div>

                ${order.remarks ? `
                    <div class="order-confirm-section">
                        <h4>📝 备注</h4>
                        <p>${escapeHtml(order.remarks)}</p>
                    </div>
                ` : ''}
            </div>
            <button class="btn btn-primary btn-block mt-20" onclick="App.closeModal()">关闭</button>
        `);
    },

    /**
     * 更新订单状态
     */
    updateOrderStatus(orderId, status) {
        SnowboardData.updateOrderStatus(orderId, status);
        App.showToast('状态已更新');
        this.renderOrders();
    },

    /**
     * 渲染用户管理
     */
    renderUsers() {
        const tbody = document.getElementById('usersTable');
        if (!tbody) return;

        const users = SnowboardData.getUsers();
        const orders = SnowboardData.getOrders();

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">暂无用户数据</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => {
            const userOrders = orders.filter(o => o.userPhone === user.phone);
            return `
                <tr>
                    <td>${escapeHtml(user.id)}</td>
                    <td>${escapeHtml(user.name)}</td>
                    <td>${escapeHtml(user.phone)}</td>
                    <td>${userOrders.length} 单</td>
                    <td>${user.createdAt ? App.formatDateDisplay(user.createdAt) : '-'}</td>
                </tr>
            `;
        }).join('');
    }
};