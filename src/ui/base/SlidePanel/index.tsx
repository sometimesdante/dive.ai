'use client'

type Props = {
  open: boolean
  onClose: () => void
  width?: number
  children: React.ReactNode
}

export default function SlidePanel({ open, onClose, width = 360, children }: Props) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 backdrop-blur-[2px] bg-white/20 z-30"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed top-0 right-0 h-full bg-[#f2f2f2] border-l border-[#e8e8e8] shadow-xl flex flex-col gap-4 p-6 z-40 transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ width }}
      >
        {children}
      </div>
    </>
  )
}
