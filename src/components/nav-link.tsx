import Link from "next/link";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  children: string;
  className?: string;
}

export function NavLink({ href, children, className }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center rounded-full border border-transparent px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:border-border/80 hover:bg-background/75 hover:text-foreground",
        className
      )}
    >
      {children}
    </Link>
  );
}
