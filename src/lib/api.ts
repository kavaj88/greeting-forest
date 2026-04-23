import { supabase } from './supabase';

// --- 评论相关类型 ---

export interface DatabaseComment {
  id: string;
  wish_id: string;
  author: string;
  content: string;
  parent_id: string | null;
  created_at: string;
}

export interface ApiComment {
  id: string;
  wishId: string;
  author: string;
  content: string;
  parentId: string | null;
  createdAt: number;
}

const fromDatabaseComment = (db: DatabaseComment): ApiComment => ({
  id: db.id,
  wishId: db.wish_id,
  author: db.author,
  content: db.content,
  parentId: db.parent_id,
  createdAt: new Date(db.created_at).getTime(),
});

// 拉取某心愿的所有评论（按时间升序）
export async function fetchComments(wishId: string): Promise<ApiResult<ApiComment[]>> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('wish_id', wishId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: (data as DatabaseComment[]).map(fromDatabaseComment) };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : '未知错误';
    console.error('Error fetching comments:', errorMessage);
    return { success: false, error: errorMessage, data: [] };
  }
}

// 发布评论 / 回复
export async function createComment(params: {
  wishId: string;
  author: string;
  content: string;
  parentId?: string;
}): Promise<ApiResult<ApiComment>> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([{
        wish_id: params.wishId,
        author: params.author,
        content: params.content,
        parent_id: params.parentId ?? null,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: fromDatabaseComment(data as DatabaseComment) };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : '未知错误';
    console.error('Error creating comment:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// --- 心愿相关类型 ---

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
  reason?: string;
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
  reason: dbWish.reason,
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
