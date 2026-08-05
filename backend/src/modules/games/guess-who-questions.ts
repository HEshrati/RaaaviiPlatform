export interface GameQuestion {
  text: string;
  type: 'light' | 'personality' | 'social' | 'emotional';
}

// بانک سوالات بر اساس نوع گروه (طبق سند راوی)
export const QUESTION_BANK: Record<string, GameQuestion[]> = {
  anxiety: [
    { text: 'وقتی در جمع راحت‌تر می‌شوی که...', type: 'social' },
    { text: 'اولین چیزی که باعث می‌شود در جمع احساس امنیت کنی چیست؟', type: 'emotional' },
    { text: 'ترجیح می‌دهی اول گوش بدهی یا صحبت کنی؟', type: 'personality' },
    { text: 'چه چیزی سریع حالت را بهتر می‌کند؟', type: 'emotional' },
    { text: 'یک جمع خوب چه حسی به تو می‌دهد؟', type: 'emotional' },
    { text: 'اگر امروز یک رنگ بودی، چه رنگی بودی؟', type: 'light' },
    { text: 'بیشتر از چه نوع آدم‌هایی انرژی می‌گیری؟', type: 'personality' },
  ],
  loneliness: [
    { text: 'گفتگوی خوب برای تو چه ویژگی‌ای دارد؟', type: 'social' },
    { text: 'دوست داری بیشتر درباره چه چیزهایی حرف بزنی؟', type: 'social' },
    { text: 'یک جمع خوب چه حسی به تو می‌دهد؟', type: 'emotional' },
    { text: 'آخرین چیزی که خوشحالت کرد چه بود؟', type: 'emotional' },
    { text: 'اگر امشب یک آهنگ بودی، چه آهنگی بودی؟', type: 'light' },
    { text: 'این روزها بیشتر دنبال چه حسی هستی؟', type: 'emotional' },
    { text: 'با چه تیپ آدم‌هایی راحت‌تری؟', type: 'personality' },
  ],
  growth: [
    { text: 'در جمع بیشتر شوخی می‌کنی یا بحث جدی؟', type: 'personality' },
    { text: 'دوست داری با چه تیپ آدم‌هایی گپ بزنی؟', type: 'social' },
    { text: 'آدم برنامه‌ریزی هستی یا بداهه؟', type: 'personality' },
    { text: 'بیشتر با چه تیپ آدم‌هایی راحتی؟', type: 'personality' },
    { text: 'اگر امروز یک حیوان بودی، چه حیوانی بودی؟', type: 'light' },
    { text: 'چه موضوعی برای شروع گپ راحت‌تر است؟', type: 'social' },
    { text: 'اگر آخر هفته‌ات یک فیلم بود، ژانرش چی بود؟', type: 'light' },
  ],
  social: [
    { text: 'اگر امروز یک رنگ بودی، چه رنگی بودی؟', type: 'light' },
    { text: 'وقتی وارد جمع جدید می‌شی بیشتر شنونده‌ای یا شروع‌کننده؟', type: 'personality' },
    { text: 'بیشتر از چه نوع آدم‌هایی انرژی می‌گیری؟', type: 'personality' },
    { text: 'چه چیزی یخ یک جمع را برای تو می‌شکند؟', type: 'social' },
    { text: 'اگر امشب قرار باشد یک موضوع را باز کنیم چه باشد؟', type: 'social' },
    { text: 'اگر امروز یک آهنگ بودی، ژانرش چی بود؟', type: 'light' },
    { text: 'آخرین چیزی که خوشحالت کرد چه بود؟', type: 'emotional' },
  ],
  default: [
    { text: 'اگر امروز یک رنگ بودی، چه رنگی بودی؟', type: 'light' },
    { text: 'وقتی وارد جمع جدید می‌شی بیشتر شنونده‌ای یا شروع‌کننده؟', type: 'personality' },
    { text: 'بیشتر از چه نوع آدم‌هایی انرژی می‌گیری؟', type: 'personality' },
    { text: 'اگر آخر هفته‌ات یک فیلم بود، ژانرش چی بود؟', type: 'light' },
    { text: 'این روزها بیشتر دنبال چه حسی هستی؟', type: 'emotional' },
    { text: 'چه چیزی سریع حالت را بهتر می‌کند؟', type: 'emotional' },
    { text: 'اگر امروز یک حیوان بودی، چه حیوانی بودی؟', type: 'light' },
  ],
};

// آواتارهای فارسی
export const AVATARS = ['موج', 'ستاره', 'برگ', 'مه', 'دریا', 'کوه', 'نور', 'باد', 'آتش', 'ابر', 'ماه', 'خاک'];

export function getQuestionsForGroup(groupProfile: string, count = 5): GameQuestion[] {
  const pool = QUESTION_BANK[groupProfile] || QUESTION_BANK.default;
  // ترتیب: اول سبک، بعد شخصیتی، بعد احساسی (یخ می‌شکند)
  const sorted = [...pool].sort((a, b) => {
    const order = { light: 0, social: 1, personality: 2, emotional: 3 };
    return order[a.type] - order[b.type];
  });
  return sorted.slice(0, count);
}
