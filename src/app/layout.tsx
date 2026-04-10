import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Persana Health — AI-Assisted Antibiotic Prescription Support",
  description:
    "Demo: AI-assisted antibiotic prescription support system for Italian GPs. Acute pharyngitis workflow using Centor/McIsaac score.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
