import type { Metadata } from "next";
import "./globals.css";
import { ClientLocaleProvider } from "@/components/locale-provider";

export const metadata: Metadata = {
  title: "Persana Health \u2014 AI-Assisted Antibiotic Prescription Support",
  description:
    "Demo: AI-assisted antibiotic prescription support system for GPs. Acute pharyngitis workflow using Centor/McIsaac score.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ClientLocaleProvider>{children}</ClientLocaleProvider>
      </body>
    </html>
  );
}
