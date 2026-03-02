"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyUserDashboardPage() {
  const router = useRouter();

  // Keep old route working by redirecting users to home page.
  useEffect(() => {
    router.replace("/");
  }, [router]);

  return null;
}
