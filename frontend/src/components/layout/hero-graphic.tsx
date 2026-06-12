import { cn } from "@/lib/utils";

interface HeroGraphicProps {
  className?: string;
}

/**
 * Broadcast-style decorative backdrop: glowing gradient orbs plus angular
 * "scoreboard" stripes. Pure inline SVG, no external assets.
 */
export function HeroGraphic({ className }: HeroGraphicProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 800 320"
      preserveAspectRatio="xMidYMid slice"
      className={cn("pointer-events-none absolute inset-0 size-full", className)}
    >
      <defs>
        <linearGradient id="hero-glow-primary" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hero-glow-accent" x1="1" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hero-stripe" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-chart-3)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-chart-3)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <circle cx="660" cy="40" r="220" fill="url(#hero-glow-primary)" />
      <circle cx="120" cy="300" r="200" fill="url(#hero-glow-accent)" />

      <g opacity="0.5">
        <path d="M -40 360 L 280 -40" stroke="var(--color-primary)" strokeOpacity="0.12" strokeWidth="90" />
        <path d="M 120 380 L 460 -40" stroke="url(#hero-stripe)" strokeWidth="50" />
        <path d="M 540 380 L 920 -40" stroke="var(--color-accent)" strokeOpacity="0.08" strokeWidth="70" />
      </g>
    </svg>
  );
}
