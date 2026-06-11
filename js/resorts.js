/**
 * 冰雪之巅 - 雪场路由
 * SPA 路由：#resort/{id} 渲染雪场详情页
 * SEO：每个雪场页面有独立 title/description/OG/JSON-LD
 */

const ResortRouter = {
    currentResortId: null,
    baseUrl: 'https://kid221b.github.io/snowboard-rentalll',

    /**
     * 初始化路由监听
     */
    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        // 拦截"雪场列表"链接
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#resort/"]');
            if (!link) return;
            // 默认 hash 跳转 + 路由处理
            setTimeout(() => this.handleRoute(), 10);
        });
    },

    /**
     * 处理当前 hash
     */
    handleRoute() {
        const hash = window.location.hash;
        const match = hash.match(/^#resort\/(.+)$/);
        if (match) {
            this.showResortDetail(match[1]);
        } else if (hash === '#resorts') {
            this.showResortList();
        }
    },

    /**
     * 渲染雪场列表页
     */
    showResortList() {
        const resorts = DeliveryConfig.RESORTS;
        const html = `
            <div class="resort-list-page">
                <header class="page-header">
                    <h1 data-i18n="resort.listTitle">全国合作雪场</h1>
                    <p class="page-subtitle">${resorts.length} 个雪场，覆盖崇礼、北京、东北、新疆、川滇</p>
                </header>
                <div class="resort-grid">
                    ${resorts.map(r => this.renderResortCard(r)).join('')}
                </div>
            </div>
        `;
        this.renderIntoPage(html, {
            title: '合作雪场 - 冰雪之巅',
            description: '冰雪之巅全国合作雪场列表，覆盖崇礼万龙、云顶、太舞，北京南山、军都山，东北亚布力、北大壶，新疆天山等 16 个滑雪场。'
        });
        if (window.I18N) I18N.applyToDOM();
    },

    /**
     * 渲染单个雪场卡片
     */
    renderResortCard(resort) {
        return `
            <a href="#resort/${resort.id}" class="resort-card" aria-label="${resort.name} 详情">
                <div class="resort-card-icon">${this.getResortEmoji(resort.region)}</div>
                <div class="resort-card-body">
                    <h3>${this.escapeHtml(resort.name)}</h3>
                    <div class="resort-card-meta">
                        <span>📍 ${this.escapeHtml(resort.region)}</span>
                        <span>📏 ${this.escapeHtml(resort.altitude)}</span>
                        <span>⛷️ ${this.escapeHtml(resort.runs)}</span>
                    </div>
                </div>
            </a>
        `;
    },

    /**
     * 雪场 emoji
     */
    getResortEmoji(region) {
        if (region.includes('河北') || region.includes('北京')) return '🏔️';
        if (region.includes('黑龙江') || region.includes('吉林')) return '❄️';
        if (region.includes('新疆')) return '🏜️';
        if (region.includes('四川')) return '⛰️';
        if (region.includes('云南')) return '🗻';
        return '🎿';
    },

    /**
     * 渲染雪场详情页
     */
    showResortDetail(resortId) {
        const resort = DeliveryConfig.RESORTS.find(r => r.id === resortId);
        if (!resort) {
            this.showResortList();
            return;
        }
        this.currentResortId = resortId;

        // 计算相关产品（按 heightRange 适合此雪场海拔的板子）
        const products = SnowboardData.PRODUCTS.filter(p => {
            if (resort.altitude.includes('4000m') || resort.altitude.includes('3000m')) {
                return p.terrain.includes('powder') || p.terrain.includes('backcountry');
            }
            return true;
        }).slice(0, 6);

        const html = `
            <div class="resort-detail-page">
                <nav class="breadcrumb" aria-label="面包屑">
                    <a href="#home">首页</a> / <a href="#resorts">雪场</a> / <span>${this.escapeHtml(resort.name)}</span>
                </nav>

                <header class="resort-hero">
                    <div class="resort-hero-icon">${this.getResortEmoji(resort.region)}</div>
                    <div class="resort-hero-content">
                        <h1>${this.escapeHtml(resort.name)}</h1>
                        <p class="resort-hero-region">📍 ${this.escapeHtml(resort.region)}</p>
                        <div class="resort-hero-stats">
                            <div class="stat">
                                <div class="stat-label">海拔</div>
                                <div class="stat-value">${this.escapeHtml(resort.altitude)}</div>
                            </div>
                            <div class="stat">
                                <div class="stat-label">雪道</div>
                                <div class="stat-value">${this.escapeHtml(resort.runs)}</div>
                            </div>
                            <div class="stat">
                                <div class="stat-label">类型</div>
                                <div class="stat-value">${resort.altitude.includes('4000m') ? '高山' : '山地'}</div>
                            </div>
                        </div>
                    </div>
                </header>

                <section class="resort-section">
                    <h2>为什么选择 ${this.escapeHtml(resort.name)}</h2>
                    <div class="resort-features">
                        <p>${this.escapeHtml(resort.name)} 位于 ${this.escapeHtml(resort.region)}，海拔 ${this.escapeHtml(resort.altitude)}，拥有 ${this.escapeHtml(resort.runs)}，适合从初学者到专业玩家的各级别雪友。</p>
                        <p>冰雪之巅提供完整的装备租赁 + 雪场直送服务，让你的 ${this.escapeHtml(resort.name)} 之旅无忧无虑。</p>
                    </div>
                </section>

                <section class="resort-section">
                    <h2>推荐装备</h2>
                    <div class="resort-products">
                        ${products.map(p => this.renderProductTeaser(p)).join('')}
                    </div>
                </section>

                <section class="resort-section">
                    <h2>装备租赁 + 雪场直送</h2>
                    <div class="resort-cta">
                        <p>选择你心仪的装备，结账时选择"<strong>雪场直送</strong>"，我们会提前 1 天把板子送到你入住的雪场酒店前台。</p>
                        <a href="#products" class="btn btn-primary btn-large">🎿 去挑装备</a>
                    </div>
                </section>
            </div>
        `;

        this.renderIntoPage(html, {
            title: `${resort.name} 装备租赁 - 冰雪之巅`,
            description: `${resort.name}（${resort.region}）单板滑雪装备租赁，海拔${resort.altitude}，${resort.runs}。提供雪场直送服务，${products.length}+ 款专业单板可选。`,
            jsonLd: this.buildResortJsonLd(resort)
        });
        if (window.I18N) I18N.applyToDOM();
    },

    /**
     * 渲染产品简短卡片
     */
    renderProductTeaser(product) {
        return `
            <a href="#products" class="resort-product-card" onclick="setTimeout(() => App.showProductDetail('${product.id}'), 100)">
                <div class="resort-product-image">${BoardRenderer.render(product, { width: 200, height: 100, showBrand: false })}</div>
                <div class="resort-product-info">
                    <div class="resort-product-name">${this.escapeHtml(product.name)}</div>
                    <div class="resort-product-price">¥${product.price}/天起</div>
                </div>
            </a>
        `;
    },

    /**
     * 渲染到主页（page-resorts 节点）
     */
    renderIntoPage(html, seo = {}) {
        // 动态创建 / 复用 #page-resorts
        let page = document.getElementById('page-resorts');
        if (!page) {
            page = document.createElement('section');
            page.id = 'page-resorts';
            page.className = 'page';
            const main = document.getElementById('app');
            if (main) main.appendChild(page);
        }
        page.innerHTML = html;
        App.navigateTo('resorts');
        this.applySEO(seo);
    },

    /**
     * 应用 SEO meta（document.title + meta + JSON-LD）
     */
    applySEO({ title, description, jsonLd }) {
        if (title) document.title = title;
        if (description) {
            this.setMeta('description', description);
            this.setMeta('og:title', title, 'property');
            this.setMeta('og:description', description, 'property');
        }
        // 注入 JSON-LD
        if (jsonLd) {
            this.injectJsonLd('resort-jsonld', jsonLd);
        }
        // canonical
        const url = `${this.baseUrl}/#resort/${this.currentResortId || ''}`;
        this.setLink('canonical', url);
    },

    setMeta(name, content, attr = 'name') {
        let el = document.querySelector(`meta[${attr}="${name}"]`);
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute(attr, name);
            document.head.appendChild(el);
        }
        el.setAttribute('content', content);
    },

    setLink(rel, href) {
        let el = document.querySelector(`link[rel="${rel}"]`);
        if (!el) {
            el = document.createElement('link');
            el.rel = rel;
            document.head.appendChild(el);
        }
        el.href = href;
    },

    injectJsonLd(id, data) {
        let el = document.getElementById(id);
        if (el) el.remove();
        el = document.createElement('script');
        el.type = 'application/ld+json';
        el.id = id;
        el.textContent = JSON.stringify(data);
        document.head.appendChild(el);
    },

    /**
     * 雪场 JSON-LD（TouristAttraction + BreadcrumbList）
     */
    buildResortJsonLd(resort) {
        return {
            '@context': 'https://schema.org',
            '@type': 'SkiResort',
            'name': resort.name,
            'description': `${resort.name}位于${resort.region}，海拔${resort.altitude}，拥有${resort.runs}。`,
            'address': {
                '@type': 'PostalAddress',
                'addressRegion': resort.region,
                'addressCountry': 'CN'
            },
            'geo': {
                '@type': 'GeoCoordinates',
                'elevation': this.parseAltitude(resort.altitude)
            },
            'amenityFeature': [
                { '@type': 'LocationFeatureSpecification', 'name': '雪道数量', 'value': resort.runs }
            ],
            'potentialAction': {
                '@type': 'ReserveAction',
                'target': `${this.baseUrl}/#products`,
                'name': '租赁单板装备'
            }
        };
    },

    parseAltitude(altitudeStr) {
        const match = altitudeStr.match(/(\d+)/);
        return match ? parseInt(match[1]) : undefined;
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

window.ResortRouter = ResortRouter;
