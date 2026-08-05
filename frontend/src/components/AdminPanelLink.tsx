"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PANEL_MAP: Record<string, string> = {
  "/panel/psychologist": "psychologist",
  "/panel/facilitator":  "facilitator",
  "/panel/partner":      "partner",
  "/dashboard":          "user",
};

export default function AdminPanelLink({
  href,
  children,
  className,
  style,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const panel = PANEL_MAP[href] || "user";
    sessionStorage.setItem("active_panel", panel);
    router.push(href);
  };

  return (
    <a href={href} onClick={handleClick} className={className} style={style}>
      {children}
    </a>
  );
}
