/**
 * 冰雪之巅 - API 数据操作模块
 * 处理与 Supabase 后端的数据交互
 */

import { supabase } from './supabase-client.js';
import { getCurrentUser } from './auth.js';

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
            return { success: false, error: error.message };
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
        const { error } = await supabase
            .from('orders')
            .update({ status: status })
            .eq('id', orderId);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        return { success: false, error: '网络错误' };
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
        const { error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', productId);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        return { success: false, error: '网络错误' };
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