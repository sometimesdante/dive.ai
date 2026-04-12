'use client'

import { Select } from '@base-ui/react/select'
import { ChevronDown, Check } from 'lucide-react'

type DropdownProps = {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  options: { label: string; value: string }[]
  name?: string
  id?: string
  className?: string
}

export default function Dropdown({ value, defaultValue, onValueChange, options, name, id, className }: DropdownProps) {
  return (
    <Select.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange as (value: string | null) => void}
      name={name}
    >
      <Select.Trigger
        id={id}
        className={`bg-white border border-[#c7c7c7] flex h-8 items-center justify-between px-3 rounded w-full cursor-pointer outline-none ${className ?? ''}`}
      >
        <Select.Value>
          {(val: string | null) => options.find(o => o.value === val)?.label ?? val ?? ''}
        </Select.Value>
        <Select.Icon>
          <ChevronDown size={12} className="text-black shrink-0" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Positioner sideOffset={4}>
          <Select.Popup className="bg-white border border-[#c7c7c7] rounded shadow-md py-1 outline-none z-50 min-w-[var(--anchor-width)]">
            {options.map((opt) => (
              <Select.Item
                key={opt.value}
                value={opt.value}
                className="flex items-center justify-between px-3 h-8 cursor-pointer text-black hover:bg-[#f2f2f2] data-[highlighted]:bg-[#f2f2f2] outline-none"
              >
                <Select.ItemText>{opt.label}</Select.ItemText>
                <Select.ItemIndicator>
                  <Check size={12} className="text-[#14b8a6]" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}
