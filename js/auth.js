/**
 * 冰雪之巅 - 用户认证模块
 * 处理登录、注册、登出等认证功能
 */

import { supabase } from './supabase-client.js';

// 缓存当前用户
let currentUser = null;

/**
 * 用户登录
 * @param {string} email - 用户邮箱
 * @param {string} password - 用户密码
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
export async function login(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            return { success: false, error: error.message };
        }

        currentUser = data.user;
        return { success: true, user: data.user };
    } catch (err) {
        return { success: false, error: '网络错误，请稍后重试' };
    }
}

/**
 * 用户注册
 * @param {string} email - 用户邮箱
 * @param {string} password - 用户密码
 * @param {string} name - 用户姓名
 * @param {string} phone - 用户手机号
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
export async function register(email, password, name, phone) {
    try {
        // 注册用户
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: name,
                    phone: phone
                }
            }
        });

        if (error) {
            return { success: false, error: error.message };
        }

        // 创建用户资料
        if (data.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: data.user.id,
                        name: name,
                        phone: phone,
                        email: email
                    }
                ]);

            if (profileError) {
                console.warn('创建资料失败:', profileError);
            }
        }

        currentUser = data.user;
        return { success: true, user: data.user };
    } catch (err) {
        return { success: false, error: '网络错误，请稍后重试' };
    }
}

/**
 * 用户登出
 * @returns {Promise<{success: boolean}>}
 */
export async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.warn('登出警告:', error);
        }
        currentUser = null;
        return { success: true };
    } catch (err) {
        currentUser = null;
        return { success: true };
    }
}

/**
 * 获取当前登录用户
 * @returns {Promise<object|null>}
 */
export async function getCurrentUser() {
    if (currentUser) {
        return currentUser;
    }

    try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
            currentUser = data.session.user;
            return currentUser;
        }
        return null;
    } catch (err) {
        return null;
    }
}

/**
 * 监听认证状态变化
 * @param {function} callback - 状态变化回调函数
 * @returns {function} 取消监听函数
 */
export function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
        currentUser = session?.user || null;
        callback(event, session);
    });
}

/**
 * 检查是否已登录
 * @returns {boolean}
 */
export function isLoggedIn() {
    return currentUser !== null;
}

/**
 * 获取用户资料
 * @param {string} userId - 用户ID
 * @returns {Promise<object|null>}
 */
export async function getUserProfile(userId) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.warn('获取资料失败:', error);
            return null;
        }

        return data;
    } catch (err) {
        return null;
    }
}

/**
 * 更新用户资料
 * @param {string} userId - 用户ID
 * @param {object} updates - 更新内容
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateProfile(userId, updates) {
    try {
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        return { success: false, error: '网络错误' };
    }
}