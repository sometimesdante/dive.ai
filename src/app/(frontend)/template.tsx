'use client'
import { motion } from 'motion/react'

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      {/* Film grain texture */}
      <motion.div
        initial={{ opacity: 0.2 }}
        animate={{ opacity: 0 }}
        exit={{ opacity: 0.2 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 10000,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' /%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'soft-light',
        }}
      />

      {/* Frosted glass layer */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        exit={{ opacity: 1 }}
        transition={{
          duration: 0.5,
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 9999,
          backdropFilter: 'blur(60px) saturate(200%) brightness(1.1)',
          WebkitBackdropFilter: 'blur(60px) saturate(200%) brightness(1.1)',
          background:
            'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))',
          boxShadow: 'inset 0 0 100px rgba(255, 255, 255, 0.05)',
        }}
      />

      {/* Content */}
      <motion.div
        initial={{
          opacity: 0,
          filter: 'blur(25px) brightness(1.15)',
        }}
        animate={{
          opacity: 1,
          filter: 'blur(0px) brightness(1)',
        }}
        exit={{
          opacity: 0,
          filter: 'blur(25px) brightness(1.15)',
        }}
        transition={{
          duration: 0.4,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}
