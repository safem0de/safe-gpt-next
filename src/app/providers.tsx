// src/app/providers.tsx

'use client';

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export default function Providers({ children }: Readonly<{ children: ReactNode }>) {
  return <SessionProvider>{children}</SessionProvider>;
}
