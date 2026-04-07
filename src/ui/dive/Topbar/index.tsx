export default function Topbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-6 h-[60px] border-b border-[#c7c7c7] bg-white shrink-0">
      {children}
    </div>
  )
}
