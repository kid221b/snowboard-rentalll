/**
 * 冰雪之巅 - Supabase 客户端
 * 内嵌 Supabase SDK（避免 CDN 加载问题）
 */

const supabaseUrl = 'https://tcfauscqmfaimucuxrlm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjZmF1c2NxbWZhaW11Y3V4cmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1ODI0MTMsImV4cCI6MjA5NTE1ODQxM30.Fu7PUeazzb7Fr64e2q3M5qZmNvAQ40vSYvTq2eLHRmI';

export const supabase = window.supabaseClient;