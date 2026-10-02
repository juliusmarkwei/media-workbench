import { useRef, type PointerEvent, type ReactNode } from 'react'

interface TiltCardProps {
  children: ReactNode
  className?: string
  max?: number
}

export default function TiltCard({ children, className = '', max = 6 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`
  }

  const reset = () => {
    if (ref.current) ref.current.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)'
  }

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      style={{ transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)', transformStyle: 'preserve-3d' }}
      className={className}
    >
      {children}
    </div>
  )
}
