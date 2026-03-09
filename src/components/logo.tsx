import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-3"
      aria-label="web3-ai home"
    >
      <span className="relative flex size-9 items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-linear-to-br from-primary/20 via-primary/10 to-chart-2/20 shadow-[0_10px_35px_-18px_var(--primary)]">
        <span className="absolute inset-[1px] rounded-[calc(var(--radius-lg)+2px)] bg-background/80" />
        <span className="relative text-sm font-black tracking-[-0.12em] text-primary">
          w3
        </span>
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[0.95rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          web3-ai
        </span>
        <span className="text-xs text-foreground/72 transition-colors group-hover:text-foreground">
          inference on rails
        </span>
      </span>
    </Link>
  );
}
