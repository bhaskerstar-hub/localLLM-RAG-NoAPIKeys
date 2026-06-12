import type { LucideIcon } from "lucide-react";

import { HeroGraphic } from "@/components/layout/hero-graphic";

interface PageHeroProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}

/**
 * Gradient "scoreboard" banner used at the top of each top-level page.
 */
export function PageHero({ icon: Icon, eyebrow, title, description, children }: PageHeroProps) {
  return (
    <div className="hero-banner">
      <HeroGraphic />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-[0_0_30px_-6px_var(--color-primary)]">
            <Icon className="size-6" />
          </span>
          <div>
            <p className="stat-label text-primary">{eyebrow}</p>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
