import { NextResponse } from "next/server";
import { ARTICLES } from "@/lib/articles-data";

const contentCache = new Map<string, string>();

async function generateArticleContent(title: string, category: string, summary: string): Promise<string> {
  const AI_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || "";
  const AI_URL =
    process.env.AI_API_URL || "https://api.gapgpt.app/v1/chat/completions";
  const AI_MODEL = process.env.AI_MODEL || "gpt-4o-mini";

  const prompt = `یک مقاله تخصصی روانشناسی به فارسی بنویس.

عنوان: ${title}
دسته‌بندی: ${category}
خلاصه: ${summary}

قوانین:
- حداقل ۱۲۰۰ کلمه
- از markdown استفاده کن (## برای سرتیترها، ### برای زیرسرتیترها، **bold** برای تأکید)
- ساختار: مقدمه، ۴ تا ۵ بخش اصلی با سرتیتر، نتیجه‌گیری
- هر بخش حداقل ۲۰۰ کلمه
- محتوای علمی و مستند با ذکر نظریه‌ها
- نوشتار روان و قابل فهم برای عموم
- در پایان ۵ توصیه عملی بده
فقط متن مقاله را بنویس.`;

  try {
    if (!AI_KEY) throw new Error("AI not configured");
    const res = await fetch(AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 3000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error("AI error");
    const data = await res.json();
    return data.choices?.[0]?.message?.content || fallback(title, category, summary);
  } catch {
    return fallback(title, category, summary);
  }
}

function fallback(title: string, category: string, summary: string): string {
  return `## مقدمه\n\n${summary}\n\nدر دنیای امروز، آگاهی از اصول روانشناسی اهمیت ویژه‌ای دارد. پژوهش‌های علمی نشان می‌دهند افرادی که به دانش روانشناختی مجهز هستند، در مواجهه با چالش‌های زندگی موفق‌تر عمل می‌کنند. این مقاله با تکیه بر آخرین یافته‌های علم روانشناسی، راهکارهای عملی و کاربردی ارائه می‌دهد.\n\n## پایه‌های علمی ${title}\n\nروانشناسان برجسته‌ای چون آلبرت بندورا، آرون بک و مارتین سلیگمن دهه‌ها تحقیق کرده‌اند تا مکانیزم‌های ذهنی انسان را روشن کنند. یافته‌های آن‌ها نشان می‌دهد که تفکر، احساس و رفتار ما در چرخه‌ای به‌هم‌پیوسته قرار دارند.\n\nمطالعات عصب‌شناختی تأیید کرده‌اند که مغز انسان تا پایان عمر قابلیت تغییر دارد. این ویژگی که **نوروپلاستیسیتی** نام دارد، امیدبخش‌ترین خبر برای کسی است که می‌خواهد الگوهای ذهنی خود را اصلاح کند.\n\n## راهکارهای عملی\n\nبرای اینکه این دانش وارد زندگی روزمره شود، باید از سطح نظری فراتر رفت. تجربه نشان داده تمرین‌های کوچک روزانه، اثری ماندگارتر از تغییرات بزرگ دارند.\n\n**گام اول — آگاهی:** قبل از هر چیز باید وضعیت فعلی خود را صادقانه ارزیابی کنید. چه الگوهایی در رفتار و تفکر شما تکرار می‌شوند؟\n\n**گام دوم — پذیرش:** پذیرش به معنای تسلیم شدن نیست؛ بلکه دیدن واقعیت همان‌طور که هست، بدون قضاوت مفرط است.\n\n**گام سوم — تمرین مداوم:** تغییر الگوهای ذهنی نیازمند تکرار است. مغز از طریق تکرار، مسیرهای عصبی جدید می‌سازد.\n\n## موانع رایج و راه‌حل‌ها\n\n**مقاومت در برابر تغییر:** ذهن انسان به وضعیت آشنا خو گرفته و از ناشناخته می‌ترسد. این مقاومت طبیعی است.\n\n**انتظارات غیرواقعی:** تغییر واقعی زمان می‌برد. کسانی که انتظار نتایج فوری دارند، زودتر ناامید می‌شوند.\n\n**کمبود حمایت اجتماعی:** داشتن افراد حامی در اطراف، سرعت رشد را به طرز چشمگیری افزایش می‌دهد.\n\n## نقش محیط و روابط\n\nمحیط زندگی و کیفیت روابط ما تأثیر عمیقی بر سلامت روان دارند. پژوهش‌های دانشگاه هاروارد در مطالعه‌ای ۷۵ ساله نشان داد که کیفیت روابط انسانی، بهترین پیش‌بینی‌کننده سلامت و شادکامی در دوران پیری است.\n\n## توصیه‌های عملی\n\n**۱. دفترچه‌نویسی روزانه:** هر شب ۵ دقیقه افکار خود را بنویسید. این عمل ساده خودآگاهی را افزایش می‌دهد.\n\n**۲. تمرین قدردانی:** هر روز سه چیز خوبی که اتفاق افتاده را یادداشت کنید.\n\n**۳. مراقبه کوتاه:** حتی ۱۰ دقیقه ذهن‌آگاهی در روز سطح استرس را کاهش می‌دهد.\n\n**۴. حرکت بدنی:** ورزش منظم سطح سروتونین و دوپامین را افزایش می‌دهد.\n\n**۵. ارتباط واقعی:** هر هفته با یک نفر مهم، گفتگویی عمیق داشته باشید.\n\n## نتیجه‌گیری\n\n${category} یکی از ارکان اساسی سلامت روان است. مهم‌ترین نکته این است که هیچ‌کس بدون تلاش و آگاهی به آرامش نمی‌رسد، اما با ابزارهای درست، این مسیر هم ممکن و هم لذت‌بخش خواهد بود. راوی در کنار شماست.`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const meta = ARTICLES.find(a => a.id === id);
  if (!meta) return NextResponse.json({ error: "not found" }, { status: 404 });

  let content = contentCache.get(id);
  if (!content) {
    content = await generateArticleContent(meta.title, meta.category, meta.summary);
    contentCache.set(id, content);
  }

  const wordCount = content.split(/\s+/).length;

  return NextResponse.json({
    ...meta,
    content,
    reading_time_minutes: Math.max(5, Math.round(wordCount / 180)),
  });
}
