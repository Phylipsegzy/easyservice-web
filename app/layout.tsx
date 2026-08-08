import "./globals.css";
import type { Metadata, Viewport } from "next";
import { LanguageProvider } from "@/lib/i18n";
import AppLock from "@/components/AppLock";

export const metadata: Metadata = {
  title: "EasyService",
  description: "EasyService FX back-office system",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EasyService",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <LanguageProvider>
          <AppLock>{children}</AppLock>
        </LanguageProvider>
      </body>
    </html>
  );
}
