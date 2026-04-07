import { Search } from 'lucide-react'

type TextInputProps = {
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: 'text' | 'password' | 'search' | 'email'
  name?: string
  id?: string
  className?: string
}

export default function TextInput({ placeholder, value, onChange, type = 'text', name, id, className }: TextInputProps) {
  return (
    <div className={`bg-white border border-black flex h-8 items-center px-3 rounded w-full ${className ?? ''}`}>
      {type === 'search' && <Search size={12} className="text-black shrink-0 mr-2" />}
      <input
        type={type === 'search' ? 'search' : type}
        name={name}
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="text-black w-full outline-none bg-transparent"
      />
    </div>
  )
}
