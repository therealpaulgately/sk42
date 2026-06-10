import type { ComponentType } from "react";
import {
  BarChart3,
  Crown,
  GitCompare,
  LayoutDashboard,
  Settings,
  Shield,
  ShieldCheck,
  Swords,
  Users,
  Waypoints,
} from "lucide-react";
import type { Route } from "next";

export interface NavItem {
  title: string;
  href: Route;
  icon: ComponentType<{ className?: string }>;
  description?: string;
}

export const primaryNav: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Command overview",
  },
  {
    title: "Server Movement",
    href: "/server-movement",
    icon: Waypoints,
    description: "Server scope & context",
  },
  {
    title: "Conquest Tracker",
    href: "/conquest",
    icon: Swords,
    description: "Reporting & deltas",
  },
  {
    title: "Player Tracker",
    href: "/players",
    icon: Users,
    description: "Search & intelligence",
  },
  {
    title: "Overall Alliances",
    href: "/alliances",
    icon: BarChart3,
    description: "Alliance overview",
  },
  {
    title: "Compare Alliances",
    href: "/alliances/compare",
    icon: GitCompare,
    description: "Side-by-side analysis",
  },
  {
    title: "Title Management",
    href: "/titles",
    icon: Crown,
    description: "Roles & assignments",
  },
  {
    title: "Leadership Roster",
    href: "/leadership",
    icon: Shield,
    description: "Officer chain",
  },
];

export const utilityNav: NavItem[] = [
  {
    title: "Admin",
    href: "/admin",
    icon: ShieldCheck,
    description: "Ops & sync tools",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Preferences",
  },
];
