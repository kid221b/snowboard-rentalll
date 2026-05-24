/**
 * 冰雪之巅 - Supabase 客户端
 * 初始化 Supabase 连接
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/esm/index.js';

const supabaseUrl = 'https://tcfauscqmfaimucuxrlm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjZmF1c2NxbWZhaW11Y3V4cmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1ODI0MTMsImV4cCI6MjA5NTE1ODQxM30.Fu7PUeazzb7Fr64e2q3M5qZmNvAQ40vSYvTq2eLHRmI';

export const supabase = createClient(supabaseUrl, supabaseKey);