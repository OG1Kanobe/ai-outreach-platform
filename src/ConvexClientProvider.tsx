import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";

// Use the environment variable. If it's missing, it will fall back to your hardcoded one 
// ONLY if you are absolutely sure that is your production URL.
const convexUrl = (import.meta as any).env.VITE_CONVEX_URL || "https://dapper-poodle-813.convex.cloud";

const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthProvider client={convex}>
      {children}
    </ConvexAuthProvider>
  );
}