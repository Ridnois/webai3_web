import { Shield } from "lucide-react";
import { ConnectSignInButton } from "@/components/auth/connect-sign-in-button";
import type { LucideIcon } from "lucide-react";

interface AuthGuardScreenProps {
  icon?: LucideIcon;
  iconSize?: "sm" | "md" | "lg";
  title: string;
  subtitle?: string;
  className?: string;
}

const ICON_SIZES = {
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
} as const;

export function AuthGuardScreen({
  icon: Icon = Shield,
  iconSize = "md",
  title,
  subtitle,
  className,
}: AuthGuardScreenProps) {
  return (
    <div className={className ?? "flex flex-col items-center gap-4 py-16 text-center"}>
      <Icon className={`${ICON_SIZES[iconSize]} text-muted-foreground/50`} />
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground/75 mt-1">{subtitle}</p>
        )}
      </div>
      <ConnectSignInButton />
    </div>
  );
}
