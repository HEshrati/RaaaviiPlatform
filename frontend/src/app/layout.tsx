export const dynamic = "force-dynamic";

import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientLayout from "./ClientLayout";


export const metadata: Metadata = {
  title: "راوی - پلتفرم هوشمند یافتن دوست",
  description: "با راوی به جامعه‌ای از افراد می‌پیوندید که به دنبال روابط معنادار هستند",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-sans antialiased" style={{ background: "#fff", minHeight: "100vh" }}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
