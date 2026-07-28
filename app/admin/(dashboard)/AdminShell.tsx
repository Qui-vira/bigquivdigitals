"use client";

import Link from "next/link";
import { useState } from "react";
import {
  LayoutDashboard,
  Settings,
  Home,
  Briefcase,
  DollarSign,
  FolderOpen,
  User,
  MessageCircle,
  Mail,
  LogOut,
  Network,
  Play,
  History,
  Users,
  Target,
  Receipt,
  GitBranch,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/outreach", label: "Outreach", icon: Mail },
  { href: "/admin/graph/seeds", label: "Graph Seeds", icon: Network },
  { href: "/admin/graph/pointers", label: "BD Pointers", icon: Target },
  { href: "/admin/graph/scan", label: "Graph Scan", icon: Play },
  { href: "/admin/graph/runs", label: "Graph Runs", icon: History },
  { href: "/admin/graph/profiles", label: "Graph Profiles", icon: Users },
  { href: "/admin/graph/leads", label: "Graph Leads", icon: Target },
  { href: "/admin/graph/network", label: "Network Signals", icon: GitBranch },
  { href: "/admin/graph/budget", label: "Graph Budget", icon: Receipt },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/homepage", label: "Homepage", icon: Home },
  { href: "/admin/services", label: "Services", icon: Briefcase },
  { href: "/admin/pricing", label: "Pricing", icon: DollarSign },
  { href: "/admin/portfolio", label: "Portfolio", icon: FolderOpen },
  { href: "/admin/about", label: "About", icon: User },
  { href: "/admin/contact", label: "Contact", icon: MessageCircle },
];

function SidebarContent({
  logoutAction,
  onNavigate,
}: {
  logoutAction: () => Promise<void>;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex h-14 shrink-0 items-center px-5">
        <Link href="/admin" onClick={onNavigate} className="text-lg font-bold text-white">
          BigQuiv Digitals <span className="text-xs font-normal text-[#666]">Admin</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#aaa] transition-colors hover:bg-[#1a1a1a] hover:text-white"
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="shrink-0 border-t border-[#222] p-3">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#666] transition-colors hover:bg-[#1a1a1a] hover:text-white cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </form>
        <Link
          href="/"
          onClick={onNavigate}
          className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-[#444] transition-colors hover:text-[#888]"
        >
          View live site &rarr;
        </Link>
      </div>
    </>
  );
}

export default function AdminShell({
  children,
  logoutAction,
}: {
  children: React.ReactNode;
  logoutAction: () => Promise<void>;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="flex min-h-screen bg-[#0d0d0d]">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-56 flex-col border-r border-[#222] bg-[#111] md:flex">
        <SidebarContent logoutAction={logoutAction} />
      </aside>

      {/* Mobile top header */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-[#222] bg-[#111] px-4 md:hidden">
        <Link href="/admin" className="text-lg font-bold text-white">
          BigQuiv Digitals <span className="text-xs font-normal text-[#666]">Admin</span>
        </Link>
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
          className="rounded-lg p-2 text-[#aaa] hover:bg-[#1a1a1a] hover:text-white"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={closeDrawer}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 flex h-full w-[80%] max-w-xs flex-col border-r border-[#222] bg-[#111] shadow-2xl">
            <button
              type="button"
              aria-label="Close menu"
              onClick={closeDrawer}
              className="absolute right-3 top-3 rounded-lg p-2 text-[#aaa] hover:bg-[#1a1a1a] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent logoutAction={logoutAction} onNavigate={closeDrawer} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="w-full min-w-0 flex-1 p-4 pt-[4.5rem] md:ml-56 md:p-8 md:pt-8">
        {children}
      </main>
    </div>
  );
}
