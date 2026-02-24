import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-1 text-xl font-bold">
      <span>web3</span>
      <span className="text-primary">-ai</span>
    </Link>
  );
}
