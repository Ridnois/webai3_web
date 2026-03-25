import { cn } from "@/lib/utils";

const MAX_WIDTH_MAP = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "7xl": "max-w-7xl",
} as const;

type MaxWidth = keyof typeof MAX_WIDTH_MAP;

export function PageContainer({
  as: Tag = "div",
  maxWidth = "7xl",
  className,
  children,
}: {
  as?: "div" | "main";
  maxWidth?: MaxWidth;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tag
      className={cn(
        "mx-auto px-4 py-8 sm:px-6 lg:px-8",
        MAX_WIDTH_MAP[maxWidth],
        className,
      )}
    >
      {children}
    </Tag>
  );
}
