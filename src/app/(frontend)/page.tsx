'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Kanban, Users, Clock, FileText, ArrowRight, CheckCircle } from 'lucide-react'

// ─── Intersection observer hook ──────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); observer.disconnect() } },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])
  return { ref, inView }
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const pillars = [
  {
    icon: <Kanban size={22} />,
    title: 'Opinionated',
    desc: 'Dive ships with sensible defaults. No configuration hell — just open it and get to work.',
  },
  {
    icon: <Users size={22} />,
    title: 'Collaborative',
    desc: 'Roles, clusters, and workspaces designed for real teams — from solo founders to large orgs.',
  },
  {
    icon: <Clock size={22} />,
    title: 'Complete',
    desc: 'Boards, time tracking, notes, and docs all live in one place. No more switching apps.',
  },
]

const features = [
  {
    label: 'Project Boards',
    title: 'Move work forward, visually',
    desc: 'Drag-and-drop kanban boards with backlog, todo, doing, and done columns. Every task has status, assignees, and a clear home.',
    img: '/illustrations/project boards.png',
    checks: ['Drag-and-drop columns', 'Status indicators', 'Assignee tracking'],
  },
  {
    label: 'Team Workspace',
    title: 'Your whole team in one place',
    desc: 'Invite members, assign roles, and organise work into clusters. One workspace holds everything your organisation builds.',
    img: '/illustrations/team workspace.png',
    checks: ['Role-based access', 'Cluster grouping', 'Org-level settings'],
  },
  {
    label: 'Time Tracking',
    title: 'Know where every hour goes',
    desc: 'Built-in timesheets let you log time against projects without leaving Dive. No third-party integrations required.',
    img: '/illustrations/time tracking.png',
    checks: ['Per-task time logs', 'Project summaries', 'Export-ready data'],
  },
  {
    label: 'Notes & Docs',
    title: 'Decisions live next to the work',
    desc: 'Rich-text notes linked directly to your projects. Keep briefs, research, and decisions where the work happens.',
    img: '/illustrations/notes and docs.png',
    checks: ['Rich-text editor', 'Linked to projects', 'Team-readable'],
  },
]

// ─── Feature row ──────────────────────────────────────────────────────────────
function FeatureRow({ feature, index }: { feature: typeof features[0]; index: number }) {
  const { ref, inView } = useInView()
  const reverse = index % 2 === 1

  return (
    <div
      ref={ref}
      className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-16`}
    >
      {/* Text */}
      <div className={`flex-1 flex flex-col gap-5 transition-[opacity,transform] duration-700 ${inView ? 'opacity-100 translate-x-0' : reverse ? 'opacity-0 translate-x-10' : 'opacity-0 -translate-x-10'}`}>
        <span className="text-sm font-semibold tracking-widest text-[#14b8a6] uppercase">{feature.label}</span>
        <h2 className="m-0 text-[#063530]">{feature.title}</h2>
        <p className="text-[#555] text-lg leading-relaxed m-0">{feature.desc}</p>
        <ul className="flex flex-col gap-2 m-0 p-0 list-none">
          {feature.checks.map(c => (
            <li key={c} className="flex items-center gap-2 text-[#333]">
              <CheckCircle size={16} className="text-[#14b8a6] shrink-0" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Illustration */}
      <div className={`flex-1 flex items-center justify-center transition-[opacity,transform] duration-700 delay-150 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="relative w-full max-w-md">
          <div className="bg-white border border-[#14b8a6]/20 rounded-3xl p-6 shadow-xl">
            <img src={feature.img} alt={feature.title} className="w-full h-auto" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="overflow-x-hidden">

      {/* ── Hero ── */}
      <section className="relative bg-[#063530] overflow-hidden">
        {/* Full-bleed background layer — breaks out of default-margin padding */}
        <div aria-hidden className="absolute inset-0 -left-4 -right-4 md:-left-12 md:-right-12">
          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: 'radial-gradient(circle, #14b8a6 1px, transparent 1px)', backgroundSize: '28px 28px' }}
          />
          {/* Radial glow */}
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-[#14b8a6]/20 blur-[120px] pointer-events-none" />
        </div>

        <div className="default-margin relative z-10 py-28 flex flex-col items-center text-center gap-8">
          {/* Badge */}
          <div className="animate-fade-in inline-flex items-center gap-2 bg-[#14b8a6]/15 border border-[#14b8a6]/30 text-[#14b8a6] text-sm font-semibold px-4 py-1.5 rounded-full tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14b8a6] animate-pulse inline-block" />
            Development 0.1 — now open
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up animation-delay-100 text-white m-0 max-w-3xl" style={{ fontSize: 'clamp(2.4rem, 6vw, 4.5rem)', lineHeight: 1.1 }}>
            One workspace for{' '}
            <span className="text-[#14b8a6]">everything</span>{' '}
            your team ships
          </h1>

          {/* Subline */}
          <p className="animate-fade-up animation-delay-200 text-[#a8d5d0] text-xl max-w-xl m-0 leading-relaxed">
            Dive is an opinionated WorkspaceOS — boards, time tracking, notes, and your whole team, finally in one place.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up animation-delay-300 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 bg-[#14b8a6] text-white px-7 py-3 rounded-full no-underline font-semibold hover:bg-[#0d9488] transition-colors text-base"
            >
              Get started free <ArrowRight size={16} />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 border border-white/20 text-white/80 px-7 py-3 rounded-full no-underline hover:bg-white/10 transition-colors text-base"
            >
              Log in
            </Link>
          </div>
        </div>

        {/* Bottom curve */}
        <div className="relative h-16 overflow-hidden">
          <svg viewBox="0 0 1440 64" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full" fill="#f0fdfb">
            <path d="M0,64 C360,0 1080,0 1440,64 L1440,64 L0,64 Z" />
          </svg>
        </div>
      </section>

      {/* ── Pillars ── */}
      <section className="default-margin py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((p, i) => (
            <div
              key={p.title}
              className={`animate-fade-up animation-delay-${(i + 1) * 100} bg-white border border-[#14b8a6]/15 rounded-2xl p-7 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="w-10 h-10 rounded-xl bg-[#14b8a6]/10 text-[#14b8a6] flex items-center justify-center">
                {p.icon}
              </div>
              <h3 className="m-0 text-[#063530]" style={{ fontSize: '1.25rem' }}>{p.title}</h3>
              <p className="m-0 text-[#666] leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="default-margin">
        <div className="border-t border-[#14b8a6]/15" />
      </div>

      {/* ── Feature sections ── */}
      <section className="default-margin py-20 flex flex-col gap-28">
        {features.map((f, i) => (
          <FeatureRow key={f.label} feature={f} index={i} />
        ))}
      </section>

      {/* ── CTA ── */}
      <section className="relative bg-[#063530] overflow-hidden">
        <div aria-hidden className="absolute inset-0 -left-4 -right-4 md:-left-12 md:-right-12">
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, #14b8a6 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
          <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[#14b8a6]/20 blur-[100px] pointer-events-none" />
        </div>

        <div className="default-margin relative z-10 py-28 flex flex-col items-center text-center gap-7">
          <h2 className="text-white m-0 max-w-2xl" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', lineHeight: 1.15 }}>
            Everything your team needs.<br />
            <span className="text-[#14b8a6]">Nothing it doesn&apos;t.</span>
          </h2>
          <p className="text-[#a8d5d0] text-lg max-w-md m-0">
            Dive is opinionated by design — spend less time configuring, more time shipping.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 bg-[#14b8a6] text-white px-8 py-3.5 rounded-full no-underline font-semibold hover:bg-[#0d9488] transition-colors text-lg"
          >
            Start for free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

    </div>
  )
}
