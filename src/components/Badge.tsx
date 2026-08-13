const URGENCY_STYLES: Record<string, string> = {
  low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  fulfilled: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  cancelled: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  accepted: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  rejected: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  expired: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

function Pill({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${className}`}
    >
      {label}
    </span>
  );
}

export function UrgencyBadge({ urgency }: { urgency: string }) {
  return <Pill label={urgency} className={URGENCY_STYLES[urgency] ?? URGENCY_STYLES.low} />;
}

export function StatusBadge({ status }: { status: string }) {
  return <Pill label={status} className={STATUS_STYLES[status] ?? STATUS_STYLES.open} />;
}

export function BloodTypeBadge({ bloodType }: { bloodType: string }) {
  return (
    <span className="inline-flex items-center justify-center rounded-md bg-red-600 px-2 py-1 text-sm font-bold text-white">
      {bloodType}
    </span>
  );
}
