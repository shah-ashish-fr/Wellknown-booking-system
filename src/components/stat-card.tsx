interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  badge?: string;
  badgeColor?: "emerald" | "blue" | "amber" | "indigo";
}

export default function StatCard({
  label,
  value,
  icon,
  subtitle,
  badge,
  badgeColor = "indigo",
}: StatCardProps) {
  const badgeClasses = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  }[badgeColor];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <div className="rounded-lg bg-slate-50 p-2 text-slate-600 border border-slate-100">
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        {badge && (
          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border ${badgeClasses}`}>
            {badge}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}
