export type WishCategory = 'all' | 'blessing' | 'wish' | 'vent';

export interface Wish {
  id: string;
  category: Exclude<WishCategory, 'all'>;
  content: string;
  author: string;
  createdAt: number;
  likes: number;
  bgVariant: number;
  isPublic: boolean;
  reason?: string;
}

export interface Comment {
  id: string;
  wishId: string;
  author: string;
  content: string;
  parentId: string | null;
  createdAt: number;
}
