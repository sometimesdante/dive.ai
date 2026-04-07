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
        className={`relative h-4 w-[30px] rounded-full transition-colors cursor-pointer ${checked ? 'bg-[#00C49A]' : 'bg-[#c7c7c7]'}`}
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[14px]' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  )
}
