'use client'

import { Switch } from '@base-ui/react/switch'

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
      <Switch.Root
        checked={checked}
        onCheckedChange={onChange}
        className="relative h-4 w-8 rounded-full transition-colors cursor-pointer bg-[#9ca3af] data-[checked]:bg-[#00C49A]"
      >
        <Switch.Thumb className="absolute top-[1px] left-[1px] h-3.5 w-3.5 rounded-full bg-white shadow transition-transform data-[checked]:translate-x-4" />
      </Switch.Root>
    </div>
  )
}
