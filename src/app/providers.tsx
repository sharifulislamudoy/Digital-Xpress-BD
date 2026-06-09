"use client";

import EntryLoader from "@/components/loading-spinner/EntryLoader";
import ToastProvider from "@/components/Toast";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import { useEffect } from "react";

function SessionGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && (session as any)?.banned) {
      signOut({ callbackUrl: "/login" });
    }
  }, [session, status]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EntryLoader>
      <SessionProvider
        refetchInterval={30}
        refetchOnWindowFocus={true}
      >
        <SessionGuard>
          {children}
          <ToastProvider />
        </SessionGuard>
      </SessionProvider>
    </EntryLoader>
  );
}