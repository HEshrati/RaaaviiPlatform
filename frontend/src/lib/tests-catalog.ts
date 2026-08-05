
// ═══════════════════════════════════════════════════════════════
// فایل: src/lib/tests-catalog.ts
// ۲۵ تست روان‌سنجی پلتفرم راوی — با سؤالات کامل فارسی
// ═══════════════════════════════════════════════════════════════

export type AnswerScale = "likert5" | "likert7" | "frequency4" | "yesno" | "paired";

export interface Option { value: number; label: string }
export interface Question { id: number; text: string; reverse?: boolean; subscale?: string }

export interface TestDef {
  id: string;
  name: string;
  shortName: string;
  phase: 1 | 2 | 3;
  category: string;
  description: string;
  estimatedMinutes: number;
  scale: AnswerScale;
  options: Option[];
  questions: Question[];
  scoring: {
    subscales?: { key: string; label: string; ids: number[] }[];
    ranges: { min: number; max: number; label: string; color: string; description: string }[];
  };
  matchingWeight: number; // 0-10
}

// ───────────────────────────────────────────────────────────────
// گزینه‌های استاندارد
// ───────────────────────────────────────────────────────────────
const LIKERT5: Option[] = [
  { value: 1, label: "کاملاً مخالفم" },
  { value: 2, label: "مخالفم" },
  { value: 3, label: "نه موافق نه مخالف" },
  { value: 4, label: "موافقم" },
  { value: 5, label: "کاملاً موافقم" },
];

const FREQ4: Option[] = [
  { value: 0, label: "هیچ‌وقت / اصلاً" },
  { value: 1, label: "چند روز" },
  { value: 2, label: "بیشتر روزها" },
  { value: 3, label: "تقریباً هر روز" },
];

const YESNO: Option[] = [
  { value: 1, label: "بله" },
  { value: 0, label: "خیر" },
];

const AGREE7: Option[] = [
  { value: 1, label: "کاملاً مخالفم" },
  { value: 2, label: "مخالفم" },
  { value: 3, label: "کمی مخالفم" },
  { value: 4, label: "نه موافق نه مخالف" },
  { value: 5, label: "کمی موافقم" },
  { value: 6, label: "موافقم" },
  { value: 7, label: "کاملاً موافقم" },
];

// ═══════════════════════════════════════════════════════════════
// فاز ۱ — تست‌های شخصیت و رابطه
// ═══════════════════════════════════════════════════════════════

const NEO_FFI: TestDef = {
  id: "neo_ffi",
  name: "پرسشنامه پنج عامل بزرگ شخصیت (NEO-FFI)",
  shortName: "NEO",
  phase: 1,
  category: "شخصیت",
  description: "این پرسشنامه پنج بُعد اصلی شخصیت شما را اندازه می‌گیرد که پایه‌ی الگوریتم تطبیق راوی هستند.",
  estimatedMinutes: 10,
  scale: "likert5",
  options: LIKERT5,
  questions: [
    // برون‌گرایی (E)
    { id: 1,  text: "دوست دارم در مرکز توجه باشم.",                           subscale: "E" },
    { id: 2,  text: "در جمع‌های شلوغ انرژی می‌گیرم.",                         subscale: "E" },
    { id: 3,  text: "به‌راحتی با غریبه‌ها صحبت می‌کنم.",                     subscale: "E" },
    { id: 4,  text: "ترجیح می‌دهم تنها باشم تا در جمع.",                      subscale: "E", reverse: true },
    { id: 5,  text: "پرانرژی و پرشور هستم.",                                  subscale: "E" },
    { id: 6,  text: "به‌ندرت خودم را ابراز می‌کنم.",                          subscale: "E", reverse: true },
    // توافق‌پذیری (A)
    { id: 7,  text: "نگران احساسات دیگران هستم.",                              subscale: "A" },
    { id: 8,  text: "به مردم اعتماد می‌کنم.",                                 subscale: "A" },
    { id: 9,  text: "برای کمک به دیگران وقتم را می‌گذارم.",                  subscale: "A" },
    { id: 10, text: "گاهی رفتار دیگران را تند یا تحریک‌آمیز می‌یابم.",       subscale: "A", reverse: true },
    { id: 11, text: "ترجیح می‌دهم همکاری کنم تا رقابت.",                     subscale: "A" },
    { id: 12, text: "اختلاف نظر را صادقانه بیان می‌کنم حتی اگر ناراحت کند.", subscale: "A", reverse: true },
    // وظیفه‌شناسی (C)
    { id: 13, text: "همیشه برنامه‌ریزی می‌کنم و به آن پایبند هستم.",         subscale: "C" },
    { id: 14, text: "کارها را به موقع تحویل می‌دهم.",                         subscale: "C" },
    { id: 15, text: "جزئیات برایم مهم است.",                                  subscale: "C" },
    { id: 16, text: "گاهی بی‌نظم یا آشفته هستم.",                            subscale: "C", reverse: true },
    { id: 17, text: "برای رسیدن به هدف سخت تلاش می‌کنم.",                   subscale: "C" },
    { id: 18, text: "تمایل دارم کارها را به بعد موکول کنم.",                 subscale: "C", reverse: true },
    // روان‌رنجوری (N)
    { id: 19, text: "اغلب احساس نگرانی یا تنش می‌کنم.",                      subscale: "N" },
    { id: 20, text: "خلق‌وخویم ثابت و آرام است.",                             subscale: "N", reverse: true },
    { id: 21, text: "در موقعیت‌های سخت به‌راحتی دچار استرس می‌شوم.",        subscale: "N" },
    { id: 22, text: "به ندرت احساس غم یا بی‌حوصلگی می‌کنم.",                subscale: "N", reverse: true },
    { id: 23, text: "از انتقاد یا طرد شدن خیلی ناراحت می‌شوم.",             subscale: "N" },
    { id: 24, text: "زیر فشار آرامشم را حفظ می‌کنم.",                        subscale: "N", reverse: true },
    // گشودگی (O)
    { id: 25, text: "کنجکاو هستم و دوست دارم چیزهای جدید یاد بگیرم.",      subscale: "O" },
    { id: 26, text: "از هنر، موسیقی یا ادبیات لذت می‌برم.",                 subscale: "O" },
    { id: 27, text: "دوست دارم درباره فلسفه و مفاهیم انتزاعی فکر کنم.",    subscale: "O" },
    { id: 28, text: "روال‌های ثابت و آشنا را ترجیح می‌دهم.",                subscale: "O", reverse: true },
    { id: 29, text: "تجربه‌های جدید و متفاوت را می‌پذیرم.",                 subscale: "O" },
    { id: 30, text: "ترجیح می‌دهم راه‌حل‌های آزموده‌شده را بکار ببرم.",    subscale: "O", reverse: true },
  ],
  scoring: {
    subscales: [
      { key: "E", label: "برون‌گرایی",      ids: [1,2,3,4,5,6] },
      { key: "A", label: "توافق‌پذیری",     ids: [7,8,9,10,11,12] },
      { key: "C", label: "وظیفه‌شناسی",    ids: [13,14,15,16,17,18] },
      { key: "N", label: "روان‌رنجوری",     ids: [19,20,21,22,23,24] },
      { key: "O", label: "گشودگی",          ids: [25,26,27,28,29,30] },
    ],
    ranges: [
      { min: 6,  max: 14, label: "پایین",   color: "blue",   description: "این بُعد در شما ضعیف‌تر از میانگین است." },
      { min: 15, max: 22, label: "متوسط",  color: "orange", description: "این بُعد در شما در حد میانگین قرار دارد." },
      { min: 23, max: 30, label: "بالا",   color: "green",  description: "این بُعد در شما قوی‌تر از میانگین است." },
    ],
  },
  matchingWeight: 10,
};

// ──────────────────────────────────────────────────────────────
const ECR_R: TestDef = {
  id: "ecr_r",
  name: "مقیاس تجربه روابط نزدیک (ECR-R)",
  shortName: "دلبستگی",
  phase: 1,
  category: "رابطه",
  description: "سبک دلبستگی شما در روابط عاطفی را می‌سنجد — که پیش‌بینی‌کننده‌ی قوی کیفیت رابطه است.",
  estimatedMinutes: 7,
  scale: "likert7",
  options: AGREE7,
  questions: [
    // اضطراب دلبستگی (ANX)
    { id: 1,  text: "نگران این هستم که شریکم واقعاً مرا دوست ندارد.",         subscale: "ANX" },
    { id: 2,  text: "وقتی شریکم با من نیست، نگرانم که به دیگری علاقه‌مند شود.", subscale: "ANX" },
    { id: 3,  text: "اگر نتوانم توجه شریکم را جلب کنم، ناراحت می‌شوم.",       subscale: "ANX" },
    { id: 4,  text: "می‌ترسم شریکم مرا ترک کند.",                              subscale: "ANX" },
    { id: 5,  text: "نیاز زیادی به اطمینان‌خاطر از عشق شریکم دارم.",           subscale: "ANX" },
    { id: 6,  text: "وقتی شریکم دور است، احساس تنهایی می‌کنم.",               subscale: "ANX" },
    { id: 7,  text: "به‌راحتی احساس می‌کنم طرد شده‌ام.",                       subscale: "ANX" },
    { id: 8,  text: "در روابط احساسی بیش‌ازحد وابسته می‌شوم.",                subscale: "ANX" },
    { id: 9,  text: "نگران این هستم که به‌اندازه‌ی کافی خوب نباشم.",           subscale: "ANX" },
    // اجتناب دلبستگی (AVO)
    { id: 10, text: "ترجیح می‌دهم احساساتم را با شریکم در میان نگذارم.",      subscale: "AVO" },
    { id: 11, text: "از صمیمیت عاطفی عمیق ناراحت می‌شوم.",                    subscale: "AVO" },
    { id: 12, text: "راحت‌تر است به‌جای دیگران به خودم تکیه کنم.",            subscale: "AVO" },
    { id: 13, text: "از بیان احساساتم خودداری می‌کنم.",                        subscale: "AVO" },
    { id: 14, text: "وقتی شریکم می‌خواهد خیلی نزدیک باشد، احساس ناراحتی می‌کنم.", subscale: "AVO" },
    { id: 15, text: "سعی می‌کنم به دیگری متکی نباشم.",                         subscale: "AVO" },
    { id: 16, text: "نشان دادن نیازهایم برایم سخت است.",                       subscale: "AVO" },
    { id: 17, text: "ترجیح می‌دهم بدون کمک دیگران مشکلاتم را حل کنم.",        subscale: "AVO" },
    { id: 18, text: "با نزدیک شدن بیش از حد به دیگران ناراحت می‌شوم.",         subscale: "AVO" },
  ],
  scoring: {
    subscales: [
      { key: "ANX", label: "اضطراب دلبستگی", ids: [1,2,3,4,5,6,7,8,9] },
      { key: "AVO", label: "اجتناب دلبستگی", ids: [10,11,12,13,14,15,16,17,18] },
    ],
    ranges: [
      { min: 9,  max: 27, label: "ایمن",     color: "green",  description: "احساس امنیت در روابط عاطفی" },
      { min: 28, max: 45, label: "متوسط",   color: "orange", description: "برخی چالش‌های دلبستگی وجود دارد" },
      { min: 46, max: 63, label: "ناایمن",  color: "red",    description: "نیاز به کار روی سبک دلبستگی" },
    ],
  },
  matchingWeight: 10,
};

// ──────────────────────────────────────────────────────────────
const GOTTMAN: TestDef = {
  id: "gottman",
  name: "مقیاس الگوهای ارتباطی گاتمن",
  shortName: "الگوی رابطه",
  phase: 1,
  category: "رابطه",
  description: "الگوهای ارتباطی شما در روابط نزدیک را ارزیابی می‌کند.",
  estimatedMinutes: 6,
  scale: "likert5",
  options: LIKERT5,
  questions: [
    { id: 1,  text: "وقتی کسی مرا ناراحت می‌کند، رفتارهای کلی او را هم زیر سؤال می‌برم.",   subscale: "criticism" },
    { id: 2,  text: "در دعوا احساس می‌کنم شریکم شخصیتم را هدف می‌گیرد نه رفتارم.",         subscale: "criticism" },
    { id: 3,  text: "در بحث تمایل دارم از خودم دفاع کنم قبل از اینکه حرف طرف مقابل تمام شود.", subscale: "defensive" },
    { id: 4,  text: "وقتی مخالفم، به‌سرعت دلایل خودم را مطرح می‌کنم.",                     subscale: "defensive" },
    { id: 5,  text: "گاهی در بحث‌ها احساس می‌کنم کاملاً قفل می‌کنم و چیزی نمی‌گویم.",      subscale: "stonewalling" },
    { id: 6,  text: "وقتی مکالمه تنش‌زا می‌شود ترجیح می‌دهم سکوت کنم.",                   subscale: "stonewalling" },
    { id: 7,  text: "گاهی با نگاه یا لحن نشان می‌دهم که حرف طرف مقابل را جدی نمی‌گیرم.", subscale: "contempt" },
    { id: 8,  text: "وقتی از کسی ناراحتم، احساس می‌کنم از او برتر هستم.",                  subscale: "contempt" },
    // الگوهای مثبت
    { id: 9,  text: "سعی می‌کنم احساسات طرف مقابل را بفهمم قبل از واکنش.",               subscale: "empathy" },
    { id: 10, text: "در تعارض به دنبال راه‌حل مشترک هستم نه پیروزی.",                    subscale: "empathy" },
    { id: 11, text: "می‌توانم بعد از دعوا آشتی کنم و ادامه بدهم.",                        subscale: "repair" },
    { id: 12, text: "در روابطم احساس اعتماد و امنیت می‌کنم.",                              subscale: "repair" },
  ],
  scoring: {
    subscales: [
      { key: "criticism",    label: "انتقاد",   ids: [1,2] },
      { key: "defensive",    label: "دفاعی بودن", ids: [3,4] },
      { key: "stonewalling", label: "سکوت/اجتناب", ids: [5,6] },
      { key: "contempt",     label: "تحقیر",     ids: [7,8] },
      { key: "empathy",      label: "همدلی",     ids: [9,10] },
      { key: "repair",       label: "ترمیم رابطه", ids: [11,12] },
    ],
    ranges: [
      { min: 0,  max: 20, label: "الگوهای سالم",     color: "green",  description: "سبک ارتباطی سالم و سازنده" },
      { min: 21, max: 35, label: "نیاز به توجه",     color: "orange", description: "برخی الگوهای مخرب وجود دارد" },
      { min: 36, max: 60, label: "الگوهای نگران‌کننده", color: "red",    description: "الگوهای ارتباطی نیاز به کار دارند" },
    ],
  },
  matchingWeight: 9,
};

// ──────────────────────────────────────────────────────────────
const MBTI_INSPIRED: TestDef = {
  id: "mbti",
  name: "تیپ‌شناسی شخصیت (MBTI)",
  shortName: "تیپ شخصیتی",
  phase: 1,
  category: "شخصیت",
  description: "تیپ شخصیتی ۱۶‌گانه‌ی شما را مشخص می‌کند — محبوب‌ترین ابزار خودشناسی در جهان.",
  estimatedMinutes: 8,
  scale: "likert5",
  options: LIKERT5,
  questions: [
    // I/E
    { id: 1,  text: "بعد از یک جمع شلوغ معمولاً انرژی دارم و سرحال هستم.",            subscale: "E" },
    { id: 2,  text: "ترجیح می‌دهم یک‌به‌یک صحبت کنم تا در گروه بزرگ.",               subscale: "I" },
    { id: 3,  text: "افکارم را بلندبلند و با دیگران پردازش می‌کنم.",                   subscale: "E" },
    { id: 4,  text: "برای تصمیم‌گیری نیاز دارم اول تنها فکر کنم.",                   subscale: "I" },
    // S/N
    { id: 5,  text: "به جزئیات عملی و واقعیت‌های ملموس بیشتر توجه می‌کنم.",         subscale: "S" },
    { id: 6,  text: "به الگوها، احتمالات و آینده بیشتر فکر می‌کنم.",                 subscale: "N" },
    { id: 7,  text: "تجربه‌های عملی را به نظریه ترجیح می‌دهم.",                      subscale: "S" },
    { id: 8,  text: "به دنبال معنا و ارتباطات پنهان در اطلاعات هستم.",               subscale: "N" },
    // T/F
    { id: 9,  text: "در تصمیم‌گیری منطق را مقدم بر احساسات می‌دانم.",               subscale: "T" },
    { id: 10, text: "تأثیر تصمیم‌هایم بر احساسات دیگران برایم خیلی مهم است.",       subscale: "F" },
    { id: 11, text: "در اختلاف‌نظر، بیشتر دنبال حقیقت هستم تا هماهنگی.",           subscale: "T" },
    { id: 12, text: "معمولاً ارزش‌های شخصی را مبنای تصمیم‌هایم قرار می‌دهم.",       subscale: "F" },
    // J/P
    { id: 13, text: "ترجیح می‌دهم برنامه‌ها از قبل مشخص و ثابت باشند.",            subscale: "J" },
    { id: 14, text: "از انعطاف و تغییر برنامه در لحظه لذت می‌برم.",                 subscale: "P" },
    { id: 15, text: "دوست دارم قبل از موعد مقرر کارها را تمام کنم.",               subscale: "J" },
    { id: 16, text: "ترجیح می‌دهم گزینه‌هایم باز بمانند تا تصمیم نهایی بگیرم.",   subscale: "P" },
  ],
  scoring: {
    subscales: [
      { key: "E", label: "برون‌گرا",  ids: [1,3] },
      { key: "I", label: "درون‌گرا",  ids: [2,4] },
      { key: "S", label: "حسی",       ids: [5,7] },
      { key: "N", label: "شهودی",     ids: [6,8] },
      { key: "T", label: "منطقی",     ids: [9,11] },
      { key: "F", label: "احساسی",    ids: [10,12] },
      { key: "J", label: "قضاوتی",    ids: [13,15] },
      { key: "P", label: "ادراکی",    ids: [14,16] },
    ],
    ranges: [
      { min: 0, max: 100, label: "تیپ شخصیتی", color: "orange", description: "تیپ شخصیتی شما مشخص شد" },
    ],
  },
  matchingWeight: 7,
};

// ──────────────────────────────────────────────────────────────
const HEXACO: TestDef = {
  id: "hexaco",
  name: "پروفایل شخصیت کوتاه (الهام‌گرفته از HEXACO)",
  shortName: "شخصیت کوتاه",
  phase: 1,
  category: "شخصیت",
  description: "پنج بُعد صداقت-فروتنی، هیجان، برون‌گرایی، وظیفه‌شناسی و گشودگی را به‌صورت کوتاه بررسی می‌کند؛ این فرم جایگزین آزمون کامل HEXACO نیست.",
  estimatedMinutes: 6,
  scale: "likert5",
  options: LIKERT5,
  questions: [
    { id: 1,  text: "در کسب‌وکار یا موقعیت‌های اجتماعی، از فریب دادن دیگران امتناع می‌کنم.", subscale: "H" },
    { id: 2,  text: "اگر به چیز گران‌قیمتی دسترسی داشتم و کسی نمی‌فهمید، آن را نمی‌دزدیدم.", subscale: "H" },
    { id: 3,  text: "دوست ندارم از طریق دستکاری دیگران به هدفم برسم.",                       subscale: "H" },
    { id: 4,  text: "ثروت و اقتدار بر پایه‌ی زد‌وبند برایم جذاب نیست.",                    subscale: "H" },
    { id: 5,  text: "حتی در شرایط سخت احساس آرامش می‌کنم.",                                subscale: "E2" },
    { id: 6,  text: "وقتی احساس می‌کنم کار سختی پیش رو دارم ناامید نمی‌شوم.",              subscale: "E2" },
    { id: 7,  text: "با اکثر مردم کنار می‌آیم.",                                              subscale: "X" },
    { id: 8,  text: "در موقعیت‌های اجتماعی ابتکار عمل دارم.",                               subscale: "X" },
    { id: 9,  text: "دقیق و منظم هستم.",                                                      subscale: "C2" },
    { id: 10, text: "همیشه قبل از تصمیم‌گیری اطلاعات کافی جمع‌آوری می‌کنم.",              subscale: "C2" },
    { id: 11, text: "تجربیات هنری و زیبایی‌شناختی برایم ارزشمند هستند.",                  subscale: "O2" },
    { id: 12, text: "به ایده‌های غیرمعمول علاقه‌مندم.",                                     subscale: "O2" },
  ],
  scoring: {
    subscales: [
      { key: "H",  label: "صداقت-فروتنی",  ids: [1,2,3,4] },
      { key: "E2", label: "ثبات هیجانی",   ids: [5,6] },
      { key: "X",  label: "برون‌گرایی",    ids: [7,8] },
      { key: "C2", label: "وظیفه‌شناسی",  ids: [9,10] },
      { key: "O2", label: "گشودگی",        ids: [11,12] },
    ],
    ranges: [
      { min: 4,  max: 10, label: "پایین", color: "red",    description: "نیاز به توجه در این بُعد" },
      { min: 11, max: 16, label: "متوسط", color: "orange", description: "در حد میانگین" },
      { min: 17, max: 20, label: "بالا",  color: "green",  description: "قوی در این بُعد" },
    ],
  },
  matchingWeight: 8,
};

// ──────────────────────────────────────────────────────────────
const IRI: TestDef = {
  id: "iri",
  name: "پروفایل همدلی کوتاه (الهام‌گرفته از IRI)",
  shortName: "همدلی کوتاه",
  phase: 1,
  category: "مهارت اجتماعی",
  description: "همدلی شناختی، همدلی هیجانی و ناراحتی شخصی را در یک فرم کوتاه بررسی می‌کند؛ این فرم جایگزین IRI کامل نیست.",
  estimatedMinutes: 5,
  scale: "likert5",
  options: LIKERT5,
  questions: [
    { id: 1,  text: "قبل از قضاوت درباره‌ی کسی، سعی می‌کنم جای او بایستم.",             subscale: "PT" },
    { id: 2,  text: "وقتی درباره‌ی موقعیت‌های پیچیده فکر می‌کنم، همه جوانب را بررسی می‌کنم.", subscale: "PT" },
    { id: 3,  text: "اگر با دیگری مخالفم، سعی می‌کنم دیدگاه او را هم بفهمم.",             subscale: "PT" },
    { id: 4,  text: "وقتی کسی غمگین است، احساسش را حس می‌کنم.",                         subscale: "EC" },
    { id: 5,  text: "وقتی می‌بینم کسی ناعادلانه رفتار شده، ناراحت می‌شوم.",             subscale: "EC" },
    { id: 6,  text: "درد و رنج دیگران مرا تحت تأثیر قرار می‌دهد.",                       subscale: "EC" },
    { id: 7,  text: "در موقعیت‌های اجتماعی جدید احساس ناآرامی می‌کنم.",                subscale: "PD" },
    { id: 8,  text: "وقتی ناراحتی کسی را می‌بینم بلافاصله می‌خواهم کمک کنم.",           subscale: "EC" },
    { id: 9,  text: "می‌توانم با دیدگاه‌های متفاوت ارتباط برقرار کنم.",                subscale: "PT" },
    { id: 10, text: "احساسات شدید دیگران را از نزدیک حس می‌کنم.",                       subscale: "EC" },
  ],
  scoring: {
    subscales: [
      { key: "PT", label: "همدلی شناختی",  ids: [1,2,3,9] },
      { key: "EC", label: "همدلی هیجانی", ids: [4,5,6,8,10] },
      { key: "PD", label: "ناراحتی شخصی",  ids: [7] },
    ],
    ranges: [
      { min: 0,  max: 20, label: "پایین", color: "red",    description: "همدلی کمتر از میانگین" },
      { min: 21, max: 30, label: "متوسط", color: "orange", description: "همدلی در حد میانگین" },
      { min: 31, max: 40, label: "بالا",  color: "green",  description: "همدلی بالا" },
    ],
  },
  matchingWeight: 8,
};

// ──────────────────────────────────────────────────────────────
const ERQ: TestDef = {
  id: "erq",
  name: "پرسشنامه تنظیم هیجان (ERQ)",
  shortName: "تنظیم هیجان",
  phase: 1,
  category: "هیجانی",
  description: "روش تنظیم هیجانی شما را می‌سنجد — مستقیماً بر کیفیت رابطه تأثیر دارد.",
  estimatedMinutes: 4,
  scale: "likert7",
  options: AGREE7,
  questions: [
    { id: 1,  text: "وقتی می‌خواهم احساس مثبت‌تری داشته باشم، طرز فکرم درباره موقعیت را تغییر می‌دهم.", subscale: "CR" },
    { id: 2,  text: "هیجان‌هایم را با تغییر دیدگاهم کنترل می‌کنم.",                   subscale: "CR" },
    { id: 3,  text: "وقتی با موقعیت استرس‌زا روبرو می‌شوم، طوری به آن فکر می‌کنم که آرامش پیدا کنم.", subscale: "CR" },
    { id: 4,  text: "هیجان‌های منفی را با تفسیر موقعیت به شکل متفاوت تغییر می‌دهم.",  subscale: "CR" },
    { id: 5,  text: "می‌توانم با تمرکز بر نکات مثبت هیجان منفی را کاهش دهم.",         subscale: "CR" },
    { id: 6,  text: "مراقبم که احساساتم را بیرون ندهم.",                               subscale: "ES" },
    { id: 7,  text: "وقتی هیجان مثبت دارم مراقبم که آن را نشان ندهم.",                subscale: "ES" },
    { id: 8,  text: "احساساتم را پیش خودم نگه می‌دارم.",                              subscale: "ES" },
    { id: 9,  text: "وقتی احساس منفی دارم تلاش می‌کنم آن را پنهان کنم.",             subscale: "ES" },
    { id: 10, text: "سعی می‌کنم احساساتم را زیاد ابراز نکنم.",                        subscale: "ES" },
  ],
  scoring: {
    subscales: [
      { key: "CR", label: "بازارزیابی شناختی", ids: [1,2,3,4,5] },
      { key: "ES", label: "سرکوب هیجان",       ids: [6,7,8,9,10] },
    ],
    ranges: [
      { min: 5,  max: 20, label: "پایین", color: "blue",   description: "کمتر از این استراتژی استفاده می‌کنید" },
      { min: 21, max: 28, label: "متوسط", color: "orange", description: "در حد میانگین" },
      { min: 29, max: 35, label: "بالا",  color: "green",  description: "بیشتر از این استراتژی استفاده می‌کنید" },
    ],
  },
  matchingWeight: 8,
};

// ──────────────────────────────────────────────────────────────
const CONFLICT_STYLE: TestDef = {
  id: "conflict_style",
  name: "سبک حل تعارض",
  shortName: "تعارض",
  phase: 1,
  category: "رابطه",
  description: "نشان می‌دهد در اختلاف‌نظر چگونه رفتار می‌کنید — مهم برای سازگاری زوج.",
  estimatedMinutes: 5,
  scale: "likert5",
  options: LIKERT5,
  questions: [
    { id: 1,  text: "در دعوا معمولاً سعی می‌کنم راه‌حل مشترکی پیدا کنیم.",         subscale: "collab" },
    { id: 2,  text: "حاضرم از بخشی از خواسته‌هایم کوتاه بیایم تا توافق برسیم.",   subscale: "compro" },
    { id: 3,  text: "ترجیح می‌دهم در بحث‌های تنش‌زا سکوت کنم.",                  subscale: "avoid" },
    { id: 4,  text: "در تعارض، برنده شدن برایم مهم است.",                           subscale: "compete" },
    { id: 5,  text: "گاهی کوتاه می‌آیم تا صلح حفظ شود.",                           subscale: "accom" },
    { id: 6,  text: "وقتی بحث داغ می‌شود، آرام می‌مانم و گوش می‌دهم.",            subscale: "collab" },
    { id: 7,  text: "برای من منطق حرف اول را می‌زند نه احساس.",                     subscale: "compete" },
    { id: 8,  text: "از مواجهه مستقیم اجتناب می‌کنم.",                             subscale: "avoid" },
    { id: 9,  text: "ترجیح می‌دهم هر دو طرف کمی بدهیم و کمی بگیریم.",            subscale: "compro" },
    { id: 10, text: "خواسته‌های طرف مقابل را به اندازه‌ی خودم مهم می‌دانم.",      subscale: "collab" },
  ],
  scoring: {
    subscales: [
      { key: "collab",  label: "همکاری",      ids: [1,6,10] },
      { key: "compro",  label: "مصالحه",      ids: [2,9] },
      { key: "avoid",   label: "اجتناب",      ids: [3,8] },
      { key: "compete", label: "رقابت",        ids: [4,7] },
      { key: "accom",   label: "سازگاری",     ids: [5] },
    ],
    ranges: [
      { min: 0, max: 100, label: "سبک تعارض", color: "orange", description: "سبک غالب شما مشخص شد" },
    ],
  },
  matchingWeight: 7,
};

// ──────────────────────────────────────────────────────────────
const LOVE_LANGUAGES: TestDef = {
  id: "love_languages",
  name: "زبان‌های محبت (Chapman)",
  shortName: "زبان محبت",
  phase: 1,
  category: "رابطه",
  description: "نشان می‌دهد چطور محبت می‌دهید و دریافت می‌کنید — کلید درک متقابل در رابطه.",
  estimatedMinutes: 6,
  scale: "likert5",
  options: LIKERT5,
  questions: [
    { id: 1,  text: "شنیدن کلمات تأیید و تعریف از شریکم برایم خیلی مهم است.",    subscale: "words" },
    { id: 2,  text: "وقتی کسی مرا تحسین می‌کند، احساس خوبی دارم.",               subscale: "words" },
    { id: 3,  text: "بودن با شریکم بدون حواس‌پرتی برایم ارزشمند است.",           subscale: "time" },
    { id: 4,  text: "توجه کامل یک نفر بیشتر از هر چیزی ارزش دارد.",              subscale: "time" },
    { id: 5,  text: "دریافت هدیه از کسی که دوستش دارم خیلی برایم معنادار است.", subscale: "gifts" },
    { id: 6,  text: "وقتی کسی به خاطر من چیز خاصی می‌خرد، خوشحال می‌شوم.",     subscale: "gifts" },
    { id: 7,  text: "وقتی کسی بدون که بگویم کاری را برایم انجام می‌دهد، احساس محبت می‌کنم.", subscale: "service" },
    { id: 8,  text: "کمک عملی و انجام کارها برایم نشانه محبت است.",               subscale: "service" },
    { id: 9,  text: "لمس و بغل کردن احساس صمیمیتم را تقویت می‌کند.",             subscale: "touch" },
    { id: 10, text: "تماس فیزیکی مثل دست دادن یا بغل کردن برایم مهم است.",      subscale: "touch" },
  ],
  scoring: {
    subscales: [
      { key: "words",   label: "کلام تأییدی",     ids: [1,2] },
      { key: "time",    label: "زمان باکیفیت",    ids: [3,4] },
      { key: "gifts",   label: "هدیه",             ids: [5,6] },
      { key: "service", label: "خدمت",             ids: [7,8] },
      { key: "touch",   label: "تماس فیزیکی",     ids: [9,10] },
    ],
    ranges: [
      { min: 0, max: 100, label: "زبان محبت اصلی شما", color: "orange", description: "زبان محبت شما مشخص شد" },
    ],
  },
  matchingWeight: 7,
};

// ──────────────────────────────────────────────────────────────
const SEXUAL_COMPAT: TestDef = {
  id: "sexual_compat",
  name: "سازگاری و مرزهای رابطه",
  shortName: "انتظارات رابطه",
  phase: 1,
  category: "رابطه",
  description: "انتظارات و مرزهای شما در روابط نزدیک را می‌سنجد.",
  estimatedMinutes: 4,
  scale: "likert5",
  options: LIKERT5,
  questions: [
    { id: 1,  text: "صمیمیت جسمانی برای احساس نزدیکی در رابطه برایم ضروری است." },
    { id: 2,  text: "قبل از رابطه جسمانی، پیوند عاطفی عمیق برایم مهم است." },
    { id: 3,  text: "بیان آزادانه خواسته‌هایم در رابطه برایم راحت است." },
    { id: 4,  text: "مرزهای مشخص در رابطه برایم اهمیت زیادی دارد." },
    { id: 5,  text: "بحث درباره‌ی انتظارات جسمانی در رابطه برایم آسان است." },
    { id: 6,  text: "سازگاری در این حوزه برای یک رابطه بلندمدت ضروری است." },
    { id: 7,  text: "احترام به مرزهای طرف مقابل برایم اولویت دارد." },
    { id: 8,  text: "اگر در این زمینه با شریکم تفاوت داشته باشیم، می‌توانیم مذاکره کنیم." },
  ],
  scoring: {
    ranges: [
      { min: 0,  max: 20, label: "محافظه‌کار",  color: "blue",   description: "رویکرد محتاطانه‌تر" },
      { min: 21, max: 28, label: "متوازن",      color: "orange", description: "رویکرد متعادل" },
      { min: 29, max: 40, label: "باز و صادق",  color: "green",  description: "رویکرد باز و صادقانه" },
    ],
  },
  matchingWeight: 6,
};

// ═══════════════════════════════════════════════════════════════
// فاز ۲ — غربالگری سلامت روان
// ═══════════════════════════════════════════════════════════════

const PHQ9: TestDef = {
  id: "phq9",
  name: "پرسشنامه سلامت بیمار — افسردگی (PHQ-9)",
  shortName: "PHQ-9",
  phase: 2,
  category: "سلامت روان",
  description: "در طول ۲ هفته گذشته تا چه حد این مشکلات آزارتان داده است؟",
  estimatedMinutes: 3,
  scale: "frequency4",
  options: FREQ4,
  questions: [
    { id: 1, text: "کم‌علاقگی یا بی‌لذتی در انجام کارها" },
    { id: 2, text: "احساس غمگینی، افسردگی یا ناامیدی" },
    { id: 3, text: "مشکل در به خواب رفتن، بیدار شدن یا خواب بیش از حد" },
    { id: 4, text: "احساس خستگی یا کمبود انرژی" },
    { id: 5, text: "بی‌اشتهایی یا پرخوری" },
    { id: 6, text: "احساس بدی درباره خودتان — که شکست خورده‌اید یا خود یا خانواده‌تان را ناامید کرده‌اید" },
    { id: 7, text: "مشکل در تمرکز بر کارهایی مثل خواندن روزنامه یا تماشای تلویزیون" },
    { id: 8, text: "کند حرکت کردن یا صحبت کردن آنقدر که دیگران هم متوجه شده باشند؛ یا برعکس، بیقراری و بی‌آرامشی" },
    { id: 9, text: "افکاری درباره مرگ یا آسیب رساندن به خود" },
  ],
  scoring: {
    ranges: [
      { min: 0,  max: 4,  label: "حداقل",          color: "green",  description: "علائم افسردگی قابل توجهی مشاهده نمی‌شود." },
      { min: 5,  max: 9,  label: "خفیف",            color: "yellow", description: "علائم خفیف افسردگی. توجه و مراقبت توصیه می‌شود." },
      { min: 10, max: 14, label: "متوسط",           color: "orange", description: "علائم متوسط. صحبت با یک متخصص مفید خواهد بود." },
      { min: 15, max: 19, label: "نسبتاً شدید",    color: "red",    description: "علائم قابل توجه. مشاوره حرفه‌ای توصیه می‌شود." },
      { min: 20, max: 27, label: "شدید",            color: "red",    description: "علائم شدید. لطفاً با یک متخصص مشورت کنید." },
    ],
  },
  matchingWeight: 5,
};

// ──────────────────────────────────────────────────────────────
const GAD7: TestDef = {
  id: "gad7",
  name: "اختلال اضطراب فراگیر (GAD-7)",
  shortName: "GAD-7",
  phase: 2,
  category: "سلامت روان",
  description: "در طول ۲ هفته گذشته تا چه حد این مشکلات آزارتان داده است؟",
  estimatedMinutes: 3,
  scale: "frequency4",
  options: FREQ4,
  questions: [
    { id: 1, text: "احساس عصبی بودن، اضطراب یا لبه بودن" },
    { id: 2, text: "ناتوانی در متوقف کردن یا کنترل نگرانی" },
    { id: 3, text: "نگران بیش از حد بودن درباره‌ی چیزهای مختلف" },
    { id: 4, text: "مشکل در آرام گرفتن" },
    { id: 5, text: "بی‌قراری تا حدی که نشستن آرام سخت باشد" },
    { id: 6, text: "زود عصبانی یا تحریک‌پذیر شدن" },
    { id: 7, text: "ترس از اینکه اتفاق بدی بیفتد" },
  ],
  scoring: {
    ranges: [
      { min: 0,  max: 4,  label: "حداقل", color: "green",  description: "اضطراب در محدوده طبیعی است." },
      { min: 5,  max: 9,  label: "خفیف",  color: "yellow", description: "اضطراب خفیف. نکات مدیریت اضطراب مفید خواهد بود." },
      { min: 10, max: 14, label: "متوسط", color: "orange", description: "اضطراب متوسط. مشاوره توصیه می‌شود." },
      { min: 15, max: 21, label: "شدید",  color: "red",    description: "اضطراب شدید. لطفاً با متخصص مشورت کنید." },
    ],
  },
  matchingWeight: 5,
};

// ──────────────────────────────────────────────────────────────
const DASS21: TestDef = {
  id: "dass21",
  name: "مقیاس افسردگی، اضطراب و استرس (DASS-21)",
  shortName: "DASS-21",
  phase: 2,
  category: "سلامت روان",
  description: "در هفته گذشته تا چه حد هر عبارت درباره شما صادق بوده است؟",
  estimatedMinutes: 6,
  scale: "frequency4",
  options: [
    { value: 0, label: "اصلاً — هرگز" },
    { value: 1, label: "گاهی" },
    { value: 2, label: "اغلب" },
    { value: 3, label: "بیشتر اوقات" },
  ],
  questions: [
    { id: 1,  text: "برایم دشوار بود که تنش را کم کنم و آرام بگیرم.",           subscale: "S" },
    { id: 2,  text: "دهانم خشک شد.",                                            subscale: "A" },
    { id: 3,  text: "نتوانستم هیچ احساس مثبتی داشته باشم.",                    subscale: "D" },
    { id: 4,  text: "مشکل تنفسی داشتم (مثل نفس‌نفس زدن بدون فعالیت فیزیکی).",subscale: "A" },
    { id: 5,  text: "شروع کردن به کارها برایم سخت بود.",                       subscale: "D" },
    { id: 6,  text: "برای موقعیت‌های بدون اهمیت بیش از حد واکنش نشان دادم.", subscale: "S" },
    { id: 7,  text: "دستم می‌لرزید.",                                           subscale: "A" },
    { id: 8,  text: "احساس کردم خیلی انرژی خرج می‌کنم.",                      subscale: "S" },
    { id: 9,  text: "نگران موقعیت‌هایی بودم که ممکن بود وحشت‌زا باشند.",     subscale: "A" },
    { id: 10, text: "احساس کردم آینده‌ای برای انتظار ندارم.",                  subscale: "D" },
    { id: 11, text: "متوجه شدم بیقرار شده‌ام.",                               subscale: "S" },
    { id: 12, text: "آرام شدن برایم سخت بود.",                                subscale: "S" },
    { id: 13, text: "احساس غم کردم.",                                          subscale: "D" },
    { id: 14, text: "وقتی کاری مرا بازداشت می‌کرد تحمل نمی‌کردم.",           subscale: "S" },
    { id: 15, text: "احساس کردم نزدیک است وحشت‌زده شوم.",                    subscale: "A" },
    { id: 16, text: "نمی‌توانستم برای چیزی هیجان‌زده شوم.",                  subscale: "D" },
    { id: 17, text: "احساس کردم ارزش زیادی به عنوان یک انسان ندارم.",         subscale: "D" },
    { id: 18, text: "احساس کردم نسبتاً حساس شده‌ام.",                         subscale: "S" },
    { id: 19, text: "بدون دلیل قلبم تند می‌زد (مثلاً از ترس).",              subscale: "A" },
    { id: 20, text: "بدون دلیل خاصی احساس ترس کردم.",                         subscale: "A" },
    { id: 21, text: "احساس کردم زندگی بی‌معناست.",                            subscale: "D" },
  ],
  scoring: {
    subscales: [
      { key: "D", label: "افسردگی",  ids: [3,5,10,13,16,17,21] },
      { key: "A", label: "اضطراب",   ids: [2,4,7,9,15,19,20] },
      { key: "S", label: "استرس",    ids: [1,6,8,11,12,14,18] },
    ],
    ranges: [
      { min: 0, max: 9,   label: "طبیعی",      color: "green",  description: "در محدوده طبیعی" },
      { min: 10, max: 13, label: "خفیف",        color: "yellow", description: "علائم خفیف" },
      { min: 14, max: 20, label: "متوسط",       color: "orange", description: "علائم متوسط" },
      { min: 21, max: 27, label: "شدید",        color: "red",    description: "علائم شدید" },
      { min: 28, max: 63, label: "بسیار شدید",  color: "red",    description: "لطفاً با متخصص مشورت کنید" },
    ],
  },
  matchingWeight: 4,
};

// ──────────────────────────────────────────────────────────────
const BAI: TestDef = {
  id: "bai",
  name: "سیاهه اضطراب بک (BAI)",
  shortName: "BAI",
  phase: 2,
  category: "سلامت روان",
  description: "در هفته گذشته تا چه اندازه از هر علامت زیر ناراحت شدید؟",
  estimatedMinutes: 5,
  scale: "frequency4",
  options: [
    { value: 0, label: "اصلاً" },
    { value: 1, label: "کمی — زیاد آزارم نداد" },
    { value: 2, label: "متوسط — ناراحتم کرد ولی تحمل کردم" },
    { value: 3, label: "زیاد — به‌سختی تحملش را داشتم" },
  ],
  questions: [
    { id: 1,  text: "بی‌حسی یا سوزن‌سوزن شدن" },
    { id: 2,  text: "گرگرفتگی" },
    { id: 3,  text: "لرزش پاها" },
    { id: 4,  text: "ناتوانی از آرام گرفتن" },
    { id: 5,  text: "ترس از بدترین اتفاق" },
    { id: 6,  text: "گیجی یا سرگیجه" },
    { id: 7,  text: "ضربان قلب یا تند زدن قلب" },
    { id: 8,  text: "ناپایداری یا بی‌تعادلی" },
    { id: 9,  text: "ترس از دست دادن کنترل" },
    { id: 10, text: "احساس خفگی" },
    { id: 11, text: "لرزش دست‌ها" },
    { id: 12, text: "لرزش بدن" },
    { id: 13, text: "ترس از مردن" },
    { id: 14, text: "احساس ترس" },
    { id: 15, text: "حالت تهوع یا ناراحتی معده" },
    { id: 16, text: "احساس بی‌حسی در ذهن" },
    { id: 17, text: "عرق کردن (نه از گرما)" },
    { id: 18, text: "نگرانی شدید" },
    { id: 19, text: "مشکل تنفسی" },
    { id: 20, text: "ترس از دست دادن هوشیاری" },
    { id: 21, text: "قرمزی صورت" },
  ],
  scoring: {
    ranges: [
      { min: 0,  max: 7,  label: "حداقل", color: "green",  description: "اضطراب در سطح پایین یا طبیعی" },
      { min: 8,  max: 15, label: "خفیف",  color: "yellow", description: "اضطراب خفیف" },
      { min: 16, max: 25, label: "متوسط", color: "orange", description: "اضطراب متوسط — توجه لازم است" },
      { min: 26, max: 63, label: "شدید",  color: "red",    description: "اضطراب شدید — مشاوره توصیه می‌شود" },
    ],
  },
  matchingWeight: 4,
};

// ──────────────────────────────────────────────────────────────
const ISI: TestDef = {
  id: "isi",
  name: "شاخص شدت بی‌خوابی (ISI)",
  shortName: "ISI",
  phase: 2,
  category: "سلامت روان",
  description: "مشکلات خواب در ماه گذشته را ارزیابی می‌کند.",
  estimatedMinutes: 3,
  scale: "likert5",
  options: [
    { value: 0, label: "اصلاً نه" },
    { value: 1, label: "کمی" },
    { value: 2, label: "تا حدودی" },
    { value: 3, label: "زیاد" },
    { value: 4, label: "خیلی زیاد" },
  ],
  questions: [
    { id: 1, text: "مشکل در به خواب رفتن" },
    { id: 2, text: "مشکل در خواب ماندن" },
    { id: 3, text: "بیدار شدن خیلی زود" },
    { id: 4, text: "چقدر از الگوی فعلی خوابتان ناراضی هستید؟" },
    { id: 5, text: "تا چه حد مشکل خوابتان بر کیفیت زندگی‌تان تأثیر دارد؟" },
    { id: 6, text: "تا چه حد نگران یا ناراحت مشکل خوابتان هستید؟" },
    { id: 7, text: "تا چه حد فکر می‌کنید مشکل خواب‌تان عملکرد روزانه‌تان را مختل می‌کند؟" },
  ],
  scoring: {
    ranges: [
      { min: 0,  max: 7,  label: "بدون بی‌خوابی",  color: "green",  description: "خواب در محدوده طبیعی" },
      { min: 8,  max: 14, label: "خفیف",            color: "yellow", description: "بی‌خوابی خفیف" },
      { min: 15, max: 21, label: "متوسط",           color: "orange", description: "بی‌خوابی متوسط — توجه لازم است" },
      { min: 22, max: 28, label: "شدید",            color: "red",    description: "بی‌خوابی شدید — مشاوره توصیه می‌شود" },
    ],
  },
  matchingWeight: 3,
};
const ISI2: TestDef = {
  id: "isi",
  name: "شاخص شدت بی‌خوابی (ISI)",
  shortName: "ISI",
  phase: 2,
  category: "سلامت روان",
  description: "مشکلات خواب در ماه گذشته را ارزیابی می‌کند.",
  estimatedMinutes: 3,
  scale: "likert5",
  options: [
    { value: 0, label: "اصلاً نه" },
    { value: 1, label: "کمی" },
    { value: 2, label: "تا حدودی" },
    { value: 3, label: "زیاد" },
    { value: 4, label: "خیلی زیاد" },
  ],
  questions: [
    { id: 1, text: "مشکل در به خواب رفتن" },
    { id: 2, text: "مشکل در خواب ماندن" },
    { id: 3, text: "بیدار شدن خیلی زود" },
    { id: 4, text: "چقدر از الگوی فعلی خوابتان ناراضی هستید؟" },
    { id: 5, text: "تا چه حد مشکل خوابتان بر کیفیت زندگی‌تان تأثیر دارد؟" },
    { id: 6, text: "تا چه حد نگران یا ناراحت مشکل خوابتان هستید؟" },
    { id: 7, text: "تا چه حد فکر می‌کنید مشکل خواب‌تان عملکرد روزانه‌تان را مختل می‌کند؟" },
  ],
  scoring: {
    ranges: [
      { min: 0,  max: 7,  label: "بدون بی‌خوابی",  color: "green",  description: "خواب در محدوده طبیعی" },
      { min: 8,  max: 14, label: "خفیف",            color: "yellow", description: "بی‌خوابی خفیف" },
      { min: 15, max: 21, label: "متوسط",           color: "orange", description: "بی‌خوابی متوسط — توجه لازم است" },
      { min: 22, max: 28, label: "شدید",            color: "red",    description: "بی‌خوابی شدید — مشاوره توصیه می‌شود" },
    ],
  },
  matchingWeight: 3,
};

// ──────────────────────────────────────────────────────────────
const ASRS: TestDef = {
  id: "asrs",
  name: "مقیاس خودگزارشی ADHD بزرگسال (ASRS)",
  shortName: "ASRS",
  phase: 2,
  category: "سلامت روان",
  description: "نشانه‌های احتمالی نقص توجه/بیش‌فعالی در بزرگسالان را غربالگری می‌کند.",
  estimatedMinutes: 4,
  scale: "frequency4",
  options: [
    { value: 0, label: "هیچ‌وقت" },
    { value: 1, label: "به‌ندرت" },
    { value: 2, label: "گاهی" },
    { value: 3, label: "اغلب" },
    { value: 4, label: "خیلی اوقات" },
  ],
  questions: [
    { id: 1,  text: "چقدر برایتان سخت است که آخرین مرحله یک پروژه را تمام کنید؟",                    subscale: "inattention" },
    { id: 2,  text: "چقدر برایتان سخت است که در کارهایی که نیاز به سازماندهی دارند منظم باشید؟",     subscale: "inattention" },
    { id: 3,  text: "چقدر در به یاد آوردن قرارها یا تعهداتتان مشکل دارید؟",                         subscale: "inattention" },
    { id: 4,  text: "وقتی باید یک کار خسته‌کننده یا سخت انجام دهید، چقدر به تعویق می‌اندازید؟",    subscale: "inattention" },
    { id: 5,  text: "چقدر برایتان سخت است که وقتی باید بنشینید و کار کنید ساکت بنشینید؟",          subscale: "hyperactivity" },
    { id: 6,  text: "چقدر احساس می‌کنید بیش از حد فعال هستید و مجبورید کارهایی انجام دهید؟",       subscale: "hyperactivity" },
  ],
  scoring: {
    subscales: [
      { key: "inattention",   label: "نقص توجه",  ids: [1,2,3,4] },
      { key: "hyperactivity", label: "بیش‌فعالی", ids: [5,6] },
    ],
    ranges: [
      { min: 0,  max: 13, label: "طبیعی",          color: "green",  description: "نشانه‌های قابل توجهی مشاهده نمی‌شود." },
      { min: 14, max: 18, label: "احتمال متوسط",   color: "orange", description: "برخی نشانه‌ها وجود دارد — ارزیابی بیشتر مفید است." },
      { min: 19, max: 24, label: "احتمال بالا",    color: "red",    description: "نشانه‌های قابل توجه — مشاوره با متخصص توصیه می‌شود." },
    ],
  },
  matchingWeight: 3,
};

// ──────────────────────────────────────────────────────────────
const MDQ: TestDef = {
  id: "mdq",
  name: "پرسشنامه اختلال خلقی (MDQ)",
  shortName: "MDQ",
  phase: 2,
  category: "سلامت روان",
  description: "غربالگری احتمال اختلال دوقطبی — فقط جنبه اطلاعاتی دارد.",
  estimatedMinutes: 4,
  scale: "yesno",
  options: YESNO,
  questions: [
    { id: 1,  text: "آیا دوره‌هایی داشتید که احساس می‌کردید خیلی خوشحال یا پرانرژی‌تر از معمول هستید؟" },
    { id: 2,  text: "آیا دوره‌هایی داشتید که به‌طور غیرعادی تحریک‌پذیر بودید و با دیگران بحث یا دعوا می‌کردید؟" },
    { id: 3,  text: "آیا اعتمادبه‌نفستان به شکل غیرعادی بالا بود؟" },
    { id: 4,  text: "آیا نیاز به خواب کمتری داشتید و با وجود آن احساس انرژی کافی می‌کردید؟" },
    { id: 5,  text: "آیا سریع‌تر از معمول حرف می‌زدید یا احساس می‌کردید نمی‌توانید متوقف شوید؟" },
    { id: 6,  text: "آیا افکارتان خیلی سریع می‌گذشتند یا نمی‌توانستید ذهنتان را آرام کنید؟" },
    { id: 7,  text: "آیا خیلی آسان‌تر از معمول حواستان پرت می‌شد؟" },
    { id: 8,  text: "آیا انرژی بیشتری از معمول داشتید؟" },
    { id: 9,  text: "آیا فعال‌تر از معمول بودید یا کارهای بیشتری انجام می‌دادید؟" },
    { id: 10, text: "آیا از نظر اجتماعی خیلی فعال‌تر بودید؟" },
    { id: 11, text: "آیا بیشتر از معمول جنسی‌تر بودید؟" },
    { id: 12, text: "آیا کارهای غیرمعمول یا پرخطری انجام می‌دادید که ممکن بود برای شما یا دیگران مشکل‌ساز شود؟" },
    { id: 13, text: "آیا بیشتر از معمول پول خرج می‌کردید یا خریدهای غیرعادی داشتید؟" },
    { id: 14, text: "آیا چند مورد از پاسخ‌های «بله» بالا در یک دورهٔ زمانی واحد رخ دادند؟" },
    { id: 15, text: "آیا این رفتارها برای شما، کارتان، روابطتان یا امور مالی‌تان مشکل ایجاد کردند؟" },
  ],
  scoring: {
    ranges: [
      { min: 0,  max: 6,  label: "زیر آستانه",   color: "green",  description: "نشانه‌های گزارش‌شده زیر آستانهٔ غربالگری است." },
      { min: 7,  max: 13, label: "نیازمند بررسی", color: "orange", description: "تفسیر فقط با رخ‌داد هم‌زمان و میزان اختلال معتبر است." },
    ],
  },
  matchingWeight: 2,
};

// ──────────────────────────────────────────────────────────────
const YBOCS: TestDef = {
  id: "ybocs",
  name: "مقیاس وسواس یل-براون (Y-BOCS)",
  shortName: "Y-BOCS",
  phase: 2,
  category: "سلامت روان",
  description: "شدت نشانه‌های وسواس فکری-عملی را می‌سنجد.",
  estimatedMinutes: 5,
  scale: "likert5",
  options: [
    { value: 0, label: "هیچ" },
    { value: 1, label: "خفیف" },
    { value: 2, label: "متوسط" },
    { value: 3, label: "شدید" },
    { value: 4, label: "خیلی شدید" },
  ],
  questions: [
    { id: 1,  text: "چقدر از وقت روزانه‌تان صرف افکار وسواسی می‌شود؟",                          subscale: "obsession" },
    { id: 2,  text: "افکار وسواسی تا چه حد در زندگی روزمره‌تان اختلال ایجاد می‌کنند؟",          subscale: "obsession" },
    { id: 3,  text: "افکار وسواسی تا چه حد ناراحتی ایجاد می‌کنند؟",                             subscale: "obsession" },
    { id: 4,  text: "افکار وسواسی تا چه حد از کنترل شما خارج هستند؟",                          subscale: "obsession" },
    { id: 5,  text: "تا چه حد نمی‌توانید از درگیری با افکار وسواسی جلوگیری کنید؟",             subscale: "obsession" },
    { id: 6,  text: "چقدر از وقت روزانه‌تان صرف رفتارهای وسواسی (اجباری) می‌شود؟",             subscale: "compulsion" },
    { id: 7,  text: "رفتارهای اجباری تا چه حد در زندگی روزمره‌تان اختلال ایجاد می‌کنند؟",      subscale: "compulsion" },
    { id: 8,  text: "رفتارهای اجباری تا چه حد ناراحتی ایجاد می‌کنند؟",                          subscale: "compulsion" },
    { id: 9,  text: "رفتارهای اجباری تا چه حد از کنترل شما خارج هستند؟",                       subscale: "compulsion" },
    { id: 10, text: "تا چه حد نمی‌توانید از انجام رفتارهای اجباری جلوگیری کنید؟",              subscale: "compulsion" },
  ],
  scoring: {
    subscales: [
      { key: "obsession",  label: "افکار وسواسی",     ids: [1,2,3,4,5] },
      { key: "compulsion", label: "رفتارهای اجباری",  ids: [6,7,8,9,10] },
    ],
    ranges: [
      { min: 0,  max: 7,  label: "زیر آستانه",  color: "green",  description: "نشانه‌های قابل توجهی مشاهده نمی‌شود." },
      { min: 8,  max: 15, label: "خفیف",         color: "yellow", description: "OCD خفیف" },
      { min: 16, max: 23, label: "متوسط",        color: "orange", description: "OCD متوسط — مشاوره مفید خواهد بود." },
      { min: 24, max: 31, label: "شدید",         color: "red",    description: "OCD شدید — درمان توصیه می‌شود." },
      { min: 32, max: 40, label: "خیلی شدید",   color: "red",    description: "OCD خیلی شدید — لطفاً با متخصص مشورت کنید." },
    ],
  },
  matchingWeight: 2,
};

// ──────────────────────────────────────────────────────────────
const PCL5: TestDef = {
  id: "pcl5",
  name: "چک‌لیست PTSD (PCL-5)",
  shortName: "PCL-5",
  phase: 2,
  category: "سلامت روان",
  description: "در ماه گذشته تا چه حد از این مشکلات آزرده شدید؟",
  estimatedMinutes: 5,
  scale: "frequency4",
  options: [
    { value: 0, label: "اصلاً" },
    { value: 1, label: "کمی" },
    { value: 2, label: "تا حدودی" },
    { value: 3, label: "زیاد" },
    { value: 4, label: "خیلی زیاد" },
  ],
  questions: [
    { id: 1,  text: "خاطرات ناراحت‌کننده تکرارشونده از یک رویداد استرس‌زا" },
    { id: 2,  text: "کابوس‌های مکرر درباره آن رویداد" },
    { id: 3,  text: "احساس ناگهانی که رویداد دوباره در حال رخ دادن است" },
    { id: 4,  text: "احساس ناراحتی وقتی چیزی آن رویداد را یادآوری می‌کند" },
    { id: 5,  text: "واکنش جسمانی قوی وقتی چیزی آن رویداد را یادآوری می‌کند" },
    { id: 6,  text: "اجتناب از افکار یا احساسات مرتبط با آن رویداد" },
    { id: 7,  text: "اجتناب از یادآورهای خارجی آن رویداد" },
    { id: 8,  text: "مشکل در به یاد آوردن بخش‌های مهم آن رویداد" },
    { id: 9,  text: "باورهای منفی قوی درباره خود، دیگران یا جهان" },
    { id: 10, text: "سرزنش خود یا دیگران برای آن رویداد" },
    { id: 11, text: "احساس قوی منفی مثل ترس، وحشت، خشم یا گناه" },
    { id: 12, text: "کاهش علاقه به فعالیت‌هایی که قبلاً دوست داشتید" },
    { id: 13, text: "احساس دوری یا جدایی از دیگران" },
    { id: 14, text: "ناتوانی در تجربه احساسات مثبت" },
    { id: 15, text: "رفتار تحریک‌پذیر یا پرخاشگرانه" },
    { id: 16, text: "رفتارهای مخاطره‌آمیز یا خودآزارانه" },
    { id: 17, text: "حالت آماده‌باش یا هوشیاری افراطی" },
    { id: 18, text: "واکنش ترس شدید به صداها یا محرک‌های غیرمنتظره" },
    { id: 19, text: "مشکل در تمرکز" },
    { id: 20, text: "مشکل در خواب" },
  ],
  scoring: {
    ranges: [
      { min: 0,  max: 31, label: "زیر آستانه",  color: "green",  description: "نشانه‌های PTSD قابل توجهی مشاهده نمی‌شود." },
      { min: 32, max: 49, label: "احتمال متوسط", color: "orange", description: "برخی نشانه‌ها وجود دارد — ارزیابی بیشتر مفید است." },
      { min: 50, max: 80, label: "احتمال بالا",  color: "red",    description: "نشانه‌های قابل توجه — مشاوره با متخصص توصیه می‌شود." },
    ],
  },
  matchingWeight: 2,
};

// ═══════════════════════════════════════════════════════════════
// فاز ۳ — تست‌های تخصصی بالینی (فقط زیر نظر روانشناس)
// ═══════════════════════════════════════════════════════════════

const BDI2: TestDef = {
  id: "bdi2",
  name: "سیاهه افسردگی بک-II (BDI-II)",
  shortName: "BDI-II",
  phase: 3,
  category: "بالینی",
  description: "سنجش دقیق‌تر شدت افسردگی — این تست زیر نظر روانشناس تفسیر می‌شود.",
  estimatedMinutes: 8,
  scale: "likert5",
  options: [
    { value: 0, label: "اصلاً" },
    { value: 1, label: "کمی" },
    { value: 2, label: "متوسط" },
    { value: 3, label: "زیاد" },
  ],
  questions: [
    { id: 1,  text: "غمگینی — چقدر احساس غم می‌کنید؟" },
    { id: 2,  text: "بدبینی — نسبت به آینده چه احساسی دارید؟" },
    { id: 3,  text: "شکست — چقدر احساس شکست‌خوردگی می‌کنید؟" },
    { id: 4,  text: "از دست دادن لذت — آیا از چیزهایی که قبلاً دوست داشتید لذت می‌برید؟" },
    { id: 5,  text: "احساس گناه — چقدر احساس گناه می‌کنید؟" },
    { id: 6,  text: "احساس تنبیه — آیا احساس می‌کنید باید تنبیه شوید؟" },
    { id: 7,  text: "ناخوشنودی از خود — چقدر از خودتان راضی هستید؟" },
    { id: 8,  text: "انتقاد از خود — آیا خودتان را سرزنش می‌کنید؟" },
    { id: 9,  text: "افکار خودکشی — آیا افکاری درباره آسیب به خود دارید؟" },
    { id: 10, text: "گریه — چقدر گریه می‌کنید؟" },
    { id: 11, text: "بی‌قراری — آیا بی‌قرار هستید؟" },
    { id: 12, text: "از دست دادن علاقه — آیا به دیگران یا فعالیت‌ها علاقه دارید؟" },
    { id: 13, text: "بلاتکلیفی — آیا تصمیم‌گیری برایتان سخت است؟" },
    { id: 14, text: "بی‌ارزشی — آیا احساس می‌کنید بی‌ارزش هستید؟" },
    { id: 15, text: "از دست دادن انرژی — آیا انرژی کافی دارید؟" },
    { id: 16, text: "تغییر در خواب — آیا خوابتان تغییر کرده؟" },
    { id: 17, text: "تحریک‌پذیری — آیا تحریک‌پذیر هستید؟" },
    { id: 18, text: "تغییر در اشتها — آیا اشتهایتان تغییر کرده؟" },
    { id: 19, text: "مشکل تمرکز — آیا تمرکز کردن برایتان سخت است؟" },
    { id: 20, text: "خستگی — آیا احساس خستگی می‌کنید؟" },
    { id: 21, text: "از دست دادن علاقه جنسی — آیا تغییری در میل جنسی داشتید؟" },
  ],
  scoring: {
    ranges: [
      { min: 0,  max: 13, label: "حداقل",       color: "green",  description: "افسردگی حداقل" },
      { min: 14, max: 19, label: "خفیف",         color: "yellow", description: "افسردگی خفیف" },
      { min: 20, max: 28, label: "متوسط",        color: "orange", description: "افسردگی متوسط" },
      { min: 29, max: 63, label: "شدید",         color: "red",    description: "افسردگی شدید" },
    ],
  },
  matchingWeight: 3,
};

// ──────────────────────────────────────────────────────────────
const PID5: TestDef = {
  id: "pid5",
  name: "موجودی ویژگی‌های شخصیت DSM-5 (PID-5)",
  shortName: "PID-5",
  phase: 3,
  category: "بالینی",
  description: "ویژگی‌های شخصیت مرتبط با اختلالات شخصیت را ارزیابی می‌کند — فقط زیر نظر روانشناس.",
  estimatedMinutes: 10,
  scale: "likert5",
  options: [
    { value: 0, label: "کاملاً نادرست یا اغلب نادرست" },
    { value: 1, label: "گاهی درست، گاهی نادرست" },
    { value: 2, label: "اغلب درست" },
    { value: 3, label: "کاملاً درست یا تقریباً همیشه درست" },
  ],
  questions: [
    { id: 1,  text: "مردم معمولاً قصد بدی دارند.",                                    subscale: "suspiciousness" },
    { id: 2,  text: "فکر می‌کنم دیگران سعی می‌کنند مرا گول بزنند.",                  subscale: "suspiciousness" },
    { id: 3,  text: "احساسات شدیدی دارم که خیلی سریع تغییر می‌کنند.",               subscale: "emotional_lability" },
    { id: 4,  text: "احساساتم خیلی قوی‌تر از آن چیزی است که بقیه تجربه می‌کنند.",  subscale: "emotional_lability" },
    { id: 5,  text: "کارهایی انجام می‌دهم که بعداً پشیمان می‌شوم.",                 subscale: "impulsivity" },
    { id: 6,  text: "برای من خیلی سخت است که وقتی هیجان‌زده‌ام، جلوی خودم را بگیرم.", subscale: "impulsivity" },
    { id: 7,  text: "دوست ندارم با مردم نزدیک شوم.",                                 subscale: "withdrawal" },
    { id: 8,  text: "خوشحال‌ترین وقتم وقتی تنها هستم.",                              subscale: "withdrawal" },
    { id: 9,  text: "به‌ندرت چیزی را جالب می‌یابم.",                                 subscale: "anhedonia" },
    { id: 10, text: "بندرت هیجان‌زده یا پرانرژی می‌شوم.",                            subscale: "anhedonia" },
    { id: 11, text: "کارهای غیرمعمول انجام می‌دهم.",                                 subscale: "eccentricity" },
    { id: 12, text: "مردم فکر می‌کنند رفتارهای من عجیب است.",                        subscale: "eccentricity" },
    { id: 13, text: "از آسیب رسیدن به خودم لذت می‌برم.",                             subscale: "self_harm" },
    { id: 14, text: "گاهی فکر می‌کنم آسیب رساندن به خودم تنها راه‌حل است.",        subscale: "self_harm" },
    { id: 15, text: "مشکل اصلی من این است که نمی‌توانم احساساتم را کنترل کنم.",    subscale: "emotional_lability" },
  ],
  scoring: {
    subscales: [
      { key: "suspiciousness",    label: "بدگمانی",           ids: [1,2] },
      { key: "emotional_lability", label: "بی‌ثباتی هیجانی",  ids: [3,4,15] },
      { key: "impulsivity",       label: "تکانشگری",          ids: [5,6] },
      { key: "withdrawal",        label: "انزوا",              ids: [7,8] },
      { key: "anhedonia",         label: "بی‌لذتی",           ids: [9,10] },
      { key: "eccentricity",      label: "رفتار غیرمعمول",    ids: [11,12] },
      { key: "self_harm",         label: "آسیب به خود",       ids: [13,14] },
    ],
    ranges: [
      { min: 0,  max: 15, label: "طبیعی",          color: "green",  description: "ویژگی‌های قابل توجهی مشاهده نمی‌شود." },
      { min: 16, max: 30, label: "نیاز به توجه",   color: "orange", description: "برخی ویژگی‌ها نیاز به بررسی دارند." },
      { min: 31, max: 45, label: "ارزیابی لازم",   color: "red",    description: "لطفاً با روانشناس مشورت کنید." },
    ],
  },
  matchingWeight: 1,
};

// ──────────────────────────────────────────────────────────────
const YSQ: TestDef = {
  id: "ysq",
  name: "پرسشنامه طرحواره یانگ (YSQ-SF)",
  shortName: "YSQ",
  phase: 3,
  category: "بالینی",
  description: "طرحواره‌های ناسازگار اولیه را می‌سنجد — پایه‌ی رفتارهای تکرارشونده در روابط.",
  estimatedMinutes: 10,
  scale: "likert5",
  options: [
    { value: 1, label: "کاملاً نادرست" },
    { value: 2, label: "تقریباً نادرست" },
    { value: 3, label: "درست‌تر از نادرست" },
    { value: 4, label: "تقریباً درست" },
    { value: 5, label: "کاملاً درست" },
    { value: 6, label: "کاملاً درست و احساس می‌کنم یکی از مهم‌ترین مشکلاتم است" },
  ],
  questions: [
    { id: 1,  text: "اکثر وقت‌ها احساس می‌کنم نیاز دارم کسی مراقبم باشد.",              subscale: "abandonment" },
    { id: 2,  text: "نگران این هستم که افراد نزدیکم مرا ترک کنند.",                      subscale: "abandonment" },
    { id: 3,  text: "احساس می‌کنم هیچ‌کس مرا درک نمی‌کند.",                             subscale: "mistrust" },
    { id: 4,  text: "معمولاً فکر می‌کنم مردم قصد دارند به من آسیب بزنند.",               subscale: "mistrust" },
    { id: 5,  text: "احساس می‌کنم به دیگران وابسته‌ام و نمی‌توانم مستقل عمل کنم.",      subscale: "dependence" },
    { id: 6,  text: "بدون کمک دیگران نمی‌توانم از عهده مشکلات روزمره برآیم.",           subscale: "dependence" },
    { id: 7,  text: "در انجام کارها هرگز به اندازه کافی خوب نیستم.",                    subscale: "defectiveness" },
    { id: 8,  text: "معمولاً احساس می‌کنم فرد نامناسبی هستم.",                           subscale: "defectiveness" },
    { id: 9,  text: "نمی‌توانم با بقیه مثل یک آدم عادی ارتباط برقرار کنم.",             subscale: "isolation" },
    { id: 10, text: "احساس می‌کنم با همه دنیا فرق دارم.",                                subscale: "isolation" },
    { id: 11, text: "باید انتظارات بالایی داشته باشم وگرنه شکست می‌خورم.",              subscale: "unrelenting_standards" },
    { id: 12, text: "باید در هر کاری که انجام می‌دهم بهترین باشم.",                     subscale: "unrelenting_standards" },
    { id: 13, text: "احساس می‌کنم مستحق توجه و محبت بیشتری هستم.",                      subscale: "entitlement" },
    { id: 14, text: "نباید مجبور باشم قوانین دیگران را رعایت کنم.",                      subscale: "entitlement" },
    { id: 15, text: "در برابر ناراحتی‌های کوچک هم تحمل ندارم.",                         subscale: "self_sacrifice" },
    { id: 16, text: "نیازهای دیگران را مقدم بر نیازهای خودم می‌گذارم.",                 subscale: "self_sacrifice" },
    { id: 17, text: "برای جلب تأیید دیگران خیلی تلاش می‌کنم.",                          subscale: "approval_seeking" },
    { id: 18, text: "برایم خیلی مهم است که دیگران از من تعریف کنند.",                    subscale: "approval_seeking" },
  ],
  scoring: {
    subscales: [
      { key: "abandonment",          label: "رهاشدگی",            ids: [1,2] },
      { key: "mistrust",             label: "بی‌اعتمادی",         ids: [3,4] },
      { key: "dependence",           label: "وابستگی",             ids: [5,6] },
      { key: "defectiveness",        label: "نقص/شرم",             ids: [7,8] },
      { key: "isolation",            label: "انزوای اجتماعی",     ids: [9,10] },
      { key: "unrelenting_standards", label: "معیارهای سرسختانه", ids: [11,12] },
      { key: "entitlement",          label: "استحقاق",             ids: [13,14] },
      { key: "self_sacrifice",       label: "ایثار",               ids: [15,16] },
      { key: "approval_seeking",     label: "تأییدجویی",          ids: [17,18] },
    ],
    ranges: [
      { min: 18, max: 50, label: "طبیعی",          color: "green",  description: "طرحواره‌های قابل توجهی مشاهده نمی‌شود." },
      { min: 51, max: 72, label: "متوسط",          color: "orange", description: "برخی طرحواره‌ها وجود دارد." },
      { min: 73, max: 108, label: "قابل توجه",     color: "red",    description: "طرحواره‌های قابل توجه — مشاوره مفید خواهد بود." },
    ],
  },
  matchingWeight: 2,
};

// ──────────────────────────────────────────────────────────────
const MMPI_SCREEN: TestDef = {
  id: "mmpi_screen",
  name: "غربالگری شخصیت بالینی (MMPI-Inspired)",
  shortName: "MMPI-Screen",
  phase: 3,
  category: "بالینی",
  description: "این پرسشنامه صرفاً برای ارزیابی اولیه است و جایگزین MMPI کامل نمی‌شود — فقط زیر نظر روانشناس.",
  estimatedMinutes: 8,
  scale: "yesno",
  options: YESNO,
  questions: [
    { id: 1,  text: "اغلب احساس می‌کنم بدون دلیل خاصی غمگین یا افسرده هستم." },
    { id: 2,  text: "گاهی صداهایی می‌شنوم که دیگران نمی‌شنوند." },
    { id: 3,  text: "فکر می‌کنم برخی مردم می‌خواهند به من آسیب بزنند." },
    { id: 4,  text: "گاهی کارهایی انجام می‌دهم که بعداً اصلاً یادم نیست." },
    { id: 5,  text: "اغلب احساس می‌کنم کسی مرا دنبال می‌کند یا مراقبم است." },
    { id: 6,  text: "خیلی سریع از چیزی یا کسی خسته می‌شوم." },
    { id: 7,  text: "گاهی احساس می‌کنم من یک نفر خاص یا مهم هستم که مأموریت ویژه‌ای دارم." },
    { id: 8,  text: "اغلب احساس می‌کنم دیگران درباره‌ام صحبت می‌کنند." },
    { id: 9,  text: "گاهی بدون هیچ دلیلی احساس ترس شدید می‌کنم." },
    { id: 10, text: "مشکلات جسمانی بدون علت پزشکی مشخص دارم." },
    { id: 11, text: "خواب‌های خیلی عجیب و مزاحم می‌بینم." },
    { id: 12, text: "گاهی احساس می‌کنم که دستیابی به مرگ بهتر از زندگی است." },
  ],
  scoring: {
    ranges: [
      { min: 0, max: 2,  label: "کم‌ریسک",     color: "green",  description: "نشانه‌های قابل توجهی مشاهده نمی‌شود." },
      { min: 3, max: 5,  label: "متوسط",        color: "orange", description: "برخی نشانه‌ها نیاز به بررسی دارند." },
      { min: 6, max: 12, label: "ارزیابی لازم", color: "red",    description: "لطفاً با یک روانشناس مشورت کنید." },
    ],
  },
  matchingWeight: 1,
};

// ──────────────────────────────────────────────────────────────
const MCMI_SCREEN: TestDef = {
  id: "mcmi_screen",
  name: "غربالگری اختلالات شخصیت (MCMI-Inspired)",
  shortName: "MCMI-Screen",
  phase: 3,
  category: "بالینی",
  description: "الگوهای شخصیتی ناسازگار را غربالگری می‌کند — فقط زیر نظر روانشناس تفسیر می‌شود.",
  estimatedMinutes: 7,
  scale: "yesno",
  options: YESNO,
  questions: [
    { id: 1,  text: "اغلب احساس می‌کنم باید از خودم در مقابل دیگران محافظت کنم.",    subscale: "paranoid" },
    { id: 2,  text: "خیلی سخت است که به کسی اعتماد کنم.",                            subscale: "paranoid" },
    { id: 3,  text: "احساساتم خیلی سریع و شدید تغییر می‌کنند.",                     subscale: "borderline" },
    { id: 4,  text: "روابطم معمولاً خیلی شدید یا بی‌ثبات هستند.",                   subscale: "borderline" },
    { id: 5,  text: "دوست دارم همیشه مرکز توجه باشم.",                               subscale: "histrionic" },
    { id: 6,  text: "برای جلب توجه دیگران تلاش زیادی می‌کنم.",                      subscale: "histrionic" },
    { id: 7,  text: "فکر می‌کنم از بیشتر مردم بهتر یا مهم‌تر هستم.",               subscale: "narcissistic" },
    { id: 8,  text: "انتظار دارم دیگران به خواسته‌هایم بیشتر توجه کنند.",           subscale: "narcissistic" },
    { id: 9,  text: "از ارتباط با دیگران معمولاً اجتناب می‌کنم چون می‌ترسم طرد شوم.", subscale: "avoidant" },
    { id: 10, text: "بیشتر اوقات احساس می‌کنم دیگران از من بهترند.",                 subscale: "avoidant" },
    { id: 11, text: "بدون تأیید دیگران نمی‌توانم تصمیم بگیرم.",                     subscale: "dependent" },
    { id: 12, text: "از تنها ماندن خیلی می‌ترسم.",                                   subscale: "dependent" },
  ],
  scoring: {
    subscales: [
      { key: "paranoid",     label: "پارانویید",    ids: [1,2] },
      { key: "borderline",   label: "مرزی",         ids: [3,4] },
      { key: "histrionic",   label: "نمایشی",       ids: [5,6] },
      { key: "narcissistic", label: "خودشیفته",     ids: [7,8] },
      { key: "avoidant",     label: "اجتنابی",      ids: [9,10] },
      { key: "dependent",    label: "وابسته",       ids: [11,12] },
    ],
    ranges: [
      { min: 0, max: 3,  label: "طبیعی",         color: "green",  description: "الگوهای قابل توجهی مشاهده نمی‌شود." },
      { min: 4, max: 7,  label: "متوسط",         color: "orange", description: "برخی الگوها نیاز به بررسی دارند." },
      { min: 8, max: 12, label: "ارزیابی لازم",  color: "red",    description: "لطفاً با روانشناس مشورت کنید." },
    ],
  },
  matchingWeight: 1,
};

// ═══════════════════════════════════════════════════════════════
// Export همه تست‌ها
// ═══════════════════════════════════════════════════════════════

// alias برای MBTI اجباری
const RAAVI_MATCHING: TestDef = {
  ...(MBTI_INSPIRED as any),
  id: "raavi_matching_basis_v1",
  name: "تست شخصیت راوی",
  shortName: "تیپ شخصیتی",
  description: "تیپ ارتباطی‌ات را بشناسی",
  phase: 1,
  matchingWeight: 10,
};

export const ALL_TESTS: TestDef[] = [
  // فاز ۱ — تست اجباری
  RAAVI_MATCHING,
  NEO_FFI,
  ECR_R,
  GOTTMAN,
  MBTI_INSPIRED,
  HEXACO,
  IRI,
  ERQ,
  CONFLICT_STYLE,
  LOVE_LANGUAGES,
  SEXUAL_COMPAT,
  // فاز ۲
  PHQ9,
  GAD7,
  DASS21,
  BAI,
  ISI2,
  ASRS,
  MDQ,
  YBOCS,
  PCL5,
  BDI2,
  // فاز ۳
  PID5,
  YSQ,
  MMPI_SCREEN,
  MCMI_SCREEN,
];

export const TESTS_BY_ID = Object.fromEntries(ALL_TESTS.map(t => [t.id, t]));

export const PHASE1_TESTS = ALL_TESTS.filter(t => t.phase === 1);
export const PHASE2_TESTS = ALL_TESTS.filter(t => t.phase === 2);
export const PHASE3_TESTS = ALL_TESTS.filter(t => t.phase === 3);

// تست‌های هسته‌ای برای matchmaking
export const CORE_MATCHING_TESTS = ['neo_ffi', 'ecr_r', 'erq', 'iri', 'gottman'];

// تست‌های سبک برای بخش سرگرمی
export const ENTERTAINMENT_TESTS = ['mbti', 'love_languages', 'conflict_style'];

export const TESTS_CATALOG = ALL_TESTS;
