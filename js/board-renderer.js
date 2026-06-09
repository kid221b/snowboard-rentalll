/**
 * 冰雪之巅 - 程序化雪板 SVG 渲染器
 * 根据产品参数（板长/板宽/板型/camber）生成矢量雪板图
 * 不依赖外部图片，离线可用
 */

const BoardRenderer = {
    // 板型配色（按 type）
    TYPE_COLORS: {
        'all-mountain': { main: '#2c3e50', accent: '#e74c3c', tip: '#c0392b' },     // 深蓝 + 红
        'freestyle': { main: '#8e44ad', accent: '#f39c12', tip: '#d35400' },        // 紫 + 橙
        'freeride': { main: '#1a1a2e', accent: '#16a085', tip: '#0e6655' },        // 黑 + 青
        'women': { main: '#e91e63', accent: '#ffc0cb', tip: '#ad1457' }            // 粉
    },

    // 品牌 logo 风格（颜色 + 字体）
    BRAND_FONT: {
        'Burton': { color: '#fff', size: 22, weight: 900 },
        'Rossignol': { color: '#fff', size: 18, weight: 800 },
        'Jones': { color: '#fff', size: 26, weight: 900 },
        'Never Summer': { color: '#fff', size: 14, weight: 700 },
        'GNU': { color: '#fff', size: 32, weight: 900 },
        'CAPiTA': { color: '#fff', size: 18, weight: 800 },
        'Arbor': { color: '#fff', size: 22, weight: 800 },
        'Rome': { color: '#fff', size: 24, weight: 900 },
        'Bataleon': { color: '#fff', size: 16, weight: 800 },
        'Roxy': { color: '#fff', size: 20, weight: 800 },
        'Salomon': { color: '#fff', size: 16, weight: 800 },
        'Yes.': { color: '#fff', size: 26, weight: 900 }
    },

    /**
     * 生成雪板 SVG 字符串
     * @param {object} product - 产品数据
     * @param {object} options - { width, height, showBrand }
     * @returns {string} SVG 字符串
     */
    render(product, options = {}) {
        const { width = 280, height = 180, showBrand = true } = options;
        const colors = this.TYPE_COLORS[product.type] || this.TYPE_COLORS['all-mountain'];
        const font = this.BRAND_FONT[product.brand] || this.BRAND_FONT['Burton'];

        // 解析板长（cm）→ 高度比例
        const lengthNum = parseInt(product.length) || 155;
        const lengthScale = 0.5 + (lengthNum - 140) / 50;  // 140cm=0.5, 190cm=1.0
        const lengthScaleClamped = Math.max(0.55, Math.min(1.0, lengthScale));

        // 解析板宽（cm）→ 板腰宽度
        const widthNum = parseFloat(product.width) || 25.0;
        const waistScale = 0.18 + (widthNum - 22) / 30;  // 22cm=0.18, 28cm=0.34
        const waistScaleClamped = Math.max(0.18, Math.min(0.34, waistScale));

        // 板型 → 头尾形状
        const shape = product.shape || 'twin';
        let tipPath, tailPath;
        if (shape === 'directional') {
            // 方向板：头长尾短
            tipPath = 'M -90 0 Q -80 -8 -60 -7 L 60 -5 Q 80 -3 90 0 Q 80 3 60 5 L -60 7 Q -80 8 -90 0 Z';
            tailPath = 'M 90 0 Q 80 -8 60 -7 L -60 -5 Q -80 -3 -90 0 Q -80 3 -60 5 L 60 7 Q 80 8 90 0 Z';
        } else if (shape === 'twin-tip') {
            // 双向 tip：头尾对称但更圆
            tipPath = 'M -90 0 Q -85 -10 -60 -8 L 60 -8 Q 85 -10 90 0 Q 85 10 60 8 L -60 8 Q -85 10 -90 0 Z';
            tailPath = 'M 90 0 Q 85 -10 60 -8 L -60 -8 Q -85 -10 -90 0 Q -85 10 -60 8 L 60 8 Q 85 10 90 0 Z';
        } else {
            // twin：完全对称
            tipPath = 'M -90 0 Q -85 -9 -60 -7 L 60 -7 Q 85 -9 90 0 Q 85 9 60 7 L -60 7 Q -85 9 -90 0 Z';
            tailPath = tipPath;
        }

        // camber → 板底曲线
        const camber = product.camber || 'flat';
        let bottomLine;
        if (camber === 'camber') {
            // 正拱：中间高
            bottomLine = 'M -88 0 Q 0 -3 88 0';
        } else if (camber === 'rocker') {
            // 反拱：中间低
            bottomLine = 'M -88 0 Q 0 3 88 0';
        } else if (camber === 'hybrid') {
            // 混合：前 rocker 后 camber
            bottomLine = 'M -88 0 Q -20 2 0 0 Q 20 -2 88 0';
        } else {
            // flat：平底
            bottomLine = 'M -88 0 L 88 0';
        }

        // 板长方向缩放（让长板视觉上更长）
        const viewBoxWidth = 200 * lengthScaleClamped;
        const offsetX = -viewBoxWidth / 2;

        // 组装 SVG
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${offsetX} -15 ${viewBoxWidth} 30" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <defs>
                <linearGradient id="bg-${product.id}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="${colors.main}" stop-opacity="0.08"/>
                    <stop offset="50%" stop-color="${colors.main}" stop-opacity="0.15"/>
                    <stop offset="100%" stop-color="${colors.main}" stop-opacity="0.05"/>
                </linearGradient>
                <linearGradient id="board-${product.id}" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="${colors.tip}"/>
                    <stop offset="50%" stop-color="${colors.main}"/>
                    <stop offset="100%" stop-color="${colors.tip}"/>
                </linearGradient>
                <linearGradient id="accent-${product.id}" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="${colors.accent}" stop-opacity="0"/>
                    <stop offset="30%" stop-color="${colors.accent}" stop-opacity="1"/>
                    <stop offset="70%" stop-color="${colors.accent}" stop-opacity="1"/>
                    <stop offset="100%" stop-color="${colors.accent}" stop-opacity="0"/>
                </linearGradient>
                <filter id="shadow-${product.id}" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.25"/>
                </filter>
            </defs>

            <!-- 背景渐变 -->
            <rect x="${offsetX}" y="-15" width="${viewBoxWidth}" height="30" fill="url(#bg-${product.id})" rx="4"/>

            <!-- 雪板主体（板面顶视） -->
            <g filter="url(#shadow-${product.id})">
                <path d="${tipPath}" fill="url(#board-${product.id})" stroke="${colors.tip}" stroke-width="0.5"/>
            </g>

            <!-- 板底 camber 曲线（虚线） -->
            <path d="${bottomLine}" fill="none" stroke="${colors.accent}" stroke-width="0.6" stroke-dasharray="2,1.5" opacity="0.7"/>

            <!-- 中央腰线（板宽可视） -->
            <line x1="-70" y1="0" x2="70" y2="0" stroke="${colors.accent}" stroke-width="0.3" opacity="0.5"/>
            <line x1="-88" y1="0" x2="-70" y2="0" stroke="${colors.accent}" stroke-width="0.8" opacity="0.7"/>
            <line x1="70" y1="0" x2="88" y2="0" stroke="${colors.accent}" stroke-width="0.8" opacity="0.7"/>

            <!-- 中部品牌色带 -->
            <rect x="-50" y="-7" width="100" height="14" fill="url(#accent-${product.id})" opacity="0.85"/>

            <!-- 绑定位标志（前后 4 个孔） -->
            <g fill="#fff" opacity="0.9">
                <circle cx="-30" cy="-3" r="0.8"/>
                <circle cx="-30" cy="3" r="0.8"/>
                <circle cx="30" cy="-3" r="0.8"/>
                <circle cx="30" cy="3" r="0.8"/>
            </g>

            <!-- 中心 logo / 品牌名 -->
            ${showBrand ? `<text x="0" y="2" text-anchor="middle" dominant-baseline="middle" font-family="-apple-system, 'Helvetica Neue', Arial, sans-serif" font-size="${font.size / 4}" font-weight="${font.weight}" fill="${font.color}" letter-spacing="0.5">${this.escapeXml(product.brand.toUpperCase())}</text>` : ''}

            <!-- 板长标注（小字） -->
            <text x="0" y="12" text-anchor="middle" font-family="monospace" font-size="3" fill="${colors.main}" opacity="0.6">${this.escapeXml(product.length)}</text>
        </svg>`;

        return svg;
    },

    /**
     * 渲染为 data URL（用于 img src）
     */
    renderAsDataURL(product, options = {}) {
        const svg = this.render(product, options);
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    },

    /**
     * 转义 XML 特殊字符
     */
    escapeXml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
};

window.BoardRenderer = BoardRenderer;
