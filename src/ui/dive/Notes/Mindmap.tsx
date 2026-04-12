'use client'

import { useEffect, useRef, useState } from 'react'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import type { Markmap as MarkmapType } from 'markmap-view'

type Props = { content: string }

// Colors cycling by depth level
const DEPTH_COLORS = [
  '#063530', // root
  '#0a7c6e',
  '#0891b2',
  '#6366f1',
  '#8b5cf6',
  '#d97706',
  '#e11d48',
]

function colorForNode(node: { depth: number }) {
  return DEPTH_COLORS[node.depth % DEPTH_COLORS.length]
}

export default function Mindmap({ content }: Props) {
  const svgRef   = useRef<SVGSVGElement>(null)
  const mmRef    = useRef<MarkmapType | null>(null)
  const scaleRef = useRef(1)
  const [loading, setLoading] = useState(false)

  // Render whenever content changes
  useEffect(() => {
    if (!svgRef.current || !content.trim()) return

    let cancelled = false
    setLoading(true)

    async function render() {
      const { Transformer } = await import('markmap-lib')
      const { Markmap, loadCSS, loadJS } = await import('markmap-view')

      if (cancelled || !svgRef.current) return

      const transformer = new Transformer()
      const { root, features } = transformer.transform(content)
      const { styles, scripts } = transformer.getUsedAssets(features)

      if (styles?.length) loadCSS(styles)
      if (scripts?.length) await loadJS(scripts, { getMarkmap: () => ({ Markmap }) })

      if (cancelled || !svgRef.current) return

      svgRef.current.innerHTML = ''

      const mm = Markmap.create(svgRef.current, {
        color: colorForNode as (node: unknown) => string,
        duration: 300,
        maxWidth: 280,
        paddingX: 14,
        spacingHorizontal: 64,
        spacingVertical: 6,
        nodeMinHeight: 20,
        initialExpandLevel: 3,
        zoom: true,
        pan: true,
        fitRatio: 0.92,
        // Match the open-circle fill to the canvas background so it doesn't flash white
        style: (id) => `#${id} { --markmap-circle-open-bg: #fafafa; }`,
      }, root)

      mmRef.current = mm
      scaleRef.current = 1
      await mm.fit()
      setLoading(false)
    }

    render()
    return () => { cancelled = true }
  }, [content])

  // Destroy only on unmount
  useEffect(() => {
    return () => { mmRef.current?.destroy() }
  }, [])

  async function handleZoomIn() {
    if (!mmRef.current) return
    scaleRef.current = Math.min(scaleRef.current * 1.3, 6)
    await mmRef.current.rescale(scaleRef.current)
  }

  async function handleZoomOut() {
    if (!mmRef.current) return
    scaleRef.current = Math.max(scaleRef.current * 0.77, 0.1)
    await mmRef.current.rescale(scaleRef.current)
  }

  async function handleFit() {
    if (!mmRef.current) return
    await mmRef.current.fit()
    scaleRef.current = 1
  }

  if (!content.trim()) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 select-none">
        <svg width="64" height="48" viewBox="0 0 64 48" fill="none" className="opacity-20">
          <circle cx="8"  cy="24" r="5" fill="#063530" />
          <circle cx="32" cy="10" r="4" fill="#063530" />
          <circle cx="32" cy="24" r="4" fill="#063530" />
          <circle cx="32" cy="38" r="4" fill="#063530" />
          <circle cx="56" cy="6"  r="3" fill="#063530" />
          <circle cx="56" cy="14" r="3" fill="#063530" />
          <circle cx="56" cy="24" r="3" fill="#063530" />
          <circle cx="56" cy="34" r="3" fill="#063530" />
          <circle cx="56" cy="42" r="3" fill="#063530" />
          <line x1="8"  y1="24" x2="32" y2="10" stroke="#063530" strokeWidth="1.5" />
          <line x1="8"  y1="24" x2="32" y2="24" stroke="#063530" strokeWidth="1.5" />
          <line x1="8"  y1="24" x2="32" y2="38" stroke="#063530" strokeWidth="1.5" />
          <line x1="32" y1="10" x2="56" y2="6"  stroke="#063530" strokeWidth="1.5" />
          <line x1="32" y1="10" x2="56" y2="14" stroke="#063530" strokeWidth="1.5" />
          <line x1="32" y1="24" x2="56" y2="24" stroke="#063530" strokeWidth="1.5" />
          <line x1="32" y1="38" x2="56" y2="34" stroke="#063530" strokeWidth="1.5" />
          <line x1="32" y1="38" x2="56" y2="42" stroke="#063530" strokeWidth="1.5" />
        </svg>
        <p className="text-sm text-[#aaaaaa]">Start writing to generate a mindmap</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-[#fafafa]">
      {/* Canvas */}
      <svg ref={svgRef} className="w-full h-full" />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#fafafa]">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#063530] opacity-70 animate-bounce"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Zoom controls */}
      {!loading && (
        <div className="absolute bottom-4 right-4 flex flex-col gap-1">
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 flex items-center justify-center bg-[#f0f0f0] border border-[#d8d8d8] rounded shadow-sm text-[#555] hover:bg-[#e5e5e5] transition-colors cursor-pointer"
            title="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 flex items-center justify-center bg-[#f0f0f0] border border-[#d8d8d8] rounded shadow-sm text-[#555] hover:bg-[#e5e5e5] transition-colors cursor-pointer"
            title="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={handleFit}
            className="w-8 h-8 flex items-center justify-center bg-[#f0f0f0] border border-[#d8d8d8] rounded shadow-sm text-[#555] hover:bg-[#e5e5e5] transition-colors cursor-pointer"
            title="Fit to screen"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      )}

      {/* Hint */}
      {!loading && (
        <p className="absolute bottom-4 left-4 text-xs text-[#cccccc] select-none pointer-events-none">
          Scroll to zoom · Drag to pan · Click nodes to collapse
        </p>
      )}
    </div>
  )
}
