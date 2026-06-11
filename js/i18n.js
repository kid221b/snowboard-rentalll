/**
 * 冰雪之巅 - 国际化（i18n）模块
 * 轻量自建 i18n 框架，支持中英双语切换
 * 用法：i18n.t('key.path') / i18n.setLocale('en') / i18n.autoDetect()
 */

const I18N = {
    STORAGE_KEY: 'snowboard_locale',
    SUPPORTED: ['zh-CN', 'en'],
    DEFAULT: 'zh-CN',
    current: 'zh-CN',

    translations: {},

    /**
     * 初始化：加载字典
     */
    async init() {
        // 从 localStorage 取上次选择
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved && this.SUPPORTED.includes(saved)) {
            this.current = saved;
        } else {
            // 自动检测浏览器语言
            this.current = this.autoDetect();
        }

        // 加载两个字典
        try {
            const [zh, en] = await Promise.all([
                fetch('./locales/zh-CN.json').then(r => r.json()),
                fetch('./locales/en.json').then(r => r.json())
            ]);
            this.translations['zh-CN'] = zh;
            this.translations['en'] = en;
            console.log('[i18n] Loaded', Object.keys(this.translations).length, 'locales');
        } catch (err) {
            console.warn('[i18n] Failed to load locales:', err);
        }
    },

    /**
     * 自动检测浏览器语言
     */
    autoDetect() {
        const lang = navigator.language || navigator.userLanguage || 'zh-CN';
        if (lang.startsWith('en')) return 'en';
        if (lang.startsWith('zh')) return 'zh-CN';
        return this.DEFAULT;
    },

    /**
     * 切换语言
     */
    setLocale(locale) {
        if (!this.SUPPORTED.includes(locale)) return;
        this.current = locale;
        localStorage.setItem(this.STORAGE_KEY, locale);
        document.documentElement.lang = locale.split('-')[0];
        this.applyToDOM();
    },

    /**
     * 获取翻译（支持嵌套路径 'home.hero.title'）
     */
    t(key, params = {}) {
        const dict = this.translations[this.current] || this.translations[this.DEFAULT] || {};
        const keys = key.split('.');
        let result = dict;
        for (const k of keys) {
            if (result && typeof result === 'object' && k in result) {
                result = result[k];
            } else {
                return key;  // fallback: 返回原 key
            }
        }
        if (typeof result === 'string' && Object.keys(params).length > 0) {
            return result.replace(/\{(\w+)\}/g, (m, name) => params[name] || m);
        }
        return result;
    },

    /**
     * 扫描 DOM 自动应用 [data-i18n] / [data-i18n-placeholder] / [data-i18n-title]
     */
    applyToDOM() {
        // text content
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = this.t(key);
        });
        // placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.t(key);
        });
        // title
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            el.title = this.t(key);
        });
        // aria-label
        document.querySelectorAll('[data-i18n-aria]').forEach(el => {
            const key = el.getAttribute('data-i18n-aria');
            el.setAttribute('aria-label', this.t(key));
        });
        // document.title
        const titleKey = document.documentElement.getAttribute('data-i18n-title');
        if (titleKey) document.title = this.t(titleKey);

        // 触发自定义事件，让其他模块能更新
        window.dispatchEvent(new CustomEvent('localeChanged', { detail: { locale: this.current } }));
    },

    /**
     * 渲染语言切换器 UI
     */
    renderSwitcher(currentLocale = this.current) {
        return `
            <div class="locale-switcher" role="group" aria-label="语言切换">
                <button class="locale-btn ${currentLocale === 'zh-CN' ? 'active' : ''}" data-locale="zh-CN" aria-label="切换到中文" type="button">
                    🇨🇳 中文
                </button>
                <button class="locale-btn ${currentLocale === 'en' ? 'active' : ''}" data-locale="en" aria-label="Switch to English" type="button">
                    🇺🇸 EN
                </button>
            </div>
        `;
    },

    /**
     * 绑定切换器事件（延迟绑定以支持动态插入）
     */
    bindSwitcher(containerSelector) {
        const containers = document.querySelectorAll(containerSelector);
        containers.forEach(container => {
            if (!container.querySelector('.locale-switcher')) {
                container.insertAdjacentHTML('beforeend', this.renderSwitcher());
            }
            container.addEventListener('click', (e) => {
                const btn = e.target.closest('.locale-btn');
                if (!btn) return;
                const locale = btn.getAttribute('data-locale');
                this.setLocale(locale);
                // 重新渲染切换器状态
                container.querySelectorAll('.locale-btn').forEach(b => {
                    b.classList.toggle('active', b.getAttribute('data-locale') === locale);
                });
            });
        });
    }
};

window.I18N = I18N;
