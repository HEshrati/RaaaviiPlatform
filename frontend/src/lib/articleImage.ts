/**
 * Returns a unique, deterministic image URL for each article.
 * Keys match the actual category values from the API.
 */

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "روانشناسی مثبت": [
    "positive,happiness,joy",
    "optimism,smile,bright",
    "flourish,thrive,gratitude",
    "happiness,sunshine,laugh",
  ],
  "بهداشت روان": [
    "mentalhealth,calm,peace",
    "wellness,serenity,relax",
    "therapy,healing,hope",
    "mindfulness,breathe,tranquil",
  ],
  "افسردگی": [
    "calm,nature,hope,light",
    "sunrise,comfort,warmth",
    "gentle,peace,recovery",
    "hope,rainbow,sunbeam",
  ],
  "اضطراب": [
    "meditation,peaceful,breath",
    "zen,tranquil,stillness",
    "quiet,calm,sunset",
    "relax,ocean,waves",
  ],
  "روابط سالم": [
    "relationship,couple,love",
    "together,handshake,unity",
    "friendship,bond,trust",
    "partnership,romance,dating",
  ],
  "خانواده": [
    "family,love,together",
    "home,children,parents",
    "warmth,kitchen,gather",
    "family,dinner,happy",
  ],
  "رشد فردی": [
    "growth,success,motivation",
    "climb,achieve,inspire",
    "journey,path,forward",
    "progress,goal,direction",
  ],
  "خودشناسی": [
    "reflection,mirror,journal",
    "introspection,thought,wisdom",
    "self,discovery,insight",
    "meditation,awareness,peace",
  ],
  "مدیریت استرس": [
    "relax,stress,yoga,calm",
    "breathing,exercise,nature",
    "balance,harmony,peace",
    "spa,massage,zen",
  ],
  "ذهن‌آگاهی": [
    "mindfulness,meditation,zen",
    "present,moment,awareness",
    "lotus,breath,tranquil",
    "buddha,candle,peace",
  ],
  "روانشناسی": [
    "psychology,brain,therapy",
    "couch,book,research",
    "analysis,mind,study",
    "freud,laboratory,science",
  ],
  "هوش هیجانی": [
    "emotional,intelligence,heart",
    "empathy,feeling,connect",
    "compassion,understand,sense",
    "emotion,warmth,care",
  ],
  "موفقیت": [
    "success,goal,achievement",
    "trophy,winner,champion",
    "summit,mountain,top",
    "business,career,growth",
  ],
  "عشق": [
    "love,heart,romance",
    "couple,roses,valentine",
    "passion,kiss,tenderness",
    "wedding,ring,bridal",
  ],
  "شخصیت": [
    "personality,character,identity",
    "mask,face,unique",
    "fingerprint,individual,different",
    "portrait,profile,shadow",
  ],
  "درون‌گرایی": [
    "introvert,quiet,book",
    "solitude,peace,reading",
    "alone,think,window",
    "cafe,coffee,notebook",
  ],
  "سبک دلبستگی": [
    "attachment,love,hug",
    "bonding,couple,embrace",
    "caring,affection,close",
    "parent,child,hold",
  ],
};

function getNumericId(article: { id?: any }): number {
  if (!article.id) return 1;
  if (typeof article.id === "number") return article.id;
  const str = String(article.id);
  const digits = str.replace(/\D/g, "");
  if (digits) return parseInt(digits, 10);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
}

export function getArticleImage(
  article: { image_url?: string | null; category?: string; id?: any },
  index?: number
): string {
  if (
    article.image_url &&
    !article.image_url.startsWith("emoji:") &&
    article.image_url.startsWith("http")
  ) {
    return article.image_url;
  }

  const numId = getNumericId(article);
  const cat = article.category || "";
  const sets = CATEGORY_KEYWORDS[cat] || ["psychology,wellness,mindfulness"];
  const kw = sets[numId % sets.length];
  return `https://loremflickr.com/800/400/${kw.split(",")[0]}?lock=${numId % 500}`;
}
