"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNav, utilityNav, type NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import type { Route } from "next";

function isNavActive(pathname: string, href: Route, items: NavItem[]): boolean {
  if (href === "/") return pathname === "/";
  if (pathname !== href && !pathname.startsWith(`${href}/`)) return false;

  const moreSpecificMatch = items.some(
    (other) =>
      other.href !== href &&
      other.href.length > href.length &&
      (pathname === other.href || pathname.startsWith(`${other.href}/`))
  );

  return !moreSpecificMatch;
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-card/50">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary/15 text-primary">
          <span className="text-xs font-bold tracking-wider">SK</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">SK42 Command</p>
          <p className="truncate text-[11px] text-muted-foreground">
            Intelligence Agency
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Operations
        </p>
        {primaryNav.map((item) => {
          const isActive = isNavActive(pathname, item.href, primaryNav);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}

        <Separator className="my-4" />

        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          System
        </p>
        {utilityNav.map((item) => {
          const isActive = isNavActive(pathname, item.href, utilityNav);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Active server
          </p>
          <p className="text-data text-sm font-semibold text-primary">S42</p>
        </div>
      </div>
    </aside>
  );
}
