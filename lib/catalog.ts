export type TenureSpec = string; // '7d','1m','1-3m','1-12m','lifetime'
export type Variant = { name: string; tenures: TenureSpec[] };
export type Product = { key: string; label: string; variants: Variant[] };
export type Category = { key: string; label: string; products: Product[] };

export const CATALOG: Category[] = [
  {
    key: 'entertainment', label: 'Entertainment', products: [
      { key:'netflix', label:'Netflix', variants:[
        { name:'shared profile', tenures:['1-12m'] },
        { name:'solo profile',  tenures:['1-12m'] },
      ]},
      { key:'viu', label:'Viu', variants:[
        { name:'shared acc', tenures:['1-12m'] },
        { name:'solo acc',   tenures:['1-12m'] },
      ]},
      { key:'vivamax', label:'Vivamax', variants:[ { name:'default', tenures:['1-3m'] } ]},
      { key:'vivaone', label:'VivaOne', variants:[ { name:'default', tenures:['1-3m'] } ]},
      { key:'vivabundle', label:'VivaBundle', variants:[
        { name:'shared acc', tenures:['1-3m'] },
        { name:'solo acc',   tenures:['1-3m'] },
      ]},
      { key:'disney', label:'Disney+', variants:[
        { name:'shared profile', tenures:['1-3m'] },
        { name:'solo profile',   tenures:['1-3m'] },
        { name:'solo acc',       tenures:['1-3m'] },
      ]},
      { key:'bilibili', label:'Bilibili', variants:[
        { name:'shared acc', tenures:['1-3m'] },
        { name:'solo acc',   tenures:['1-3m'] },
      ]},
      { key:'iqiyi', label:'iQIYI', variants:[
        { name:'shared acc', tenures:['1-3m'] },
        { name:'solo acc',   tenures:['1-3m'] },
      ]},
      { key:'wetv', label:'WeTV', variants:[
        { name:'shared acc', tenures:['1-3m'] },
        { name:'solo acc',   tenures:['1-3m'] },
      ]},
      { key:'loklok', label:'Loklok', variants:[
        { name:'shared acc', tenures:['1-3m'] },
        { name:'solo acc',   tenures:['1-3m'] },
      ]},
      { key:'iwanttfc', label:'iWantTFC', variants:[
        { name:'shared acc', tenures:['1-3m'] },
        { name:'solo acc',   tenures:['1-3m'] },
      ]},
      { key:'prime', label:'Amazon Prime', variants:[
        { name:'shared profile', tenures:['1-6m'] },
        { name:'solo profile',   tenures:['1-6m'] },
        { name:'solo acc',       tenures:['1-6m'] },
      ]},
      { key:'crunchyroll', label:'Crunchyroll', variants:[
        { name:'shared profile', tenures:['1-12m'] },
        { name:'solo profile',   tenures:['1-12m'] },
        { name:'solo acc',       tenures:['1-12m'] },
      ]},
      { key:'hbomax', label:'HBO Max', variants:[
        { name:'shared profile', tenures:['1-3m'] },
        { name:'solo profile',   tenures:['1-3m'] },
        { name:'solo acc',       tenures:['1-3m'] },
      ]},
      { key:'youku', label:'Youku', variants:[
        { name:'shared acc', tenures:['1-3m'] },
        { name:'solo acc',   tenures:['1-3m'] },
      ]},
      { key:'nba', label:'NBA League Pass', variants:[
        { name:'shared acc', tenures:['1m'] },
        { name:'solo acc',   tenures:['1m'] },
      ]},
    ]
  },
  {
    key:'streaming', label:'Streaming', products: [
      { key:'spotify', label:'Spotify', variants:[ { name:'solo acc', tenures:['1-4m'] } ]},
      { key:'youtube', label:'YouTube', variants:[
        { name:'invite',     tenures:['1-6m'] },
        { name:'individual', tenures:['1-6m'] },
        { name:'famhead',    tenures:['1-6m'] },
      ]},
      { key:'applemusic', label:'Apple Music', variants:[ { name:'solo acc', tenures:['1-3m'] } ]},
    ]
  },
  {
    key:'educational', label:'Educational', products: [
      { key:'studocu', label:'StuDocu', variants:[
        { name:'shared acc', tenures:['1-3m'] }, { name:'solo acc', tenures:['1-3m'] }
      ]},
      { key:'scribd', label:'Scribd', variants:[
        { name:'shared acc', tenures:['1-3m'] }, { name:'solo acc', tenures:['1-3m'] }
      ]},
      { key:'grammarly', label:'Grammarly', variants:[
        { name:'shared acc', tenures:['1-3m'] }, { name:'solo acc', tenures:['1-3m'] }
      ]},
      { key:'quillbot', label:'QuillBot', variants:[
        { name:'shared acc', tenures:['1-3m'] }, { name:'solo acc', tenures:['1-3m'] }
      ]},
      { key:'ms365', label:'MS365', variants:[
        { name:'inv', tenures:['1-12m'] },
        { name:'shared acc', tenures:['1-12m'] },
        { name:'solo acc', tenures:['1-12m'] },
      ]},
      { key:'quizlet', label:'Quizlet+', variants:[
        { name:'shared acc', tenures:['1-3m'] }, { name:'solo acc', tenures:['1-3m'] }
      ]},
      { key:'camscanner', label:'CamScanner', variants:[
        { name:'shared acc', tenures:['1-3m'] }, { name:'solo acc', tenures:['1-3m'] }
      ]},
      { key:'smallpdf', label:'Smallpdf', variants:[
        { name:'shared acc', tenures:['1-3m'] }, { name:'solo acc', tenures:['1-3m'] }
      ]},
      { key:'turnitin_student', label:'Turnitin Student', variants:[
        { name:'shared acc', tenures:['1-3m'] }, { name:'solo acc', tenures:['1-3m'] }
      ]},
      { key:'turnitin_instructor', label:'Turnitin Instructor', variants:[
        { name:'shared acc', tenures:['1-3m'] }, { name:'solo acc', tenures:['1-3m'] }
      ]},
      { key:'duolingo', label:'Duolingo Super', variants:[
        { name:'shared acc', tenures:['1m'] }, { name:'solo acc', tenures:['1m'] }
      ]},
    ]
  },
  {
    key:'editing', label:'Editing', products: [
      { key:'canva', label:'Canva', variants:[
        { name:'invite',      tenures:['1-12m'] },
        { name:'personal',    tenures:['1-12m'] },
        { name:'teamhead',    tenures:['1-12m'] },
        { name:'edu lifetime',tenures:['lifetime'] },
      ]},
      { key:'picsart', label:'Picsart', variants:[
        { name:'shared acc', tenures:['1-3m'] }, { name:'solo acc', tenures:['1-3m'] }, { name:'teamhead acc', tenures:['1-3m'] }
      ]},
      { key:'capcut', label:'CapCut', variants:[
        { name:'shared acc', tenures:['1-3m'] },
        { name:'solo acc',   tenures:['7d','1-3m'] },
      ]},
      { key:'remini', label:'Remini Web', variants:[
        { name:'shared acc', tenures:['7d','1-3m'] },
        { name:'solo acc',   tenures:['7d','1-3m'] },
      ]},
      { key:'alightmotion', label:'Alight Motion', variants:[
        { name:'shared acc', tenures:['1-12m'] }, { name:'solo acc', tenures:['1-12m'] }
      ]},
    ]
  },
  {
    key:'ai', label:'AI', products: [
      { key:'chatgpt', label:'ChatGPT', variants:[
        { name:'shared acc', tenures:['1-3m'] }, { name:'solo acc', tenures:['1-3m'] }
      ]},
      { key:'gemini', label:'Gemini AI', variants:[
        { name:'shared acc', tenures:['1-12m'] }, { name:'solo acc', tenures:['1-12m'] }
      ]},
      { key:'perplexity', label:'Perplexity', variants:[
        { name:'solo acc', tenures:['1-12m'] }
      ]},
    ]
  },
];

export function expandTenureChoices(spec: TenureSpec): {label:string; days:number}[] {
  if (spec === 'lifetime') return [{ label: 'lifetime', days: 365*100 }];
  if (spec.endsWith('d')) {
    const d = parseInt(spec.replace('d',''),10);
    return [{ label: `${d} days`, days: d }];
  }
  if (spec.endsWith('m') && spec.includes('-')) {
    const [a,b] = spec.replace('m','').split('-').map(n=>parseInt(n,10));
    return Array.from({length:b-a+1}, (_,i)=>a+i).map(m => ({ label: `${m} month${m>1?'s':''}`, days: m*30 }));
  }
  if (spec.endsWith('m')) {
    const m = parseInt(spec.replace('m',''),10);
    return [{ label: `${m} month${m>1?'s':''}`, days: m*30 }];
  }
  return [];
}
