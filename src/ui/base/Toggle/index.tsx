'use client'

type ToggleProps = {
  label?: string
  checked?: boolean
  onChange?: (checked: boolean) => void
  className?: string
}

export default function Toggle({ label, checked = false, onChange, className }: ToggleProps) {
  return (
    <div className={`flex items-center justify-between px-3 ${className ?? ''}`}>
      {label && <span className="text-black">{label}</span>}
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange?.(!checked)}
        className={`relative h-4 w-8 rounded-full transition-colors cursor-pointer ${checked ? 'bg-[#00C49A]' : 'bg-[#9ca3af]'}`}
      >
        <span
          className={`absolute top-[1px] h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[0px]' : '-translate-x-[14px]'}`}
        />
      </button>
    </div>
  )
}
