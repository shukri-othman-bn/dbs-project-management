import type { Metadata } from "next";
import { SessionProvider } from "@/components/providers/session-provider";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import "./globals.css";

export const metadata: Metadata = {
  title: "DBS Project Management",
  description: "Department project and budget monitoring platform",
  applicationName: "DBS Project Management",
  appleWebApp: {
    capable: true,
    title: "DBS Projects",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <RegisterServiceWorker />
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
