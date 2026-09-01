import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Hedge Fund — Autonomous Financial Intelligence (PS-01)",
  description: "Multi-Agent Autonomous Financial Intelligence System for Retail Investors — LangGraph + ChromaDB RAG + SEC EDGAR",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
