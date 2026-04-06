export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  purrsCount: number;
  hissesCount?: number;
  tags: string[];
  category?: string;
  infoComment?: string;
}

export interface Purr {
  userId: string;
  articleId: string;
  createdAt: string;
}

export interface Hiss {
  userId: string;
  articleId: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  articleId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  createdAt: string;
}
