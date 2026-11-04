 "use client";

import type { ReactNode } from "react";
// Add shared UI/theme providers here if required by the selected HeroUI version.
// Keep provider setup centralized so every route uses the same configuration.

export function Providers({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
