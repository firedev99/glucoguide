import "./globals.css"
import type { Metadata } from "next"
import { Providers } from "./providers"
import { Manrope } from "next/font/google"

const manrope = Manrope({ subsets: ["greek", "latin"] })

export const metadata: Metadata = {
  title:
    "Gluco Guide - An Integrated Health Monitoring System for Diabetes Patients",
  description:
    "This web app is an integrated health monitoring system for diabetes patients",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const userTheme = localStorage.getItem('theme');
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const theme = userTheme || 'system';
                const isDark = theme === 'dark' || (theme === 'system' && systemPrefersDark);
                if (isDark) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
                document.documentElement.style.setProperty('--initial-theme', theme);
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${manrope.className} dark:bg-zinc-900 dark:text-[#a3a3a3]`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
