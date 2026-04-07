type RichTextInputProps = {
  label?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  name?: string
  id?: string
  rows?: number
  className?: string
}

export default function RichTextInput({ label, placeholder, value, onChange, name, id, rows = 5, className }: RichTextInputProps) {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className ?? ''}`}>
      {label && (
        <span className="text-[#838383] px-3">{label}</span>
      )}
      <textarea
        name={name}
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        className="bg-white border border-black px-3 py-2 rounded text-black w-full outline-none resize-none"
      />
    </div>
  )
}
