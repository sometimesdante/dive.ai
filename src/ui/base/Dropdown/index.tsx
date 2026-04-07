import { ChevronDown } from 'lucide-react'

type DropdownProps = {
  value?: string
  defaultValue?: string
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: { label: string; value: string }[]
  name?: string
  id?: string
  className?: string
}

export default function Dropdown({ value, defaultValue, onChange, options, name, id, className }: DropdownProps) {
  return (
    <div className={`bg-white border border-[#c7c7c7] flex h-8 items-center justify-between px-3 rounded relative ${className ?? ''}`}>
      <select
        name={name}
        id={id}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        className="text-black w-full outline-none bg-transparent appearance-none cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="text-black shrink-0 pointer-events-none absolute right-3" />
    </div>
  )
}
