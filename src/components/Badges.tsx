import { OPERATOR_META, type DepartureStatus, type LiveStatusKind, type Operator } from "@/lib/types";

export function OperatorBadge({ operator }: { operator: Operator }) {
  const meta = OPERATOR_META[operator];
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide"
      style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
    >
      {meta.short}
    </span>
  );
}

const DEPARTURE_LABEL: Record<DepartureStatus, { text: string; cls: string }> = {
  "on-time": { text: "Tepat waktu", cls: "bg-green-500/15 text-green-400" },
  delayed: { text: "Terlambat", cls: "bg-red-500/15 text-red-400" },
  boarding: { text: "Segera berangkat", cls: "bg-amber-500/15 text-amber-400" },
  departed: { text: "Sudah berangkat", cls: "bg-slate-500/15 text-slate-400" },
  cancelled: { text: "Dibatalkan", cls: "bg-red-900/40 text-red-300" },
};

export function StatusBadge({ status }: { status: DepartureStatus }) {
  const s = DEPARTURE_LABEL[status];
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${s.cls}`}>
      {s.text}
    </span>
  );
}

const LIVE_LABEL: Record<LiveStatusKind, { text: string; cls: string }> = {
  "on-time": { text: "Tepat waktu", cls: "bg-green-500/15 text-green-400" },
  delayed: { text: "Terlambat", cls: "bg-red-500/15 text-red-400" },
  "not-started": { text: "Belum berangkat", cls: "bg-slate-500/15 text-slate-400" },
  arrived: { text: "Tiba", cls: "bg-sky-500/15 text-sky-400" },
  cancelled: { text: "Dibatalkan", cls: "bg-red-900/40 text-red-300" },
};

export function LiveBadge({ status }: { status: LiveStatusKind }) {
  const s = LIVE_LABEL[status];
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${s.cls}`}>
      {s.text}
    </span>
  );
}

export function DelayChip({ delayMin }: { delayMin: number }) {
  if (delayMin <= 0) {
    return <span className="text-xs font-medium text-green-400">Tepat waktu</span>;
  }
  return (
    <span className="text-xs font-semibold text-red-400">
      +{delayMin} mnt
    </span>
  );
}
