import { ArrowRight, Plus } from 'lucide-react'

type ButtonProps = {
  children?: React.ReactNode
  state?: 'default' | 'hover' | 'pressed' | 'secondary' | 'arrow' | 'add' | 'delete'
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  className?: string
}

export default function Button({ children = 'Login', state = 'default', onClick, type = 'button', disabled, className }: ButtonProps) {
  if (state === 'secondary') {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`bg-[#f2f2f2] border border-[#838383] flex h-8 items-center justify-center px-6 rounded cursor-pointer disabled:opacity-50 ${className ?? ''}`}
      >
        <span className="text-[#242424]">{children}</span>
      </button>
    )
  }

  if (state === 'delete') {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`bg-[#da1e28] flex h-8 items-center justify-center px-6 rounded cursor-pointer disabled:opacity-50 ${className ?? ''}`}
      >
        <span className="text-[#f2f2f2]">{children}</span>
      </button>
    )
  }

  if (state === 'arrow') {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`bg-[#242424] flex h-8 items-center justify-between px-3 rounded cursor-pointer disabled:opacity-50 w-full ${className ?? ''}`}
      >
        <span className="text-[#d3d3d3]">{children}</span>
        <ArrowRight size={12} className="text-[#d3d3d3]" />
      </button>
    )
  }

  if (state === 'add') {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`bg-[#242424] flex h-8 items-center justify-between px-3 rounded cursor-pointer disabled:opacity-50 w-full ${className ?? ''}`}
      >
        <span className="text-[#d3d3d3]">{children}</span>
        <Plus size={12} className="text-[#d3d3d3]" />
      </button>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`bg-[#242424] flex h-8 items-center justify-center px-6 rounded cursor-pointer disabled:opacity-50 w-full ${className ?? ''}`}
    >
      <span className="text-[#d3d3d3]">{children}</span>
    </button>
  )
}
