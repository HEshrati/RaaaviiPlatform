"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    // انتقال کاربر از صفحه رزرو قدیمی به صفحه جدیدی که جزئیات و رزرو را با هم دارد
    router.replace(`/events/${params.id}`);
  }, [params.id, router]);

  return (
    <div className="min-h-screen flex items-center justify-center" dir="rtl">
      <p className="text-slate-400 animate-pulse">در حال انتقال به صفحه رزرو...</p>
    </div>
  );
}
