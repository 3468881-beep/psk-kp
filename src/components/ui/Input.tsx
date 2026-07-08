import { forwardRef, type InputHTMLAttributes } from "react";

// A form input (bordered). For inline table cells use the `.cellinput` class.
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`w-full rounded-[8px] border border-border bg-white px-3 py-2 text-[13px] text-ink outline-none transition-shadow focus:border-accent focus:shadow-[0_0_0_2px_rgba(42,111,219,.12)] ${className}`}
        {...props}
      />
    );
  },
);
