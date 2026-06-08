/**
 * 冰雪之巅 - API 数据操作模块
 * 处理与 Supabase 后端的数据交互
 */

import { supabase } from './supabase-client.js';
import { getCurrentUser } from './auth.js';

/**
 * HTML 转义，防止 XSS
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

/**
 * 字段白名单过滤（防 updateProduct/updateProfile 字段注入）
 * @param {object} updates - 原始更新对象
 * @param {string[]} allowed - 允许的字段列表
 * @returns {object}
 */
export function sanitizeUpdates(updates, allowed) {
    return Object.fromEntries(
        Object.entries(updates).filter(([k]) => allowed.includes(k))
    );
}

/**
 * 获取单板列表
 * @returns {Promise<Array>}
 */
export async function getProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('featured', { ascending: false })
            .order('sales', { ascending: false });

        if (error) {
            console.warn('获取单板失败:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('获取单板异常:', err);
        return [];
    }
}

/**
 * 获取单个单板详情
 * @param {string} productId - 单板ID
 * @returns {Promise<object|null>}
 */
export async function getProduct(productId) {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (error) {
            return null;
        }

        return data;
    } catch (err) {
        return null;
    }
}

/**
 * 获取配件列表
 * @returns {Promise<Array>}
 */
export async function getAccessories() {
    try {
        const { data, error } = await supabase
            .from('accessories')
            .select('*')
            .order('id');

        if (error) {
            console.warn('获取配件失败:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('获取配件异常:', err);
        return [];
    }
}

/**
 * 创建订单
 * @param {object} orderData - 订单数据
 * @returns {Promise<{success: boolean, orderId?: string, error?: string}>}
 */
export async function createOrder(orderData) {
    try {
        const user = await getCurrentUser();

        const order = {
            user_id: user?.id || null,
            product_id: orderData.product_id || orderData.productId || '',
            accessory_ids: orderData.accessory_ids || orderData.accessoryIds || [],
            start_date: orderData.start_date || orderData.startDate || '',
            end_date: orderData.end_date || orderData.endDate || '',
            total_days: orderData.total_days || orderData.totalDays || 0,
            total_price: orderData.total_price || orderData.totalPrice || 0,
            deposit: orderData.deposit || 0,
            status: 'pending'
        };

        if (!order.product_id) {
            return { success: false, error: '请先选择要租赁的单板' };
        }

        const { data, error } = await supabase
            .from('orders')
            .insert([order])
            .select()
            .single();

        if (error) {
            console.error('创建订单失败:', error);
            return { success: false, error: '操作失败，请稍后重试' };
        }

        return { success: true, orderId: data.id };
    } catch (err) {
        console.error('创建订单异常:', err);
        return { success: false, error: '网络错误，请稍后重试' };
    }
}

/**
 * 获取用户订单列表
 * @returns {Promise<Array>}
 */
export async function getUserOrders() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return [];
        }

        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.warn('获取订单失败:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('获取订单异常:', err);
        return [];
    }
}

/**
 * 获取所有订单（管理后台）
 * @returns {Promise<Array>}
 */
export async function getAllOrders() {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.warn('获取订单列表失败:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('获取订单列表异常:', err);
        return [];
    }
}

/**
 * 更新订单状态
 * @param {string} orderId - 订单ID
 * @param {string} status - 新状态
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateOrderStatus(orderId, status) {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: '请先登录' };
        const { data: order } = await supabase
            .from('orders').select('user_id').eq('id', orderId).single();
        if (order?.user_id && order.user_id !== user.id) {
            return { success: false, error: '无权限操作此订单' };
        }
        const { error } = await supabase
            .from('orders')
            .update({ status: status })
            .eq('id', orderId);

        if (error) {
            return { success: false, error: '操作失败，请稍后重试' };
        }

        return { success: true };
    } catch (err) {
        return { success: false, error: '操作失败，请稍后重试' };
    }
}

/**
 * 取消订单
 * @param {string} orderId - 订单ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function cancelOrder(orderId) {
    return updateOrderStatus(orderId, 'cancelled');
}

/**
 * 获取所有用户（管理后台）
 * @returns {Promise<Array>}
 */
export async function getAllUsers() {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.warn('获取用户列表失败:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('获取用户列表异常:', err);
        return [];
    }
}

/**
 * 获取所有产品（管理后台）
 * @returns {Promise<Array>}
 */
export async function getAllProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('id');

        if (error) {
            console.warn('获取产品列表失败:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('获取产品列表异常:', err);
        return [];
    }
}

/**
 * 更新产品信息
 * @param {string} productId - 产品ID
 * @param {object} updates - 更新内容
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateProduct(productId, updates) {
    try {
        const allowed = ['name','brand','type','length','width','flex','price','deposit','stock'];
        const safeUpdates = sanitizeUpdates(updates, allowed);
        const { error } = await supabase
            .from('products')
            .update(safeUpdates)
            .eq('id', productId);

        if (error) {
            return { success: false, error: '操作失败，请稍后重试' };
        }

        return { success: true };
    } catch (err) {
        return { success: false, error: '操作失败，请稍后重试' };
    }
}

/**
 * 添加产品
 * @param {object} productData - 产品数据
 * @returns {Promise<{success: boolean, productId?: string, error?: string}>}
 */
export async function addProduct(productData) {
    try {
        const { data, error } = await supabase
            .from('products')
            .insert([productData])
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, productId: data.id };
    } catch (err) {
        return { success: false, error: '网络错误' };
    }
}

// ============================================
//  Phase 1：listings C2C/B2C 雪具发布 API
// ============================================

/**
 * 列出所有在售 listings（公开，RLS 已过滤 status=active）
 * @param {object} options - { type, brand, city, hostId, limit, offset, sortBy }
 * @returns {Promise<Array>}
 */
export async function listListings(options = {}) {
    try {
        let query = supabase
            .from('listings')
            .select(`
                *,
                host:profiles!listings_host_id_fkey (
                    id, display_name, avatar_url, verified, rating, rating_count,
                    listing_count, completed_rentals, city, skill_level
                )
            `)
            .eq('status', 'active');

        if (options.type) query = query.eq('type', options.type);
        if (options.brand) query = query.eq('brand', options.brand);
        if (options.city) query = query.eq('city', options.city);
        if (options.hostId) query = query.eq('host_id', options.hostId);
        if (options.minPrice) query = query.gte('price_per_day', options.minPrice);
        if (options.maxPrice) query = query.lte('price_per_day', options.maxPrice);

        // 数组字段包含查询（skill_level/terrain）
        if (options.skillLevel) {
            query = query.contains('skill_level', [options.skillLevel]);
        }
        if (options.terrain) {
            query = query.contains('terrain', [options.terrain]);
        }

        // 排序
        switch (options.sortBy) {
            case 'price-asc':
                query = query.order('price_per_day', { ascending: true });
                break;
            case 'price-desc':
                query = query.order('price_per_day', { ascending: false });
                break;
            case 'rating':
                query = query.order('rating', { ascending: false });
                break;
            case 'newest':
            default:
                query = query.order('created_at', { ascending: false });
        }

        if (options.limit) {
            query = query.limit(options.limit);
        }

        const { data, error } = await query;
        if (error) {
            console.warn('listListings error:', error);
            return [];
        }
        return data || [];
    } catch (err) {
        console.error('listListings 异常:', err);
        return [];
    }
}

/**
 * 获取单个 listing 详情
 * @param {string} listingId
 * @returns {Promise<object|null>}
 */
export async function getListing(listingId) {
    try {
        const { data, error } = await supabase
            .from('listings')
            .select(`
                *,
                host:profiles!listings_host_id_fkey (
                    id, display_name, avatar_url, verified, rating, rating_count,
                    listing_count, completed_rentals, city, skill_level, bio
                )
            `)
            .eq('id', listingId)
            .single();

        if (error) {
            console.warn('getListing error:', error);
            return null;
        }

        // 浏览数 +1
        try {
            await supabase.rpc('increment_listing_view', { listing_id: listingId });
        } catch (e) {
            // 忽略：可能 RPC 还没建
        }

        return data;
    } catch (err) {
        console.error('getListing 异常:', err);
        return null;
    }
}

/**
 * 创建 listing（发布雪具）
 * @param {object} listingData
 * @returns {Promise<{success: boolean, listingId?: string, error?: string}>}
 */
export async function createListing(listingData) {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: '请先登录' };

        // 字段白名单过滤
        const allowed = [
            'source', 'title', 'brand', 'model', 'year', 'type', 'length', 'width',
            'flex', 'shape', 'camber', 'skill_level', 'terrain', 'height_range',
            'weight_range', 'boot_size', 'condition', 'age_years', 'defects',
            'description', 'features', 'images', 'price_per_day', 'deposit',
            'min_days', 'max_days', 'shipping', 'self_pickup', 'city'
        ];
        const safe = sanitizeUpdates(listingData, allowed);

        // host_id 强制为当前用户（防越权）
        safe.host_id = user.id;

        const { data, error } = await supabase
            .from('listings')
            .insert([safe])
            .select()
            .single();

        if (error) {
            return { success: false, error: '发布失败，请稍后重试' };
        }

        return { success: true, listingId: data.id };
    } catch (err) {
        return { success: false, error: '网络错误，请稍后重试' };
    }
}

/**
 * 更新 listing
 * @param {string} listingId
 * @param {object} updates
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateListing(listingId, updates) {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: '请先登录' };

        const allowed = [
            'title', 'brand', 'model', 'year', 'type', 'length', 'width',
            'flex', 'shape', 'camber', 'skill_level', 'terrain', 'height_range',
            'weight_range', 'boot_size', 'condition', 'age_years', 'defects',
            'description', 'features', 'images', 'price_per_day', 'deposit',
            'min_days', 'max_days', 'shipping', 'self_pickup', 'city',
            'available', 'status'
        ];
        const safe = sanitizeUpdates(updates, allowed);
        safe.updated_at = new Date().toISOString();

        const { error } = await supabase
            .from('listings')
            .update(safe)
            .eq('id', listingId)
            .eq('host_id', user.id);  // 强制 host_id 匹配

        if (error) {
            return { success: false, error: '更新失败，请稍后重试' };
        }

        return { success: true };
    } catch (err) {
        return { success: false, error: '网络错误' };
    }
}

/**
 * 删除 listing（软删除：status='removed'）
 * @param {string} listingId
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteListing(listingId) {
    return updateListing(listingId, { status: 'removed' });
}

/**
 * 获取当前用户的 listings
 * @param {string} status - 'all' | 'active' | 'paused' | 'removed'
 * @returns {Promise<Array>}
 */
export async function getMyListings(status = 'all') {
    try {
        const user = await getCurrentUser();
        if (!user) return [];

        let query = supabase
            .from('listings')
            .select('*')
            .eq('host_id', user.id)
            .order('created_at', { ascending: false });

        if (status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) {
            console.warn('getMyListings error:', error);
            return [];
        }
        return data || [];
    } catch (err) {
        console.error('getMyListings 异常:', err);
        return [];
    }
}

/**
 * 切换用户角色（renter ↔ host）
 * @param {string} role - 'renter' | 'host' | 'both'
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function setUserRole(role) {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: '请先登录' };

        if (!['renter', 'host', 'both', 'admin'].includes(role)) {
            return { success: false, error: '角色无效' };
        }

        const updates = { role };
        if (role === 'host' || role === 'both') {
            // 首次成为 host 时记录时间
            updates.host_since = new Date().toISOString();
        }

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

        if (error) {
            return { success: false, error: '角色切换失败' };
        }

        return { success: true };
    } catch (err) {
        return { success: false, error: '网络错误' };
    }
}

/**
 * 更新个人资料
 * @param {object} profileData
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateMyProfile(profileData) {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: '请先登录' };

        const allowed = ['display_name', 'avatar_url', 'bio', 'city', 'skill_level'];
        const safe = sanitizeUpdates(profileData, allowed);

        const { error } = await supabase
            .from('profiles')
            .update(safe)
            .eq('id', user.id);

        if (error) {
            return { success: false, error: '更新失败' };
        }
        return { success: true };
    } catch (err) {
        return { success: false, error: '网络错误' };
    }
}

/**
 * 收藏/取消收藏 listing
 * @param {string} listingId
 * @returns {Promise<{success: boolean, favorited?: boolean, error?: string}>}
 */
export async function toggleFavorite(listingId) {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: '请先登录' };

        // 检查是否已收藏
        const { data: existing } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('listing_id', listingId)
            .single();

        if (existing) {
            await supabase.from('favorites').delete().eq('id', existing.id);
            return { success: true, favorited: false };
        } else {
            await supabase.from('favorites').insert([{ user_id: user.id, listing_id: listingId }]);
            return { success: true, favorited: true };
        }
    } catch (err) {
        return { success: false, error: '操作失败' };
    }
}