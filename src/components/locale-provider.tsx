"use client";

import { LocaleProvider } from "@/lib/i18n";
import { translations } from "@/data/translations";
import type { ReactNode } from "react";

export function ClientLocaleProvider({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider translations={translations}>{children}</LocaleProvider>
  );
}
