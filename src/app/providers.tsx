"use client";

import EntryLoader from "@/components/loading-spinner/EntryLoader";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <EntryLoader>
    <SessionProvider>{children}</SessionProvider>
  </EntryLoader>;
}