"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function VenueRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/panel/partner"); }, []);
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f172a" }}>
      <p className="text-white font-black">در حال انتقال...</p>
    </div>
  );
}
