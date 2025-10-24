export default function MeterPill({ label, v }: { label: string; v: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, Number(v || 0))) * 100);
  return (
    <div className="pill">
      <span>{label}</span>
      <div className="pbar">
        <div className="pfill" style={{ width: `${pct}%` }} />
      </div>
      <span style={{ opacity: 0.7 }}>{pct}%</span>
    </div>
  );
}
