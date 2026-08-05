"use client";
import { Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Reveal from "../Reveal";

const SUGGESTIONS = [
  {
    title: "مقاله پیشنهادی بر اساس تست شخصیت",
    desc: "مقالاتی متناسب با نوع شخصیت و نیازهای روان‌شناختی شما",
    icon: "🧠",
    color: "#6366f1",
    href: "/articles?tab=recommended",
    shadow: "rgba(99,102,241,0.15)",
    border: "rgba(99,102,241,0.2)",
  },
  {
    title: "رویدادهای متناسب با علایق شما",
    desc: "رویدادهایی که بیشترین تطابق را با پروفایل شما دارند",
    icon: "🎯",
    color: "#f97316",
    href: "/events/recommended",
    shadow: "rgba(249,115,22,0.18)",
    border: "rgba(249,115,22,0.25)",
  },
  {
    title: "تست‌های پیشنهادی برای شناخت بیشتر",
    desc: "تست‌هایی که هنوز انجام نداده‌اید و می‌توانند بینش جدیدی بدهند",
    icon: "📋",
    color: "#FF6B00",
    href: "/dashboard/tests",
    shadow: "rgba(255,107,0,0.18)",
    border: "rgba(255,107,0,0.25)",
  },
];

export default function RaviRecommendations() {
  return (
    <Reveal direction="up" className="py-16 md:py-24 px-4 md:px-6">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-full text-sm font-bold mb-4">
            <Sparkles size={16} />
            پیشنهاد راوی به شما
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 mb-4">
            محتوای اختصاصی شما
          </h2>
          <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto">
            بر اساس پروفایل و نتایج تست‌های شما، محتوا و خدمات متناسب پیشنهاد می‌شود
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {SUGGESTIONS.map((item, i) => (
            <Reveal key={i} direction="up" delay={i * 0.1}>
              <Link href={item.href} className="block group">
                <div
                  className="bg-white rounded-2xl p-6 transition-all duration-300 hover:-translate-y-2"
                  style={{
                    border: `1.5px solid ${item.border}`,
                    background: `linear-gradient(135deg, #fff 60%, ${item.color}08)`,
                    boxShadow: `0 4px 20px ${item.shadow}, 0 1px 4px rgba(0,0,0,0.04)`,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      `0 12px 40px ${item.shadow}, 0 4px 12px rgba(0,0,0,0.06)`;
                    (e.currentTarget as HTMLElement).style.borderColor =
                      item.color + "60";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      `0 4px 20px ${item.shadow}, 0 1px 4px rgba(0,0,0,0.04)`;
                    (e.currentTarget as HTMLElement).style.borderColor = item.border;
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 transition-transform group-hover:scale-110"
                    style={{
                      background: `${item.color}15`,
                      boxShadow: `0 4px 12px ${item.shadow}`,
                    }}
                  >
                    {item.icon}
                  </div>
                  <h3 className="font-black text-slate-900 text-lg mb-2">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-4">
                    {item.desc}
                  </p>
                  <div
                    className="flex items-center gap-1 text-sm font-bold group-hover:gap-2 transition-all"
                    style={{ color: item.color }}
                  >
                    <span>مشاهده</span>
                    <ArrowLeft size={14} />
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>


      </div>
    </Reveal>
  );
}
