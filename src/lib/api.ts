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
const toDatabase = (wish: Omit<ApiWish, 'id' | 'createdAt'>) => ({
  category: wish.category,
  content: wish.content,
  author: wish.author,
  is_public: wish.isPublic,
  likes: wish.likes,
  bg_variant: wish.bgVariant,
});

// 获取所有心愿
export async function fetchWishes(): Promise<ApiWish[]> {
  const { data, error } = await supabase
    .from('wishes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching wishes:', error);
    return [];
  }

  return (data as DatabaseWish[]).map(fromDatabase);
}

// 添加心愿
export async function createWish(
  wish: Omit<ApiWish, 'id' | 'createdAt' | 'likes'>
): Promise<ApiWish | null> {
  const { data, error } = await supabase
    .from('wishes')
    .insert([toDatabase({ ...wish, likes: 0 })])
    .select()
    .single();

  if (error) {
    console.error('Error creating wish:', error);
    return null;
  }

  return fromDatabase(data as DatabaseWish);
}

// 点赞
export async function likeWish(id: string): Promise<void> {
  const { error } = await supabase.rpc('increment_like', { wish_id: id });

  if (error) {
    console.error('Error liking wish:', error);
  }
}
