'use client'

import { Dialog } from '@base-ui/react/dialog'

type Props = {
  open: boolean
  onClose: () => void
  width?: number
  children: React.ReactNode
}

export default function SlidePanel({ open, onClose, width = 360, children }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose() }} modal>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 backdrop-blur-[2px] bg-white/20 z-30" />
        <Dialog.Popup
          style={{ width }}
          className="fixed top-0 right-0 h-full bg-[#f2f2f2] border-l border-[#e8e8e8] shadow-xl flex flex-col gap-4 p-6 z-40 transition-transform duration-300 translate-x-full data-[open]:translate-x-0 data-[ending-style]:translate-x-full outline-none"
        >
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
