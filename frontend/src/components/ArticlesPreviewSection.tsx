"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ArrowLeft, Clock, Sparkles } from "lucide-react";
import { getArticleImage } from "@/lib/articleImage";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function ArticlesPreviewSection() {
  const [articles, setArticles] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/content/articles?limit=3")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const list = Array.isArray(d) ? d : d?.data || d?.articles || [];
        setArticles(list.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  if (!articles.length) return null;

  return (
    <section className="py-14 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/articles"
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:scale-110 transition-transform"
                style={{
                  background: "rgba(255,107,0,0.1)",
                  border: "1px solid rgba(255,107,0,0.2)",
                }}
              >
                <BookOpen size={16} className="text-orange-500" />
              </Link>
              <Link
                href="/articles"
                className="text-xl font-black text-slate-900 hover:text-orange-600 transition-colors"
              >
                کتابخانه راوی
              </Link>
            </div>
            <p className="text-slate-500 text-sm">
              مقالات تخصصی روانشناسی و رشد فردی
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/articles?tab=recommended"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
              style={{
                background: "linear-gradient(135deg,#FF6B00,#f97316)",
                boxShadow: "0 4px 12px rgba(255,107,0,0.3)",
              }}
            >
              <Sparkles size={13} /> پیشنهادی
            </Link>
            <Link
              href="/articles"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-orange-500 hover:bg-orange-50 transition-all"
              style={{ border: "1.5px solid rgba(255,107,0,0.25)" }}
            >
              همه <ArrowLeft size={14} />
            </Link>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {articles.map((a: any, i: number) => (
            <Link
              key={a.id || i}
              href={`/articles/${a.id || a.slug}`}
              className="group block rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "white",
                border: "1.5px solid rgba(255,107,0,0.12)",
                boxShadow:
                  "0 4px 20px rgba(255,107,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 12px 40px rgba(255,107,0,0.15), 0 4px 12px rgba(0,0,0,0.06)";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(255,107,0,0.35)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 4px 20px rgba(255,107,0,0.08), 0 1px 4px rgba(0,0,0,0.04)";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(255,107,0,0.12)";
              }}
            >
              {/* تصویر مقاله */}
              <div className="relative w-full h-44 overflow-hidden bg-slate-100">
                <img
                  src={getArticleImage(a, i)}
                  alt={a.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.4) 100%)",
                  }}
                />
                {a.category && (
                  <span
                    className="absolute bottom-2 right-2 text-[10px] font-black px-2.5 py-1 rounded-full"
                    style={{
                      background: "rgba(255,107,0,0.85)",
                      color: "white",
                    }}
                  >
                    {a.category}
                  </span>
                )}
              </div>

              <div className="p-5">
                <h3 className="font-black text-slate-900 text-sm leading-relaxed mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                  {a.title}
                </h3>
                {a.summary && (
                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-3">
                    {a.summary}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  {a.read_time && (
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={10} /> {a.read_time} دقیقه
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs font-bold text-orange-500 group-hover:gap-2 transition-all">
                    بخوانید <ArrowLeft size={12} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
