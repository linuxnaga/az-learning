import { useMemo } from 'react'

const COLORS = ['#0078D4', '#50E6FF', '#10B981', '#F59E0B', '#FFFFFF', '#A78BFA']

export default function Confetti({ burst }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        id: `${burst}-${i}`,
        left: Math.random() * 100,
        color: COLORS[i % COLORS.length],
        style: {
          '--drift': `${(Math.random() - 0.5) * 240}px`,
          '--spin': `${(Math.random() - 0.5) * 1440}deg`,
          '--dur': `${2.2 + Math.random() * 1.6}s`,
          '--delay': `${Math.random() * 0.4}s`,
        },
      })),
    [burst],
  )
  if (!burst) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span key={p.id} className="confetti-piece" style={{ ...p.style, left: `${p.left}%`, background: p.color }} />
      ))}
    </div>
  )
}
