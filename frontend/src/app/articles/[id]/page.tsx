"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowRight, Clock, BookOpen, Share2, ChevronLeft,
  Calendar, Tag, Eye
} from "lucide-react";
import PublicNavbar from "@/components/PublicNavbar";
import { getArticleImage } from "@/lib/articleImage";

const SITE = "https://raaviiplatform.com";

const CAT_STYLE: Record<string, { color: string; bg: string }> = {
  "روانشناسی مثبت": { color: "#22c55e", bg: "#f0fdf4" },
  "مدیریت استرس":   { color: "#FF6B00", bg: "#fff7ed" },
  "روابط سالم":     { color: "#f97316", bg: "#fff7ed" },
  "خودشناسی":       { color: "#eab308", bg: "#fefce8" },
  "بهداشت روان":    { color: "#a855f7", bg: "#faf5ff" },
  "رشد فردی":       { color: "#ec4899", bg: "#fdf2f8" },
  "هوش هیجانی":     { color: "#0ea5e9", bg: "#f0f9ff" },
  "ذهن‌آگاهی":      { color: "#10b981", bg: "#ecfdf5" },
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function markdownToHtml(md: string): string {
  const safe = escapeHtml(md);
  return safe
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-black text-slate-900 mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-black text-slate-900 mt-8 mb-3 pb-2 border-b border-slate-200">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-black text-slate-900 mt-8 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-black text-slate-900">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-slate-600 italic">$1</em>')
    .replace(/^- (.+)$/gm, '<li class="text-slate-700 leading-8 mr-4 list-disc">$1</li>')
    .replace(/\n\n/g, '</p><p class="text-slate-700 leading-9 mb-4 text-[15px]">')
    .split('\n')
    .map(line => line.startsWith('<') ? line : `<p class="text-slate-700 leading-9 mb-4 text-[15px]">${line}</p>`)
    .join('\n');
}

export default function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [article, setArticle] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`${SITE}/api/content/articles/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        setArticle(d);
        setLoading(false);
        if (d?.category) {
          fetch(`${SITE}/api/content/articles?limit=20&category=${encodeURIComponent(d.category)}&exclude=${id}`)
            .then(r => r.ok ? r.json() : [])
            .then(list => {
              const arts = Array.isArray(list) ? list : (list?.data || []);
              const sameCategory = arts.filter((a: any) => a.id !== id && a.category === d.category);
              if (sameCategory.length >= 2) {
                const titleWords = d.title?.split(' ').filter((w: string) => w.length > 3) || [];
                const similar = sameCategory.filter((a: any) =>
                  titleWords.some((w: string) => a.title?.includes(w))
                );
                setRelated(similar.length >= 2 ? similar.slice(0, 3) : sameCategory.slice(0, 3));
                return;
              }
              fetch(`${SITE}/api/content/articles?limit=10&exclude=${id}`)
                .then(r => r.json()).then(all => {
                  const a = Array.isArray(all) ? all : (all?.data || []);
                  setRelated(a.filter((x: any) => x.id !== id).slice(0, 3));
                });
            });
        }
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!article) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
      <p className="text-slate-800 font-black text-lg">مقاله پیدا نشد</p>
      <Link href="/articles" className="text-orange-500 text-sm">← بازگشت به مقالات</Link>
    </div>
  );

  const cat = CAT_STYLE[article.category] || { color: "#FF6B00", bg: "#fff7ed" };
  const bodyHtml = markdownToHtml(article.content || article.body || "");
  const wordCount = (article.content || article.body || "").split(/\s+/).length;
  const readTime = article.read_time || Math.max(3, Math.round(wordCount / 180));
  const dateStr = article.created_at
    ? new Date(article.created_at).toLocaleDateString("fa-IR", { year:"numeric", month:"long", day:"numeric" })
    : "";

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <PublicNavbar />

      <div className="h-1 w-full"
        style={{ background: `linear-gradient(90deg,${cat.color},${cat.color}60)` }} />

      <main className="max-w-2xl mx-auto px-4 pt-8 pb-20">

        <nav className="flex items-center gap-2 text-xs text-slate-400 mb-6">
          <Link href="/" className="hover:text-orange-500 transition-colors">خانه</Link>
          <ChevronLeft size={11} />
          <Link href="/articles" className="hover:text-orange-500 transition-colors">کتابخانه</Link>
          <ChevronLeft size={11} />
          <span className="text-slate-500 truncate max-w-[120px]">{article.title}</span>
        </nav>

        <header className="mb-8">
          {article.category && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black mb-4"
              style={{ background: cat.bg, color: cat.color }}>
              {article.category}
            </span>
          )}

          {/* عکس واقعی به جای ایموجی */}
          <div className="mb-6 -mx-4">
            <div className="relative w-full h-56 sm:h-72 overflow-hidden rounded-2xl">
              <img
                src={getArticleImage(article, 0)}
                alt={article.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0"
                style={{background:"linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.4) 100%)"}}/>
              {article.category && (
                <span className="absolute bottom-3 right-3 text-xs font-black px-3 py-1.5 rounded-full"
                  style={{background:cat.color, color:"white"}}>
                  {article.category}
                </span>
              )}
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4 leading-tight">
            {article.title}
          </h1>

          <div className="flex items-center gap-4 text-xs text-slate-500 mb-5 flex-wrap">
            {article.author && (
              <span className="flex items-center gap-1 font-bold text-slate-700">
                {article.author}
              </span>
            )}
            {dateStr && (
              <span className="flex items-center gap-1">
                <Calendar size={11} /> {dateStr}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={11} /> {readTime} دقیقه مطالعه
            </span>
            {article.view_count > 0 && (
              <span className="flex items-center gap-1">
                <Eye size={11} /> {article.view_count.toLocaleString("fa-IR")} بازدید
              </span>
            )}
          </div>

          <div className="h-px bg-slate-100" />
        </header>

        {article.summary && (
          <div className="p-5 rounded-2xl mb-8"
            style={{ background: cat.bg, border: `1px solid ${cat.color}25` }}>
            <p className="text-slate-700 text-sm leading-8 font-medium italic">{article.summary}</p>
          </div>
        )}

        {bodyHtml ? (
          <div className="relative mb-10">
            <div className="rounded-3xl p-6 md:p-8"
              style={{
                background:"white",
                boxShadow:"0 4px 32px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
                border:"1px solid rgba(0,0,0,0.06)",
              }}>
              <div className="h-1 rounded-full mb-6"
                style={{background:"linear-gradient(90deg,#FF6B00,#f97316,#fbbf24)"}}/>
              <div className="prose-custom"
                dangerouslySetInnerHTML={{ __html: bodyHtml }} />
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-slate-400">
            <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">محتوا در دست تهیه است</p>
          </div>
        )}

        {article.tags?.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-8 pt-6 border-t border-slate-100">
            <Tag size={13} className="text-slate-400" />
            {article.tags.map((tag: string) => (
              <span key={tag}
                className="text-xs px-3 py-1 rounded-full font-bold"
                style={{ background: "#f1f5f9", color: "#475569" }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 mb-12 pt-4 border-t border-slate-100">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              background: copied ? "#f0fdf4" : "#f8fafc",
              border: `1px solid ${copied ? "#22c55e40" : "rgba(0,0,0,0.08)"}`,
              color: copied ? "#16a34a" : "#475569",
            }}>
            <Share2 size={12} />
            {copied ? "لینک کپی شد!" : "اشتراک‌گذاری"}
          </button>
          <Link href="/articles"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ background: "rgba(255,107,0,0.08)", border: "1px solid rgba(255,107,0,0.2)", color: "#FF6B00" }}>
            <ArrowRight size={12} /> بازگشت به کتابخانه
          </Link>
        </div>

        {related.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 rounded-full" style={{ background: cat.color }} />
              <h3 className="text-slate-900 font-black text-base">
                {article.category ? `مقالات بیشتر در ${article.category}` : "همین موضوع، دیدگاه دیگر"}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {related.map((r, ri) => (
                <Link key={r.id} href={`/articles/${r.id}`}
                  className="group block rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
                  style={{
                    background: "#f8fafc",
                    border: `1.5px solid rgba(0,0,0,0.06)`,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = cat.color + "40";
                    (e.currentTarget as HTMLElement).style.background = cat.bg;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.06)";
                    (e.currentTarget as HTMLElement).style.background = "#f8fafc";
                  }}>
                  {/* عکس مقالات مرتبط */}
                  <div className="relative w-full h-28 overflow-hidden">
                    <img
                      src={getArticleImage(r, ri)}
                      alt={r.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0"
                      style={{background:"linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.3) 100%)"}}/>
                  </div>
                  <div className="p-3">
                    {r.category && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full mb-1.5 inline-block"
                        style={{ background: cat.bg, color: cat.color }}>
                        {r.category}
                      </span>
                    )}
                    <p className="text-slate-900 text-xs font-black line-clamp-2 leading-relaxed mb-1 group-hover:text-orange-600 transition-colors">
                      {r.title}
                    </p>
                    {r.read_time && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock size={9} /> {r.read_time} دقیقه
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <style>{`
        .prose-custom p { color: #374151; line-height: 2; margin-bottom: 1.2rem; font-size: 15px; }
        .prose-custom h2 { color: #0f172a; font-size: 1.15rem; font-weight: 900; margin-top: 2rem; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 2px solid #fff7ed; position: relative; }
        .prose-custom h2::before { content: ""; position: absolute; bottom: -2px; right: 0; width: 40px; height: 2px; background: #FF6B00; border-radius: 4px; }
        .prose-custom h3 { color: #1e293b; font-size: 1rem; font-weight: 900; margin-top: 1.5rem; margin-bottom: 0.5rem; }
        .prose-custom li { color: #374151; margin-bottom: 0.4rem; padding-right: 0.5rem; }
        .prose-custom li::marker { color: #FF6B00; }
        .prose-custom strong { color: #0f172a; background: linear-gradient(120deg, #fff7ed, #fff7ed); padding: 0 2px; border-radius: 3px; }
        .prose-custom ol { counter-reset: item; list-style: none; padding-right: 0; }
        .prose-custom ol li { counter-increment: item; padding-right: 1.8rem; position: relative; }
        .prose-custom ol li::before { content: counter(item); position: absolute; right: 0; top: 2px; background: #FF6B00; color: white; width: 20px; height: 20px; border-radius: 50%; font-size: 11px; font-weight: 900; display: flex; align-items: center; justify-content: center; }
      `}</style>
    </div>
  );
}
