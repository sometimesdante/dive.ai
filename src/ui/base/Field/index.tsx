export default function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <span className="text-[#838383] px-3">{label}</span>
      {children}
    </div>
  )
}
