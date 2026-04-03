export type WishCategory = 'all' | 'blessing' | 'wish' | 'vent';

export interface Wish {
  id: string;
  category: Exclude<WishCategory, 'all'>;
  content: string;
  author: string;
  createdAt: number;
  likes: number;
  bgVariant: number;
}
