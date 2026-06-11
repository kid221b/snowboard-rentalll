/**
 * 冰雪之巅 - Service Worker
 * 缓存策略：
 * 1. App Shell（HTML / CSS / JS）：stale-while-revalidate
 * 2. 静态资源（图标 / SVG）：cache-first
 * 3. Supabase API：network-only（永远拿最新数据）
 * 4. CDN（jsdelivr）：stale-while-revalidate
 * 5. 离线 fallback：返回 offline.html
 */

const CACHE_VERSION = 'v1.2.1';
const STATIC_CACHE = `snowboard-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `snowboard-runtime-${CACHE_VERSION}`;
const CDN_CACHE = `snowboard-cdn-${CACHE_VERSION}`;

// 安装时预缓存 App Shell
const PRECACHE_URLS = [
    './',
    './index.html',
    './offline.html',
    './css/styles.css',
    './js/data.js',
    './js/board-renderer.js',
    './js/delivery.js',
    './js/i18n.js',
    './js/app.js',
    './js/cart.js',
    './js/order.js',
    './js/admin.js',
    './js/recommendation.js',
    './js/auth.js',
    './js/api.js',
    './js/host.js',
    './js/trust.js',
    './js/community.js',
    './js/profile.js',
    './js/coupons.js',
    './js/resorts.js',
    './manifest.json'
];

// 安装阶段
self.addEventListener('install', (event) => {
    console.log('[SW] Installing', CACHE_VERSION);
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                return cache.addAll(PRECACHE_URLS.map((url) => new Request(url, { cache: 'reload' })))
                    .catch((err) => {
                        console.warn('[SW] Precache failed (partial):', err.message);
                        // 部分资源失败不阻塞
                    });
            })
            .then(() => self.skipWaiting())
    );
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating', CACHE_VERSION);
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name.startsWith('snowboard-') && !name.endsWith(CACHE_VERSION))
                        .map((name) => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

// 拦截请求
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // 只处理 GET
    if (request.method !== 'GET') return;

    // 跳过 Supabase API（永远 network）
    if (url.hostname.includes('supabase.co')) {
        return;  // 浏览器原生处理
    }

    // 跳过 Chrome extension
    if (url.protocol === 'chrome-extension:') return;

    // CDN 资源：stale-while-revalidate
    if (url.hostname.includes('jsdelivr.net') || url.hostname.includes('cdnjs.cloudflare.com')) {
        event.respondWith(staleWhileRevalidate(request, CDN_CACHE));
        return;
    }

    // 同源 HTML：network-first（确保用户拿到最新版本），fallback offline.html
    if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
        event.respondWith(networkFirstWithOffline(request));
        return;
    }

    // 同源静态资源（CSS / JS / 图片 / 字体）：stale-while-revalidate
    if (url.origin === self.location.origin) {
        event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
        return;
    }
});

// network-first：优先网络，失败时缓存
async function networkFirstWithOffline(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        const cached = await caches.match(request);
        if (cached) return cached;
        const offline = await caches.match('./offline.html');
        if (offline) return offline;
        return new Response('Offline', { status: 503, statusText: 'Offline' });
    }
}

// stale-while-revalidate：先返回缓存，后台更新
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    const fetchPromise = fetch(request)
        .then((response) => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => cached);

    return cached || fetchPromise;
}

// 接收消息（强制更新 / 跳过等待）
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
