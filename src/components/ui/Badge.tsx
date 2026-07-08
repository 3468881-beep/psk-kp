import type { QuoteStatus } from "@/lib/types";

type Tone = "gray" | "blue" | "purple" | "green" | "red";

const toneClasses: Record<Tone, string> = {
  gray: "bg-[#EFE9DE] text-muted",
  blue: "bg-[#EAF1FC] text-accent-dark",
  purple: "bg-[#EFE6FB] text-[#6B3FB0]",
  green: "bg-ok-bg text-ok",
  red: "bg-risk-bg text-risk",
};

export function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

const statusMeta: Record<QuoteStatus, { label: string; tone: Tone }> = {
  draft: { label: "черновик", tone: "gray" },
  saved: { label: "сохранён", tone: "blue" },
  sent: { label: "отправлен", tone: "purple" },
  won: { label: "выигран", tone: "green" },
  rejected: { label: "отклонён", tone: "red" },
};

export function StatusBadge({ status }: { status: QuoteStatus }) {
  const m = statusMeta[status] ?? statusMeta.draft;
  return <Badge tone={m.tone}>{m.label}</Badge>;
}
