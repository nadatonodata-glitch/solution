import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyLauncher - App Launcher",
  description: "Beautiful app launcher built with Next.js",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MyLauncher",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        {/* FontAwesome */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        
        {/* PWA Meta Tags */}
        <meta name="application-name" content="MyLauncher" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MyLauncher" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#667eea" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons-pwa/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons-pwa/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons-pwa/icon-192x192.png" />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons-pwa/icon-72x72.png" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}