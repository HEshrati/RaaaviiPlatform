"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cpu, Lock, CheckCircle2, ArrowRight, ChevronLeft } from "lucide-react";
import { TESTS_CATALOG, CORE_MATCHING_TESTS } from "@/lib/tests-catalog";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Props {
  children: React.ReactNode;
  /** اگه true باشه فقط warning نشون میده، block نمی‌کنه */
  softMode?: boolean;
}

export default function CoreTestsGate({ children, softMode = false }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "locked" | "unlocked">("loading");
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setStatus("locked"); return; }

    fetch(`${API}/api/test-results/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const ids: string[] = (Array.isArray(data) ? data : data.results || [])
          .map((x: any) => x.test_id || x.testId || x.test_name);
        setCompletedIds(ids);
        const allDone = CORE_MATCHING_TESTS.every(id => ids.includes(id));
        setStatus(allDone ? "unlocked" : "locked");
      })
      .catch(() => setStatus("locked"));
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unlocked" || softMode) {
    return <>{children}</>;
  }

  // LOCKED UI
  const coreTests = TESTS_CATALOG.filter(t => CORE_MATCHING_TESTS.includes(t.id));
  const remaining = coreTests.filter(t => !completedIds.includes(t.id));
  const nextTest = remaining[0];

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 bg-white" dir="rtl">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/15 border border-orange-500/25
          flex items-center justify-center mx-auto mb-5">
          <Lock size={28} className="text-orange-400" />
        </div>

        <h2 className="text-xl font-black text-slate-900 mb-2">
          تکمیل تست‌های اصلی لازم است
        </h2>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          برای مشاوره با روانشناس یا همزیست، ابتدا باید ۵ تست هسته‌ای راوی را تکمیل کنید.
          این تست‌ها به متخصص کمک می‌کنند تا بهترین خدمت را برای شما ارائه دهد.
        </p>

        {/* Progress */}
        <div className="mb-5">
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            <span>پیشرفت</span>
            <span>{completedIds.filter(id => CORE_MATCHING_TESTS.includes(id)).length} از {CORE_MATCHING_TESTS.length}</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden"
            style={{ background: "rgba(30,58,95,0.08)" }}>
            <div className="h-full rounded-full transition-all"
              style={{
                width: `${(completedIds.filter(id => CORE_MATCHING_TESTS.includes(id)).length / CORE_MATCHING_TESTS.length) * 100}%`,
                background: "linear-gradient(90deg,#FF6B00,#f97316)",
              }} />
          </div>
        </div>

        {/* Test list */}
        <div className="space-y-2 mb-6 text-right">
          {coreTests.map(t => {
            const done = completedIds.includes(t.id);
            return (
              <div key={t.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{
                  background: done ? "rgba(34,197,94,0.07)" : "rgba(248,250,252,1)",
                  border: `1px solid ${done ? "rgba(34,197,94,0.2)" : "rgba(226,232,240,0.8)"}`,
                }}>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  done ? "bg-green-500/20" : "bg-orange-500/10"
                }`}>
                  {done
                    ? <CheckCircle2 size={14} className="text-green-400" />
                    : <Cpu size={14} className="text-orange-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-bold ${done ? "text-green-300" : "text-white"}`}>
                    {t.shortName}
                  </div>
                  <div className="text-[10px] text-slate-500">{t.estimatedMinutes} دقیقه</div>
                </div>
                {done
                  ? <span className="text-[10px] text-green-400 font-bold">✓ تکمیل</span>
                  : <span className="text-[10px] text-slate-600">باقی‌مانده</span>}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        {nextTest && (
          <Link href={`/dashboard/tests/${nextTest.id}`}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl
              font-black text-slate-800 text-sm transition-all"
            style={{ background: "linear-gradient(135deg,#FF6B00,#f97316)" }}>
            <Cpu size={16} />
            شروع تست: {nextTest.shortName}
            <ArrowRight size={14} />
          </Link>
        )}

        <Link href="/dashboard/tests"
          className="mt-3 block text-center text-slate-500 hover:text-slate-300 text-xs transition-all">
          مشاهده همه تست‌ها
          <ChevronLeft size={12} className="inline" />
        </Link>
      </div>
    </div>
  );
}
