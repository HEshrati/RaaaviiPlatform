"use client";

import { usePathname } from "next/navigation";

export default function DashboardAwarePadding({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const inDashboard = pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin");

  // داشبورد: موبایل pt-14 (TopHeader موبایل)، دسکتاپ pt-0 (سایدبار داریم)
  // بقیه صفحات: pt-16 برای TopHeader
  return (
    <div className={`app-content-shell ${inDashboard ? "app-dashboard-shell pt-14 lg:pt-0" : "app-standard-shell pt-16"}`}>
      {children}
    </div>
  );
}
