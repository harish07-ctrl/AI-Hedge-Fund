import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "AI Hedge Fund",
  description: "Multi-agent investment analysis powered by LangGraph",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        <Navbar />
        <main className="px-6 py-6 lg:px-10">
          {children}
        </main>
      </body>
    </html>
  );
}
