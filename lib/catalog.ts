// lib/catalog.ts

export type ProductCategory =
  | 'entertainment'
  | 'streaming'
  | 'educational'
  | 'editing'
  | 'ai';

export const PRODUCT_CATEGORIES: Record<ProductCategory, string[]> = {
  entertainment: [
    'netflix — shared profile', 'netflix — solo profile',
    'viu — shared', 'viu — solo',
    'vivamax', 'vivaone', 'vivabundle — shared', 'vivabundle — solo',
    'disney+ — shared profile', 'disney+ — solo profile', 'disney+ — solo acc',
    'bilibili — shared', 'bilibili — solo',
    'iqiyi — shared', 'iqiyi — solo',
    'weTV — shared', 'weTV — solo',
    'loklok — shared', 'loklok — solo',
    'iwantTFC — shared', 'iwantTFC — solo',
    'amazon prime — shared profile', 'amazon prime — solo profile', 'amazon prime — solo acc',
    'crunchyroll — shared profile', 'crunchyroll — solo profile', 'crunchyroll — solo acc',
    'hbo max — shared profile', 'hbo max — solo profile', 'hbo max — solo acc',
    'youku — shared', 'youku — solo',
    'nba league pass — shared', 'nba league pass — solo',
  ],
  streaming: [
    'spotify — solo',
    'youtube — invite', 'youtube — individual', 'youtube — famhead',
    'apple music — solo',
  ],
  educational: [
    'studocu — shared', 'studocu — solo',
    'scribd — shared', 'scribd — solo',
    'grammarly — shared', 'grammarly — solo',
    'quillbot — shared', 'quillbot — solo',
    'ms365 — invite', 'ms365 — shared', 'ms365 — solo',
    'quizlet+ — shared', 'quizlet+ — solo',
    'camscanner — shared', 'camscanner — solo',
    'smallpdf — shared', 'smallpdf — solo',
    'turnitin student — shared', 'turnitin student — solo',
    'turnitin instructor — shared', 'turnitin instructor — solo',
    'duolingo super — shared', 'duolingo super — solo',
  ],
  editing: [
    'canva — invite', 'canva — personal', 'canva — teamhead', 'canva — edu lifetime',
    'picsart — shared', 'picsart — solo', 'picsart — teamhead',
    'capcut — shared', 'capcut — solo (+7 days option)',
    'remini web — shared', 'remini web — solo',
    'alight motion — shared', 'alight motion — solo',
  ],
  ai: [
    'chatgpt — shared', 'chatgpt — solo',
    'gemini ai — shared', 'gemini ai — solo',
    'perplexity — solo',
  ],
};

// Flat list if you want a single dropdown
export const PRODUCT_OPTIONS: string[] = Object.values(PRODUCT_CATEGORIES).flat();