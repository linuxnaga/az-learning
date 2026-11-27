import { useEffect, useState } from 'react'
import { Lock, RotateCcw, Trophy, X } from 'lucide-react'
import { BADGES } from '../lib/game'
import { BADGE_ICONS } from './icons'

export default function BadgesModal({ open, onClose, unlocked, stats, onReset }) {
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    if (!open) return
    setConfirmReset(false)
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  const count = Object.keys(unlocked).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="badges-title"
        className="glass pop-in max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber/15">
              <Trophy className="h-6 w-6 text-amber" />
            </div>
            <div>
              <h2 id="badges-title" className="text-xl font-extrabold text-white">Achievements</h2>
              <p className="text-sm text-slate-400">
                {count} of {BADGES.length} unlocked
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-700/60 hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-700/70">
          <div className="h-full rounded-full bg-gradient-to-r from-amber to-yellow-300 transition-[width] duration-700" style={{ width: `${(count / BADGES.length) * 100}%` }} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BADGES.map((b) => {
            const Icon = BADGE_ICONS[b.icon]
            const at = unlocked[b.id]
            return (
              <div
                key={b.id}
                className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
                  at ? 'border-amber/40 bg-amber/10' : 'border-slate-700/60 bg-slate-900/40'
                }`}
              >
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${at ? 'bg-gradient-to-br from-amber to-yellow-400 text-slate-900 shadow-lg shadow-amber/30' : 'bg-slate-800 text-slate-500'}`}>
                  {at ? <Icon className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <p className={`font-bold ${at ? 'text-white' : 'text-slate-300'}`}>{b.name}</p>
                  <p className="text-xs leading-relaxed text-slate-400">{b.description}</p>
                  {at && <p className="mt-1 text-[11px] font-semibold text-amber">Unlocked {new Date(at).toLocaleDateString()}</p>}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          {[
            ['Cards reviewed', stats.cardsReviewed],
            ['Questions answered', stats.questionsAnswered],
            ['Correct answers', stats.correctAnswers],
            ['Best combo', stats.bestCombo],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-slate-900/50 p-3">
              <p className="text-xl font-extrabold text-white">{value}</p>
              <p className="text-[11px] font-medium text-slate-400">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-700/60 pt-4">
          {confirmReset ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-300">Erase all XP, badges and progress?</span>
              <button onClick={() => setConfirmReset(false)} className="rounded-lg px-3 py-1.5 font-semibold text-slate-300 hover:bg-slate-700/60">Cancel</button>
              <button onClick={() => { onReset(); onClose() }} className="rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white hover:bg-rose-500">Reset</button>
            </div>
          ) : (
            <button onClick={() => setConfirmReset(true)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-400 hover:bg-slate-700/60 hover:text-white">
              <RotateCcw className="h-4 w-4" /> Reset progress
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
