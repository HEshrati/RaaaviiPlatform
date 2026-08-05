"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * مسیر قدیمی ثبت فضا. فرم اصلی عمداً فقط در پنل همکاران نگهداری می‌شود تا
 * اطلاعات فضا در دو مسیر جداگانه از کاربر گرفته نشود.
 */
export default function VenueRegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/panel/partner/profile");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f172a" }}>
      <Loader2 className="animate-spin text-emerald-400" size={28} />
    </div>
  );
}
