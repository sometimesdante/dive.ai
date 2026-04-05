type ProjectCardProps = {
  text: string
  projectCode: string
  status?: 'default' | 'overdue' | 'approaching' | 'on-track'
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
  'on-track': '#14b8a6',
}

export default function ProjectCard({ text, projectCode, status = 'default', className, draggable, onDragStart, onDragEnd, isDragging }: ProjectCardProps) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`bg-white flex flex-col gap-2 items-start pb-2 px-3 shadow-[2px_4px_8px_0px_rgba(0,0,0,0.12)] w-full cursor-grab active:cursor-grabbing transition-opacity ${isDragging ? 'opacity-40' : 'opacity-100'} ${className ?? ''}`}
    >
      <div
        className="h-0.5 w-full shrink-0"
        style={{
          background: `linear-gradient(to right, transparent 0%, ${statusGradient[status]} 50%, transparent 100%)`,
        }}
      />
      <p className="text-black w-full">{text}</p>
      <div className="flex w-full justify-end">
        <span className="bg-[#f2f2f2] text-black px-2.5 py-1 rounded-full">
          {projectCode}
        </span>
      </div>
    </div>
  )
}
