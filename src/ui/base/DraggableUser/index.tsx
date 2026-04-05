import { GripVertical } from 'lucide-react'

type DraggableUserProps = {
  name?: string
  role?: string
  className?: string
}

export default function DraggableUser({ name = 'Sarah Chen', role = 'Owner', className }: DraggableUserProps) {
  return (
    <div className={`bg-white border border-black flex gap-1.5 h-[26px] items-center px-3 py-1 rounded-xl ${className ?? ''}`}>
      <GripVertical size={10} className="text-black shrink-0" />
      <span className="text-[13px] text-black">{name}</span>
      <span className="text-[13px] text-[#838383]">{role}</span>
    </div>
  )
}
