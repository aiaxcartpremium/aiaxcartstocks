// lib/catalog.ts

// Flat list (kept exactly as you like it)
export const PRODUCT_OPTIONS: string[] = [
  // 🎬 entertainment
  'amazon prime — shared profile', 'amazon prime — solo acc', 'amazon prime — solo profile',
  'bilibili — shared', 'bilibili — solo',
  'crunchyroll — shared profile', 'crunchyroll — solo acc', 'crunchyroll — solo profile',
  'disney+ — shared profile', 'disney+ — solo acc', 'disney+ — solo profile',
  'hbo max — shared profile', 'hbo max — solo acc', 'hbo max — solo profile',
  'iqiyi — shared', 'iqiyi — solo',
  'iwantTFC — shared', 'iwantTFC — solo',
  'loklok — shared', 'loklok — solo',
  'nba league pass — shared', 'nba league pass — solo',
  'netflix — shared profile', 'netflix — solo profile',
  'vivabundle — shared', 'vivabundle — solo',
  'vivaone', 'vivamax',
  'viu — shared', 'viu — solo',
  'weTV — shared', 'weTV — solo',
  'youku — shared', 'youku — solo',

  // 🎵 streaming
  'apple music — solo',
  'spotify — solo',
  'youtube — famhead', 'youtube — individual', 'youtube — invite',

  // 📘 educational
  'camscanner — shared', 'camscanner — solo',
  'duolingo super — shared', 'duolingo super — solo',
  'grammarly — shared', 'grammarly — solo',
  'ms365 — invite', 'ms365 — shared', 'ms365 — solo',
  'quizlet+ — shared', 'quizlet+ — solo',
  'quillbot — shared', 'quillbot — solo',
  'scribd — shared', 'scribd — solo',
  'smallpdf — shared', 'smallpdf — solo',
  'studocu — shared', 'studocu — solo',
  'turnitin instructor — shared', 'turnitin instructor — solo',
  'turnitin student — shared', 'turnitin student — solo',

  // 🎨 editing
  'alight motion — shared', 'alight motion — solo',
  'canva — edu lifetime', 'canva — invite', 'canva — personal', 'canva — teamhead',
  'capcut — shared', 'capcut — solo (+7 days option)',
  'picsart — shared', 'picsart — solo', 'picsart — teamhead',
  'remini web — shared', 'remini web — solo',

  // 🤖 ai
  'chatgpt — shared', 'chatgpt — solo',
  'gemini ai — shared', 'gemini ai — solo',
  'perplexity — solo',
];

// Grouped version for <optgroup> (kept in the same order as above)
export const PRODUCT_CATEGORIES: Record<string, string[]> = {
  '🎬 entertainment': [
    'amazon prime — shared profile', 'amazon prime — solo acc', 'amazon prime — solo profile',
    'bilibili — shared', 'bilibili — solo',
    'crunchyroll — shared profile', 'crunchyroll — solo acc', 'crunchyroll — solo profile',
    'disney+ — shared profile', 'disney+ — solo acc', 'disney+ — solo profile',
    'hbo max — shared profile', 'hbo max — solo acc', 'hbo max — solo profile',
    'iqiyi — shared', 'iqiyi — solo',
    'iwantTFC — shared', 'iwantTFC — solo',
    'loklok — shared', 'loklok — solo',
    'nba league pass — shared', 'nba league pass — solo',
    'netflix — shared profile', 'netflix — solo profile',
    'vivabundle — shared', 'vivabundle — solo',
    'vivaone', 'vivamax',
    'viu — shared', 'viu — solo',
    'weTV — shared', 'weTV — solo',
    'youku — shared', 'youku — solo',
  ],
  '🎵 streaming': [
    'apple music — solo',
    'spotify — solo',
    'youtube — famhead', 'youtube — individual', 'youtube — invite',
  ],
  '📘 educational': [
    'camscanner — shared', 'camscanner — solo',
    'duolingo super — shared', 'duolingo super — solo',
    'grammarly — shared', 'grammarly — solo',
    'ms365 — invite', 'ms365 — shared', 'ms365 — solo',
    'quizlet+ — shared', 'quizlet+ — solo',
    'quillbot — shared', 'quillbot — solo',
    'scribd — shared', 'scribd — solo',
    'smallpdf — shared', 'smallpdf — solo',
    'studocu — shared', 'studocu — solo',
    'turnitin instructor — shared', 'turnitin instructor — solo',
    'turnitin student — shared', 'turnitin student — solo',
  ],
  '🎨 editing': [
    'alight motion — shared', 'alight motion — solo',
    'canva — edu lifetime', 'canva — invite', 'canva — personal', 'canva — teamhead',
    'capcut — shared', 'capcut — solo (+7 days option)',
    'picsart — shared', 'picsart — solo', 'picsart — teamhead',
    'remini web — shared', 'remini web — solo',
  ],
  '🤖 ai': [
    'chatgpt — shared', 'chatgpt — solo',
    'gemini ai — shared', 'gemini ai — solo',
    'perplexity — solo',
  ],
};