import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastContainer } from "react-toastify";
import { Analytics } from "@vercel/analytics/next";
import { Laptop, Smartphone } from "lucide-react";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GSAP Timeline Editor",
  description:
    "Create, edit, and preview preview complex GSAP animations with ease using this visual editor. Share and export final code in one click.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Desktop-only message overlay for small screens */}
        <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 text-center lg:hidden">
          <div className="flex items-center justify-center mb-6">
            <Smartphone className="h-10 w-10 text-muted-foreground mr-4" />
            <div className="text-2xl font-bold">→</div>
            <Laptop className="h-16 w-16 text-primary ml-4" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Desktop App Only</h1>
          <p className="text-muted-foreground max-w-md mb-6">
            The GSAP Timeline Editor requires a larger screen to provide the
            best experience. Please open this application on a desktop or laptop
            computer.
          </p>
          <div className="text-sm text-muted-foreground">
            Minimum recommended screen width: 1024px
          </div>
        </div>

        {/* Main app content - hidden on small screens */}
        <div className="hidden lg:block h-full w-full">{children}</div>
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
        <Analytics />
      </body>
    </html>
  );
}
