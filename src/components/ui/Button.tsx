import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "soft";

const styles: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-dark shadow-[0_4px_10px_rgba(42,111,219,.25)]",
  secondary:
    "bg-white text-ink border border-border hover:bg-[#FBFAF7]",
  soft: "bg-[#EAF1FC] text-accent-dark border border-[#DCE8FB] hover:bg-[#E0EBFB]",
  ghost: "bg-transparent text-muted hover:text-ink",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", className = "", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-[13px] font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    />
  );
});
