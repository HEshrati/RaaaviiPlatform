"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Footer from "@/components/landing/Footer";
import FAQ from "@/components/landing/FAQ";
import ArticlesPreviewSection from "@/components/ArticlesPreviewSection";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import RaviRecommendations from "@/components/landing/RaviRecommendations";
import {
  Bell,
  ArrowLeft,
  Sparkles,
  Cpu,
  ChevronDown,
} from "lucide-react";

/* ── پس‌زمینه متحرک ──────────────────────────────────────── */
function HomeBackground() {
  const [pos, setPos] = useState({ x: 38, y: 32 });
  useEffect(() => {
    document.body.style.setProperty("background-color", "#ffffff", "important");
    // فقط دسکتاپ — موبایل لمسی نیازی به mousemove ندارد
    if (window.matchMedia("(pointer: fine)").matches) {
      const onMove = (e: MouseEvent) =>
        setPos({
          x: (e.clientX / window.innerWidth) * 100,
          y: (e.clientY / window.innerHeight) * 100,
        });
      window.addEventListener("mousemove", onMove, { passive: true });
      return () => {
        window.removeEventListener("mousemove", onMove);
        document.body.style.removeProperty("background-color");
      };
    }
    return () => {
      document.body.style.removeProperty("background-color");
    };
  }, []);
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 0,
        background: `
        radial-gradient(ellipse 55% 45% at ${pos.x}% ${pos.y}%, rgba(255,107,0,0.10) 0%, transparent 60%),
        radial-gradient(ellipse 70% 55% at ${100 - pos.x * 0.6}% ${100 - pos.y * 0.5}%, rgba(255,180,80,0.07) 0%, transparent 65%),
        radial-gradient(ellipse 40% 35% at 80% 10%, rgba(255,154,60,0.06) 0%, transparent 50%),
        radial-gradient(ellipse 50% 40% at 10% 90%, rgba(255,200,100,0.05) 0%, transparent 55%),
        #ffffff
      `,
        transition: "background 0.12s linear",
      }}
    />
  );
}

/* ── قلب هیرو ────────────────────────────────────────────── */
function HeartIllustration() {
  return (
    <svg
      viewBox="0 0 320 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{ filter: "drop-shadow(0 12px 32px rgba(255,107,0,0.28))" }}
    >
      <defs>
        <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFB347" />
          <stop offset="55%" stopColor="#FF7A00" />
          <stop offset="100%" stopColor="#E05500" />
        </linearGradient>
        <radialGradient id="hGlow" cx="45%" cy="35%" r="55%">
          <stop offset="0%" stopColor="white" stopOpacity="0.3" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* سایه نرم پشت قلب */}
      <ellipse
        cx="160"
        cy="268"
        rx="95"
        ry="12"
        fill="#FF7A00"
        opacity="0.12"
      />

      {/* قلب اصلی */}
      <path
        d="M160 255 C95 210 38 168 38 110 C38 74 65 50 100 56 C124 60 146 78 160 102 C174 78 196 60 220 56 C255 50 282 74 282 110 C282 168 225 210 160 255Z"
        fill="url(#hg)"
      />
      {/* هایلایت */}
      <ellipse cx="155" cy="128" rx="82" ry="62" fill="url(#hGlow)" />

      {/* شخص چپ */}
      <circle cx="118" cy="118" r="14" fill="white" opacity="0.92" />
      <path
        d="M100 158 C100 143 112 134 118 134 C124 134 136 143 136 158"
        fill="white"
        opacity="0.88"
      />

      {/* شخص راست */}
      <circle cx="202" cy="118" r="14" fill="white" opacity="0.92" />
      <path
        d="M184 158 C184 143 196 134 202 134 C208 134 220 143 220 158"
        fill="white"
        opacity="0.88"
      />

      {/* خط ارتباط */}
      <path
        d="M134 122 Q160 108 186 122"
        stroke="white"
        strokeWidth="2.5"
        fill="none"
        opacity="0.55"
        strokeLinecap="round"
        strokeDasharray="4 3"
      />

      {/* حباب گفتگو */}
      <rect
        x="145"
        y="94"
        width="30"
        height="18"
        rx="9"
        fill="white"
        opacity="0.75"
      />
      <polygon points="160,112 155,120 165,120" fill="white" opacity="0.75" />
      <circle cx="153" cy="103" r="2" fill="#FF7A00" />
      <circle cx="160" cy="103" r="2" fill="#FF7A00" />
      <circle cx="167" cy="103" r="2" fill="#FF7A00" />

      {/* نقاط تزئینی */}
      <circle cx="52" cy="68" r="5.5" fill="#FFD580" opacity="0.82" />
      <circle cx="268" cy="60" r="4.5" fill="#FFD580" opacity="0.7" />
      <circle cx="292" cy="148" r="3.5" fill="#FFB347" opacity="0.6" />
      <circle cx="30" cy="152" r="3.5" fill="#FFB347" opacity="0.6" />
      <circle cx="160" cy="30" r="5" fill="#FF9A3C" opacity="0.45" />
      <circle cx="285" cy="85" r="3" fill="#FFD580" opacity="0.5" />

      {/* ستاره‌های کوچک */}
      <g opacity="0.7">
        <line
          x1="50"
          y1="192"
          x2="50"
          y2="204"
          stroke="#FF9A3C"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="44"
          y1="198"
          x2="56"
          y2="198"
          stroke="#FF9A3C"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      <g opacity="0.55">
        <line
          x1="276"
          y1="175"
          x2="276"
          y2="185"
          stroke="#FF9A3C"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <line
          x1="271"
          y1="180"
          x2="281"
          y2="180"
          stroke="#FF9A3C"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

/* ── کریستال هیرو ────────────────────────────────────────── */
function CrystalHeroVisual() {
  const sparkles = [
    { left: "8%", top: "22%", color: "#14b8a6", delay: "0s", duration: "3.4s" },
    { left: "18%", top: "72%", color: "#f59e0b", delay: "1.1s", duration: "4.2s" },
    { left: "28%", top: "12%", color: "#8b5cf6", delay: "2.2s", duration: "3.8s" },
    { left: "74%", top: "10%", color: "#ff7a00", delay: ".6s", duration: "3.1s" },
    { left: "88%", top: "33%", color: "#06b6d4", delay: "1.8s", duration: "4.4s" },
    { left: "82%", top: "77%", color: "#8b5cf6", delay: "2.8s", duration: "3.5s" },
    { left: "52%", top: "89%", color: "#f59e0b", delay: ".4s", duration: "4s" },
  ];

  return (
    <div className="raavi-hero-visual relative w-full max-w-[272px] sm:max-w-[390px] md:max-w-[470px] aspect-square mx-auto" aria-hidden="true">
      <div
        className="raavi-hero-aura absolute inset-[16%] sm:inset-[10%] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(255,122,0,0.2) 0%, rgba(255,179,71,0.08) 45%, transparent 72%)" }}
      />
      {sparkles.map((star, index) => (
        <span
          key={index}
          className={`raavi-hero-sparkle ${index > 3 ? "raavi-hero-sparkle-secondary" : ""}`}
          style={{
            left: star.left,
            top: star.top,
            color: star.color,
            background: star.color,
            animationDelay: star.delay,
            animationDuration: star.duration,
          }}
        />
      ))}
      <svg
        viewBox="0 0 440 440"
        className="raavi-hero-svg absolute inset-0 h-full w-full overflow-visible"
        role="img"
        aria-label="کریستال نارنجی متحرک راوی"
      >
        <defs>
          <radialGradient id="raavi-crystal-core" cx="35%" cy="24%" r="78%">
            <stop offset="0%" stopColor="#fff7df" stopOpacity=".98" />
            <stop offset="18%" stopColor="#ffd28a" stopOpacity=".95" />
            <stop offset="55%" stopColor="#ff8b19" stopOpacity=".94" />
            <stop offset="100%" stopColor="#b83b00" stopOpacity=".96" />
          </radialGradient>
          <linearGradient id="raavi-crystal-left" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#fff4ce" stopOpacity=".94" />
            <stop offset="1" stopColor="#ed5800" stopOpacity=".75" />
          </linearGradient>
          <linearGradient id="raavi-crystal-right" x1="1" y1="0" x2="0" y2="1">
            <stop stopColor="#ffbf57" stopOpacity=".9" />
            <stop offset="1" stopColor="#9f2900" stopOpacity=".82" />
          </linearGradient>
          <linearGradient id="raavi-crystal-rim" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#fff8e8" />
            <stop offset=".45" stopColor="#ff9a26" />
            <stop offset="1" stopColor="#ffd59d" />
          </linearGradient>
          <filter id="raavi-crystal-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="13" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="raavi-crystal-soft" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        <ellipse cx="220" cy="391" rx="117" ry="18" fill="#d85b00" opacity=".15" filter="url(#raavi-crystal-soft)" />
        <g className="raavi-hero-crystal" filter="url(#raavi-crystal-glow)">
          <path d="M220 31 348 104 367 253 220 394 73 253 92 104Z" fill="none" stroke="url(#raavi-crystal-rim)" strokeWidth="2.5" opacity=".75" />
          <path d="m220 12 149 103-34 172-115 125L105 287 71 115Z" fill="none" stroke="#ffb15b" strokeWidth="1.4" opacity=".48" strokeDasharray="7 7" />

          <path d="M220 55 326 117 309 245 220 352 131 245 114 117Z" fill="url(#raavi-crystal-core)" stroke="url(#raavi-crystal-rim)" strokeWidth="2.5" />
          <path d="M220 55 220 207 114 117 131 245Z" fill="url(#raavi-crystal-left)" opacity=".72" />
          <path d="M220 55 326 117 220 207 309 245Z" fill="url(#raavi-crystal-right)" opacity=".68" />
          <path d="m131 245 89-38 89 38-89 107Z" fill="#e65200" opacity=".48" />
          <path d="m114 117 106 90 106-90-17 128-89-38-89 38Z" fill="#ffb03d" opacity=".18" />
          <path d="M220 55v297M114 117l195 128M326 117 131 245M131 245l178 0" fill="none" stroke="#fff4d7" strokeWidth="1.15" opacity=".55" />
          <path d="M145 128 220 78l69 49-69 58Z" fill="#fff8df" opacity=".2" />
          <path d="M148 139 215 98" stroke="white" strokeWidth="6" strokeLinecap="round" opacity=".45" />
          <path d="M164 167 205 142" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity=".55" />
          <circle cx="220" cy="207" r="30" fill="#fff4d5" opacity=".13" />
          <circle className="raavi-crystal-pulse" cx="220" cy="207" r="8" fill="#fff8e9" opacity=".9" />
        </g>
        <g className="raavi-crystal-orbits" fill="none" stroke="#ff9a30" opacity=".4">
          <ellipse cx="220" cy="220" rx="168" ry="62" strokeWidth="1" transform="rotate(-27 220 220)" />
          <ellipse cx="220" cy="220" rx="148" ry="52" strokeWidth=".8" strokeDasharray="3 7" transform="rotate(35 220 220)" />
        </g>
      </svg>
    </div>
  );
}

/* ── مغز در لامپ (برای سکشن کشف) ───────────────────────── */
function BrainLightbulb() {
  return (
    <svg
      viewBox="0 0 140 165"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full drop-shadow-2xl"
      style={{ filter: "drop-shadow(0 0 18px rgba(255,120,0,0.35))" }}
    >
      <defs>
        <linearGradient
          id="bulbGrad"
          x1="28"
          y1="12"
          x2="112"
          y2="140"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFB347" />
          <stop offset="50%" stopColor="#FF7A00" />
          <stop offset="100%" stopColor="#E05500" />
        </linearGradient>
        <radialGradient id="glowGrad" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="0.28" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse
        cx="70"
        cy="114"
        rx="28"
        ry="5.5"
        fill="#FF7A00"
        opacity="0.18"
      />
      <path
        d="M70 10C46 10 26 30 26 55C26 69 32 81 43 90L43 107C43 110 46 113 50 113L90 113C94 113 97 110 97 107L97 90C108 81 114 69 114 55C114 30 94 10 70 10Z"
        fill="url(#bulbGrad)"
      />
      <ellipse cx="70" cy="55" rx="32" ry="32" fill="url(#glowGrad)" />
      <rect x="46" y="113" width="48" height="7" rx="3.5" fill="#FF8C00" />
      <rect x="49" y="122" width="42" height="7" rx="3.5" fill="#FF9A3C" />
      <rect x="54" y="131" width="32" height="7" rx="3.5" fill="#FFB870" />
      <rect x="60" y="140" width="20" height="6" rx="3" fill="#FFB870" />
      <g transform="translate(38, 27)">
        <path
          d="M32 9C29 9 26.5 10.5 25 13C23 10 20 8 17 8C12 8 8 12 8 17C8 20 9.5 22.5 12 24C10.5 25 9 27 9 29.5C9 33.5 12 36.5 16 37.5C17.5 40.5 20 43 24 43.5L24 50L32 50C33 50 34 49 34 48L34 43.5C38 43 40.5 40.5 42 37.5C46 36.5 49 33.5 49 29.5C49 27 47.5 25 46 24C48.5 22.5 50 20 50 17C50 12 46 8 41 8C38 8 35.5 10 34 13C33 10.5 32 9 32 9Z"
          fill="white"
          opacity="0.93"
        />
        <path
          d="M29 10C29 10 26 16 28 24C29 28 28 36 28 42"
          stroke="#FF7A00"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M18 18C18 18 22 22 20 28"
          stroke="#FF7A00"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M12 25C12 25 16 28 14 33"
          stroke="#FF7A00"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M40 18C40 18 36 22 38 28"
          stroke="#FF7A00"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M46 25C46 25 42 28 44 33"
          stroke="#FF7A00"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.6"
        />
        <circle cx="29" cy="8" r="2" fill="#FFD580" opacity="0.8" />
        <circle cx="41" cy="7" r="1.5" fill="#FFD580" opacity="0.7" />
        <circle cx="20" cy="12" r="1.5" fill="#FFD580" opacity="0.6" />
      </g>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <>
      <HomeBackground />

      <div className="relative z-10 min-h-[100dvh] pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0" dir="rtl">
        {/* ─── HEADER ─── */}

        {/* ─── MAIN CONTENT ─── */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ─── HERO ─── */}
          <section className="max-w-xl mx-auto md:max-w-none pt-2 md:pt-10 md:grid md:grid-cols-2 md:gap-10 lg:gap-14 md:items-center mb-8">
            <div className="order-2 md:order-1">
              {/* عنوان اصلی — بدون بج بالا */}
              <h1 className="text-[30px] md:text-[42px] lg:text-[52px] font-black text-slate-900 leading-tight mb-4">
                با <span style={{ color: "#FF7A00" }}>راوی</span> هم‌صحبتت رو
                پیدا کن
              </h1>

              <p
                className="text-slate-500 text-sm md:text-base leading-relaxed mb-6"
                style={{ lineHeight: "1.85" }}
              >
                تطابق‌های هوشمند اگزیستانسیال واقعی
                <br />
                پاسخ به نیازهای روانشناختی
                <br />
                بر اساس درک عمیق از شما
              </p>

              <div className="flex gap-3 max-w-sm">
                {/* دکمه اول: درباره راوی */}
                <Link
                  href="/about"
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-white text-sm transition-all active:scale-95 hover:opacity-90"
                  style={{
                    background:
                      "linear-gradient(135deg, #FF6B00 0%, #FF9A3C 100%)",
                    boxShadow: "0 8px 24px rgba(255,107,0,0.30)",
                  }}
                >
                  درباره راوی
                  <ArrowLeft size={15} />
                </Link>
                <Link
                  href="/events"
                  className="flex-1 flex items-center justify-center py-3.5 rounded-2xl font-black text-sm text-slate-700 transition-all hover:text-slate-900 active:scale-95"
                  style={{
                    border: "1.5px solid #1e3a5f",
                    background: "#1e3a5f",
                    color: "white",
                  }}
                >
                  بزن بریم 🚀
                </Link>
              </div>

              {/* دکمه اسکرول خودکار به تست روان — کنار دکمه‌های هیرو */}
              <button
                onClick={() => {
                  const el = document.getElementById("ravi-tests");
                  if (el)
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-sm transition-all active:scale-95 hover:opacity-90 max-w-sm"
                style={{
                  background: "rgba(255,107,0,0.08)",
                  border: "1.5px solid rgba(255,107,0,0.2)",
                  color: "#FF7A00",
                }}
              >
                <Cpu size={15} />
                تست روان‌شناسی
                <ChevronDown size={13} />
              </button>
            </div>

            {/* کریستال روی موبایل نیز نمایش داده می‌شود؛ اندازه و اولویت بارگذاری واکنش‌گراست. */}
            <div className="order-1 md:order-2 flex items-center justify-center -mt-5 mb-1 md:mt-0 md:mb-0">
              <CrystalHeroVisual />
            </div>
          </section>

          {/* ─── پیشنهاد راوی به شما ─── */}
          <section className="w-full mb-10">
            <RaviRecommendations />
          </section>

          {/* ─── کتابخانه راوی (ArticlesPreviewSection دارای هدر خودشه) ─── */}
          <section className="w-full mb-10">
            <ArticlesPreviewSection />
          </section>

          {/* ─── کشف خود ─── */}
          <section
            id="ravi-tests"
            className="max-w-lg mx-auto md:max-w-none mb-10"
          >
            <div
              className="rounded-3xl p-5 md:p-8 relative overflow-hidden"
              style={{
                background: "linear-gradient(145deg, #fff8f0 0%, #fff3e6 100%)",
                border: "1px solid rgba(255,107,0,0.15)",
                boxShadow:
                  "0 8px 40px rgba(255,107,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
              }}
            >
              <div
                className="absolute -top-8 -left-8 w-32 h-32 rounded-full pointer-events-none"
                style={{
                  background: "rgba(255,107,0,0.1)",
                  filter: "blur(24px)",
                }}
              />
              <div className="flex items-center gap-4 md:gap-8 relative z-10">
                <div className="flex-shrink-0 w-28 h-32 md:w-40 md:h-44">
                  <BrainLightbulb />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base md:text-2xl font-black text-slate-900 leading-tight mb-2">
                    خود واقعی‌تان را کشف کنید
                  </h3>
                  <p
                    className="text-xs md:text-sm text-slate-500 leading-relaxed mb-4"
                    style={{ lineHeight: "1.7" }}
                  >
                    تست شخصیت راوی برای آنالیز دقیق و آرایش و همنشینی مناسب را
                    تجربه کنید
                  </p>
                  <Link
                    href="/dashboard/tests"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-black text-white text-xs md:text-sm transition-all active:scale-95 hover:opacity-90"
                    style={{
                      background: "linear-gradient(135deg, #FF6B00, #FF9A3C)",
                      boxShadow: "0 4px 16px rgba(255,107,0,0.30)",
                    }}
                  >
                    <Sparkles size={12} />
                    شروع تشخیص و آنالیز راوی
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ─── نظرات کاربران — هم‌اندازه مقالات ─── */}
          <section className="w-full mt-4 mb-6" dir="rtl">
            <div className="text-center mb-6">
              <span
                className="text-[11px] font-black text-orange-500 px-3 py-1.5 rounded-full"
                style={{
                  background: "rgba(255,107,0,0.08)",
                  border: "1px solid rgba(255,107,0,0.18)",
                }}
              >
                نظرات کاربران
              </span>
              <h2 className="text-base md:text-xl font-black text-slate-900 mt-3">
                چه می‌گویند؟
              </h2>
            </div>
            <TestimonialsCarousel />
          </section>

          {/* ─── سوالات متداول — هم‌اندازه مقالات ─── */}
          <div className="w-full" dir="rtl">
            <FAQ />
          </div>
        </div>

        <Footer />
      </div>

    </>
  );
}
