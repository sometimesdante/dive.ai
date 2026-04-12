import { Field as BaseField } from '@base-ui/react/field'

export default function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <BaseField.Root className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <BaseField.Label className="text-[#838383] px-3">{label}</BaseField.Label>
      {children}
    </BaseField.Root>
  )
}
