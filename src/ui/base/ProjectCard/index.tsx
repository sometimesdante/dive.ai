type ProjectCardProps = {
  text: string
  projectCode: string
  status?: 'default' | 'overdue' | 'approaching' | 'on-track' | 'complete'
  className?: string
  draggable?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
  isDragging?: boolean
}

const statusGradient: Record<string, string> = {
  default:    'transparent',
  overdue:    '#ff832b',
  approaching:'#f1c21b',
  'on-track': 'transparent',
  complete:   '#14b8a6',
}

import { memo } from 'react'

export default memo(function ProjectCard({ text, projectCode, status = 'default', className, draggable, onDragStart, onDragEnd, isDragging }: ProjectCardProps) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`bg-white flex flex-col gap-1 items-start p-3 shadow-[2px_4px_8px_0px_rgba(0,0,0,0.12)] w-full cursor-grab active:cursor-grabbing transition-opacity ${isDragging ? 'opacity-40' : 'opacity-100'} ${className ?? ''}`}
    >
      <div
        className="h-0.5 shrink-0 -mx-3 -mt-3 self-stretch"
        style={{
          background: `linear-gradient(to right, transparent 0%, ${statusGradient[status]} 50%, transparent 100%)`,
        }}
      />
      <span className="bg-[#f2f2f2] text-[#838383] text-[10px] px-2 py-0.5 rounded-full leading-tight mt-2">
        {projectCode}
      </span>
      <p className="text-black w-full">{text}</p>
    </div>
  )
})
