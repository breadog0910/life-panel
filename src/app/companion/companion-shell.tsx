"use client";

import { AuthProvider } from "@/lib/auth-context";
import { CompanionAuthGate } from "./companion-auth-gate";

export default function CompanionShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <CompanionAuthGate>{children}</CompanionAuthGate>
    </AuthProvider>
  );
}
