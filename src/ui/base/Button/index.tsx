import { ArrowRight, Plus } from 'lucide-react'

type ButtonProps = {
  children?: React.ReactNode
  state?: 'default' | 'hover' | 'pressed' | 'secondary' | 'arrow' | 'add' | 'delete'
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
}

export default function Button({ children = 'Login', state = 'default', onClick, type = 'button', className }: ButtonProps) {
  if (state === 'secondary') {
    return (
      <button
        type={type}
        onClick={onClick}
        className={`bg-[#f2f2f2] border border-[#838383] flex h-8 items-center justify-center px-6 rounded cursor-pointer ${className ?? ''}`}
      >
        <span className="text-[#242424] text-base">{children}</span>
      </button>
    )
  }

  if (state === 'delete') {
    return (
      <button
        type={type}
        onClick={onClick}
        className={`bg-[#da1e28] flex h-8 items-center justify-center px-6 rounded cursor-pointer ${className ?? ''}`}
      >
        <span className="text-[#f2f2f2] text-base">{children}</span>
      </button>
    )
  }

  if (state === 'arrow') {
    return (
      <button
        type={type}
        onClick={onClick}
        className={`bg-[#242424] flex h-8 items-center justify-between px-3 rounded cursor-pointer w-full ${className ?? ''}`}
      >
        <span className="text-[#d3d3d3] text-base">{children}</span>
        <ArrowRight size={12} className="text-[#d3d3d3]" />
      </button>
    )
  }

  if (state === 'add') {
    return (
      <button
        type={type}
        onClick={onClick}
        className={`bg-[#242424] flex h-8 items-center justify-between px-3 rounded cursor-pointer w-full ${className ?? ''}`}
      >
        <span className="text-[#d3d3d3] text-base">{children}</span>
        <Plus size={12} className="text-[#d3d3d3]" />
      </button>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={`bg-[#242424] flex h-8 items-center justify-center px-6 rounded cursor-pointer w-full ${className ?? ''}`}
    >
      <span className="text-[#d3d3d3] text-base">{children}</span>
    </button>
  )
}
