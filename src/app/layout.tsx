import type { Metadata } from "next";
import "./globals.css";
import "../styles/theme.css";
import "../styles/styles.css";
import "../styles/auth.css";
import "../styles/dashboard.css";
import "../styles/admin.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";

export const metadata: Metadata = {
  title: "SmartEarnBD - Investment Platform",
  description: "SmartEarnBD - Your trusted investment platform. Earn daily profits through secure investments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" data-scroll-behavior="smooth">
      <head>
        <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <ToastProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
