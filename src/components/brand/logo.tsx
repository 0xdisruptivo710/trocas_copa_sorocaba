import Image from "next/image";

interface Props {
  variant?: "full" | "mark" | "stacked";
  size?: number;
  className?: string;
}

const SRC: Record<NonNullable<Props["variant"]>, string> = {
  full: "/logo/trocascopa.svg",
  mark: "/logo/trocascopa-mark.svg",
  stacked: "/logo/trocascopa-stacked.svg",
};

const RATIO: Record<NonNullable<Props["variant"]>, [number, number]> = {
  full: [280, 64],
  mark: [64, 64],
  stacked: [200, 200],
};

export function Logo({ variant = "full", size, className }: Props) {
  const src = SRC[variant];
  const [w, h] = RATIO[variant];
  const height = size ?? (variant === "stacked" ? 120 : 32);
  const width = Math.round((w / h) * height);

  return (
    <Image
      src={src}
      alt="TrocasCopa"
      width={width}
      height={height}
      priority
      className={className}
    />
  );
}
