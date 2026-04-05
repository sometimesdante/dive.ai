import { ArrowRight } from 'lucide-react'

type IntegrationsProps = {
  brand: 'Stripe' | 'Zapier' | 'GitHub'
  connected?: boolean
  onConnect?: () => void
  className?: string
}

const brandLabel: Record<string, string> = {
  Stripe: 'stripe',
  Zapier: 'zapier',
  GitHub: 'GitHub',
}

export default function Integrations({ brand, connected = false, onConnect, className }: IntegrationsProps) {
  return (
    <div className={`bg-white border border-black flex h-[26px] items-center justify-between px-3 py-1 rounded-xl w-60 ${className ?? ''}`}>
      <span className="text-[13px] text-black font-medium">{brandLabel[brand]}</span>
      <button onClick={onConnect} className="cursor-pointer">
        <ArrowRight size={12} className="text-black" />
      </button>
    </div>
  )
}
