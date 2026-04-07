import DatePicker from '@/ui/base/DatePicker'
import Dropdown from '@/ui/base/Dropdown'
import TextInput from '@/ui/base/TextInput'

type LabelledInputProps = {
  label: string
  type?: 'text' | 'dropdown' | 'date' | 'password' | 'email'
  name?: string
  id?: string
  placeholder?: string
  value?: string
  options?: { label: string; value: string }[]
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  className?: string
}

export default function LabelledInput({ label, type = 'text', name, id, placeholder, value, options = [], onChange, className }: LabelledInputProps) {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className ?? ''}`}>
      <span className="text-[#838383] px-3">{label}</span>
      {type === 'dropdown' ? (
        <Dropdown
          name={name}
          id={id}
          value={value}
          options={options}
          onChange={onChange as (e: React.ChangeEvent<HTMLSelectElement>) => void}
        />
      ) : type === 'date' ? (
        <DatePicker
          name={name}
          id={id}
          value={value}
          onChange={onChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
        />
      ) : (
        <TextInput
          name={name}
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
        />
      )}
    </div>
  )
}
