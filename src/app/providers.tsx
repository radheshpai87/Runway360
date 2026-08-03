"use client";

import { SessionProvider } from "next-auth/react";
import { ReactLenis } from "lenis/react";
import React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ReactLenis root options={{ lerp: 0.08, duration: 1.2, smoothWheel: true }}>
        {children}
      </ReactLenis>
    </SessionProvider>
  );
}
