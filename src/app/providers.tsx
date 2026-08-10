"use client";

import { SessionProvider } from "next-auth/react";
import { ReactLenis } from "lenis/react";
import React, { useEffect, useRef } from "react";
import Lenis from "lenis";

interface LenisRef {
  lenis: Lenis;
  wrapper: HTMLDivElement | null;
  content: HTMLDivElement | null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    let rafId: number;

    function update(time: number) {
      if (lenisRef.current?.lenis) {
        lenisRef.current.lenis.raf(time);
      }
      rafId = requestAnimationFrame(update);
    }

    rafId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <SessionProvider>
      <ReactLenis 
        ref={lenisRef} 
        root 
        options={{ 
          autoRaf: false, 
          lerp: 0.08, 
          duration: 1.2, 
          smoothWheel: true 
        }}
      >
        {children}
      </ReactLenis>
    </SessionProvider>
  );
}
