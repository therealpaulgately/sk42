"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { primaryNav, utilityNav } from "@/config/navigation";

function getPageMeta(pathname: string) {
  const all = [...primaryNav, ...utilityNav].sort(
    (a, b) => b.href.length - a.href.length
  );
  const match = all.find((item) =>
    item.href === "/"
      ? pathname === "/"
      : pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  return {
    title: match?.title ?? "SK42 Command Center",
    subtitle: match?.description,
  };
}

export default function CommandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { title, subtitle } = getPageMeta(pathname);

  return (
    <AppShell title={title} subtitle={subtitle}>
      {children}
    </AppShell>
  );
}
