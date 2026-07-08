interface Props {
  label: string;
  on: boolean;
  onToggle: () => void;
}

// Pill-style toggle used for the PDF options (Печать / Подпись / Логотип).
export function Toggle({ label, on, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className={`rounded-[9px] border px-3 py-[7px] text-[12px] font-semibold transition-colors ${
        on
          ? "border-accent bg-[#EAF1FC] text-accent-dark"
          : "border-border bg-white text-[#A89F90]"
      }`}
    >
      {label}
    </button>
  );
}
