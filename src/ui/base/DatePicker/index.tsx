import { Calendar } from 'lucide-react'

type DatePickerProps = {
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  name?: string
  id?: string
  className?: string
}

export default function DatePicker({ value, onChange, name, id, className }: DatePickerProps) {
  return (
    <div className={`bg-white border border-[#c7c7c7] flex h-8 items-center justify-between px-3 rounded ${className ?? ''}`}>
      <Calendar size={12} className="text-black shrink-0 mr-2" />
      <input
        type="date"
        name={name}
        id={id}
        value={value}
        onChange={onChange}
        className="text-[13px] text-black outline-none bg-transparent w-full cursor-pointer"
      />
    </div>
  )
}
