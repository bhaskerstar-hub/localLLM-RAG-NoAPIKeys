"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Library, MessageSquareText, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const NAV_LINKS = [
  { href: "/chat", label: "Chat", icon: MessageSquareText },
  { href: "/documents", label: "Documents", icon: Library },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
] as const;

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-primary via-accent to-transparent" />
      <div className="mx-auto flex h-[72px] w-full max-w-[1680px] items-center gap-8 px-4 sm:px-6 lg:px-10 2xl:px-16">
        <Link href="/chat" className="group flex items-center gap-3">
          <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-[0_0_20px_-4px_var(--color-primary)] transition-transform duration-300 [clip-path:polygon(15%_0,100%_0,85%_100%,0_100%)] group-hover:scale-105">
            <span className="absolute inset-0 -z-10 animate-pulse rounded-xl bg-gradient-to-br from-primary to-accent opacity-60 blur-md" />
            <Sparkles className="size-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
              QUERION
            </span>
            <span className="hidden text-[10px] font-semibold tracking-[0.3em] text-muted-foreground sm:block">
              RAG PLATFORM
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-[15px]">
          {NAV_LINKS.map((link) => {
            const isActive = pathname?.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3.5 py-2 font-semibold text-foreground/65 transition-colors hover:bg-foreground/5 hover:text-foreground",
                  isActive &&
                    "bg-gradient-to-r from-primary/20 to-accent/10 text-foreground shadow-[inset_0_0_0_1px_var(--color-primary)]"
                )}
              >
                <Icon className={cn("size-[18px]", isActive && "text-primary")} />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-emerald-500 dark:text-emerald-400 sm:flex">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            LIVE
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
