import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { ThemeProvider } from "@/components/theme-provider";
import { prisma } from "@/lib/prisma";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await prisma.appSettings.findFirst().catch(() => null);
  const title = settings?.appTitle || "Lifecycle Planner";
  return {
    title,
    description: `${title} — team work planning, resourcing, and weekly execution`,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Runs before first paint — prevents dark/light flash on reload */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('lc-theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}`,
          }}
        />
      </head>
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        <ThemeProvider />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
