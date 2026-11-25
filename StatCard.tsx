export default function StatCard({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="card">
      <p className="text-sm text-turf-700">{label}</p>
      <p className="font-display text-4xl font-bold mt-1">{value}</p>
      {hint && <p className="text-xs text-turf-700 mt-1">{hint}</p>}
    </div>
  )
}
