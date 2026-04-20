import { supabase } from './supabase';

export interface DatabaseWish {
  id: string;
  category: 'blessing' | 'wish' | 'vent';
  content: string;
  author: string;
  is_public: boolean;
  likes: number;
  bg_variant: number;
  created_at: string;
  updated_at: string;
  owner_email?: string;
  reason?: string;
  reason_review_status?: 'pending' | 'approved' | 'rejected';
  reason_pending?: string;
  short_id?: string;
}

export interface ApiWish {
  id: string;
  category: 'blessing' | 'wish' | 'vent';
  content: string;
  author: string;
  isPublic: boolean;
  likes: number;
  bgVariant: number;
  createdAt: number;
}

// API 响应结果类型
export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 转换数据库格式到前端格式
const fromDatabase = (dbWish: DatabaseWish): ApiWish => ({
  id: dbWish.id,
  category: dbWish.category,
  content: dbWish.content,
  author: dbWish.author,
  isPublic: dbWish.is_public,
  likes: dbWish.likes,
  bgVariant: dbWish.bg_variant,
  createdAt: new Date(dbWish.created_at).getTime(),
});

// 转换前端格式到数据库格式
const toDatabase = (wish: Omit<ApiWish, 'id' | 'createdAt'>, ownerEmail?: string) => ({
  category: wish.category,
  content: wish.content,
  author: wish.author,
  is_public: wish.isPublic,
  likes: wish.likes,
  bg_variant: wish.bgVariant,
  owner_email: ownerEmail,
});

// 获取所有心愿
export async function fetchWishes(): Promise<ApiResult<ApiWish[]>> {
  try {
    const { data, error } = await supabase
      .from('wishes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching wishes:', error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: (data as DatabaseWish[]).map(fromDatabase) };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : '未知错误';
    console.error('Error fetching wishes:', errorMessage);
    return { success: false, error: errorMessage, data: [] };
  }
}

// 添加心愿
export async function createWish(
  wish: Omit<ApiWish, 'id' | 'createdAt' | 'likes'>,
  ownerEmail?: string
): Promise<ApiResult<ApiWish>> {
  try {
    const { data, error } = await supabase
      .from('wishes')
      .insert([toDatabase({ ...wish, likes: 0 }, ownerEmail)])
      .select()
      .single();

    if (error) {
      console.error('Error creating wish:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: fromDatabase(data as DatabaseWish) };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : '未知错误';
    console.error('Error creating wish:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// 点赞
export async function likeWish(id: string): Promise<ApiResult<void>> {
  try {
    const { error } = await supabase.rpc('increment_like', { wish_id: id });

    if (error) {
      console.error('Error liking wish:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : '未知错误';
    console.error('Error liking wish:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
