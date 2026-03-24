import Link from "next/link";
import Image from "next/image";

export function Logo() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-3">
      <Image src="/logo-2.svg" alt="WebAI3" width={36} height={36} className="block dark:hidden" />
      <Image src="/logo-2-dark.svg" alt="WebAI3" width={36} height={36} className="hidden dark:block" />
      <div>
        <p className="text-base font-bold tracking-tight text-foreground sm:text-lg">
          webai3<span className="text-primary">.app</span>
        </p>
        <p className="hidden text-[10px] uppercase tracking-[0.17em] text-muted-foreground sm:block">
          Pay-per-use AI
        </p>
      </div>
    </Link>
  );
}
