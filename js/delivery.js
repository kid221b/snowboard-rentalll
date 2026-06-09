/**
 * 冰雪之巅 - 交付方式模块
 * 3 种交付方式：门店自取 / 雪场直送 / 快递上门
 * 自动计算邮费
 */

const DeliveryConfig = {
    // 交付方式
    METHODS: {
        store: {
            id: 'store',
            name: '门店自取',
            icon: '🏬',
            desc: '到店自取，零运费',
            fee: 0,
            eta: '随时可取'
        },
        resort: {
            id: 'resort',
            name: '雪场直送',
            icon: '🎿',
            desc: '配送到您入住的雪场酒店，前台代收',
            fee: 50,
            eta: '租赁日前 1 天送达'
        },
        express: {
            id: 'express',
            name: '快递上门',
            icon: '📦',
            desc: '顺丰/京东直送到家，3-5 天到达',
            fee: 30,
            eta: '下单后 3-5 个工作日'
        }
    },

    // 全国主要雪场（合作伙伴）
    RESORTS: [
        { id: 'chongli-wanquan', name: '崇礼万龙滑雪场', region: '河北张家口', altitude: '2110m', runs: '32条雪道' },
        { id: 'chongli-genting', name: '崇礼云顶滑雪场', region: '河北张家口', altitude: '2104m', runs: '41条雪道' },
        { id: 'chongli-thaiwoo', name: '崇礼太舞滑雪场', region: '河北张家口', altitude: '2160m', runs: '28条雪道' },
        { id: 'chongli-cuocao', name: '崇礼翠云山银河滑雪场', region: '河北张家口', altitude: '2080m', runs: '12条雪道' },
        { id: 'chongli-duolemeidi', name: '崇礼多乐美地滑雪场', region: '河北张家口', altitude: '2070m', runs: '9条雪道' },
        { id: 'beijing-jundushan', name: '北京军都山滑雪场', region: '北京昌平', altitude: '600m', runs: '5条雪道' },
        { id: 'beijing-nanshan', name: '北京南山滑雪场', region: '北京密云', altitude: '220m', runs: '25条雪道' },
        { id: 'beijing-huaibei', name: '北京怀北国际滑雪场', region: '北京怀柔', altitude: '750m', runs: '8条雪道' },
        { id: 'heilongjiang-yabuli', name: '黑龙江亚布力滑雪场', region: '黑龙江哈尔滨', altitude: '1374m', runs: '46条雪道' },
        { id: 'heilongjiang-sunlight', name: '黑龙江阳光度假村', region: '黑龙江哈尔滨', altitude: '1300m', runs: '30条雪道' },
        { id: 'jilin-beidahu', name: '吉林北大壶滑雪场', region: '吉林吉林', altitude: '1400m', runs: '27条雪道' },
        { id: 'jilin-songhua', name: '吉林松花湖滑雪场', region: '吉林吉林', altitude: '935m', runs: '33条雪道' },
        { id: 'xinjiang-tianshan', name: '新疆天山国际滑雪场', region: '新疆乌鲁木齐', altitude: '2400m', runs: '18条雪道' },
        { id: 'xinjiang-jikepulin', name: '新疆将军山滑雪场', region: '新疆阿勒泰', altitude: '1320m', runs: '20条雪道' },
        { id: 'sichuan-luding', name: '四川海螺沟冰川滑雪场', region: '四川甘孜', altitude: '2940m', runs: '4条雪道' },
        { id: 'yunnan-luoping', name: '云南玉龙雪山滑雪场', region: '云南丽江', altitude: '4500m', runs: '5条雪道' }
    ],

    /**
     * 渲染交付方式选择 UI（嵌入 step3）
     */
    renderMethodSelector(currentMethod = 'store') {
        return `
            <div class="delivery-methods" id="deliveryMethods">
                ${Object.values(this.METHODS).map(method => `
                    <label class="delivery-method ${method.id === currentMethod ? 'selected' : ''}" data-method="${method.id}">
                        <input type="radio" name="pickupType" value="${method.id}" ${method.id === currentMethod ? 'checked' : ''}>
                        <div class="delivery-icon">${method.icon}</div>
                        <div class="delivery-info">
                            <div class="delivery-name">${this.escapeHtml(method.name)}</div>
                            <div class="delivery-desc">${this.escapeHtml(method.desc)}</div>
                            <div class="delivery-meta">
                                <span class="delivery-fee">${method.fee === 0 ? '免运费' : '+¥' + method.fee}</span>
                                <span class="delivery-eta">${this.escapeHtml(method.eta)}</span>
                            </div>
                        </div>
                    </label>
                `).join('')}
            </div>
        `;
    },

    /**
     * 渲染雪场选择器（resort / express 时显示）
     */
    renderResortSelector(selectedId = '') {
        return `
            <div class="form-group" id="resortSelectGroup" style="display:none;">
                <label>选择雪场 / 配送区域</label>
                <select id="deliveryResort">
                    <option value="">-- 请选择雪场 --</option>
                    ${this.RESORTS.map(r => `
                        <option value="${r.id}" ${r.id === selectedId ? 'selected' : ''}>${this.escapeHtml(r.name)}（${this.escapeHtml(r.region)}）</option>
                    `).join('')}
                </select>
                <div id="resortInfo" class="resort-info"></div>
            </div>
            <div class="form-group" id="expressAddressGroup" style="display:none;">
                <label>快递地址 *</label>
                <input type="text" id="deliveryAddress" placeholder="请输入完整地址（省/市/区/街道/门牌）">
                <select id="expressRegion" style="margin-top: 8px;">
                    <option value="normal">普通地区（免邮偏远附加）</option>
                    <option value="remote">偏远地区（+¥20）</option>
                </select>
            </div>
        `;
    },

    /**
     * 计算运费
     */
    calculateFee(method, options = {}) {
        const baseMethod = this.METHODS[method];
        if (!baseMethod) return 0;
        let fee = baseMethod.fee;
        if (method === 'express' && options.region === 'remote') {
            fee += 20;  // 偏远地区附加
        }
        return fee;
    },

    /**
     * 描述（用于订单确认页）
     */
    describe(method, options = {}) {
        const m = this.METHODS[method];
        if (!m) return '未知';
        let desc = `${m.icon} ${m.name}`;
        if (method === 'resort' && options.resortId) {
            const resort = this.RESORTS.find(r => r.id === options.resortId);
            if (resort) desc += ` → ${resort.name}`;
        } else if (method === 'express') {
            if (options.region === 'remote') desc += '（偏远地区）';
            if (options.address) desc += ` → ${options.address.substring(0, 20)}${options.address.length > 20 ? '...' : ''}`;
        }
        return desc;
    },

    /**
     * 转义
     */
    escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }
};

window.DeliveryConfig = DeliveryConfig;
