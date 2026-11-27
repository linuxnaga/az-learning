import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Heart, Keyboard, Lightbulb, RefreshCw, RotateCw, Sparkles, ThumbsUp, TimerReset } from 'lucide-react'
import { CARDS_PER_HEART, MAX_HEARTS, RATING_XP, buildDeck, isMastered } from '../lib/game'
import { DOMAIN_STYLES } from './icons'

const RATINGS = [
  { key: 'hard', label: 'Hard', hint: 'Review soon', shortcut: '1', icon: TimerReset, cls: 'border-rose-400/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20' },
  { key: 'good', label: 'Good', hint: 'Got it', shortcut: '2', icon: ThumbsUp, cls: 'border-azure/50 bg-azure/15 text-sky-300 hover:bg-azure/25' },
  { key: 'mastered', label: 'Mastered', hint: 'Know it cold', shortcut: '3', icon: CheckCircle2, cls: 'border-emerald/50 bg-emerald/15 text-emerald hover:bg-emerald/25' },
]

export default function Flashcards({ state, domain, active, onRate }) {
  const [queue, setQueue] = useState(() => buildDeck(state, domain))
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [session, setSession] = useState({ reviewed: 0, xp: 0 })
  const [pop, setPop] = useState(null)

  const restart = useCallback(() => {
    setQueue(buildDeck(state, domain))
    setIndex(0)
    setFlipped(false)
    setSession({ reviewed: 0, xp: 0 })
    // Only rebuild when the domain changes or the user asks, not on every rating.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain])

  useEffect(() => {
    restart()
  }, [restart])

  const card = queue[index]
  const done = !card

  const rate = useCallback(
    (rating) => {
      if (!card || !flipped) return
      onRate(card.id, rating)
      setSession((s) => ({ reviewed: s.reviewed + 1, xp: s.xp + RATING_XP[rating] }))
      setPop({ id: Date.now(), amount: RATING_XP[rating] })
      if (rating === 'hard') {
        // Show it again a few cards later in this session.
        setQueue((q) => {
          const next = [...q]
          next.splice(Math.min(next.length, index + 4), 0, card)
          return next
        })
      }
      setFlipped(false)
      // Wait for the card to turn back before swapping its content.
      setTimeout(() => setIndex((i) => i + 1), 220)
    },
    [card, flipped, index, onRate],
  )

  useEffect(() => {
    if (!active) return
    const onKey = (e) => {
      if (e.target instanceof HTMLElement && e.target.tagName === 'BUTTON') e.target.blur()
      if (e.code === 'Space') {
        e.preventDefault()
        if (card) setFlipped((f) => !f)
      } else if (['1', '2', '3'].includes(e.key)) {
        rate(RATINGS[Number(e.key) - 1].key)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, card, rate])

  if (done) {
    return (
      <div className="glass pop-in mx-auto flex max-w-xl flex-col items-center rounded-3xl p-10 text-center">
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-emerald/15">
          <Sparkles className="h-8 w-8 text-emerald" />
        </div>
        <h3 className="text-2xl font-extrabold text-white">Deck complete!</h3>
        <p className="mt-2 text-slate-400">
          You reviewed <span className="font-bold text-white">{session.reviewed}</span> cards and earned{' '}
          <span className="font-bold text-amber">+{session.xp} XP</span> this session.
        </p>
        <p className="mt-1 text-sm text-slate-500">Cards you rated Good or Mastered will come back later, spaced further apart each time.</p>
        <button onClick={restart} className="mt-6 flex items-center gap-2 rounded-xl bg-azure px-5 py-2.5 font-bold text-white shadow-lg shadow-azure/30 transition hover:bg-sky-600">
          <RefreshCw className="h-4 w-4" /> Study again
        </button>
      </div>
    )
  }

  const style = DOMAIN_STYLES[card.domain]
  const DomainIcon = style.icon
  const cs = state.cards[card.id]
  const progress = (index / queue.length) * 100

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-400">
          Card <span className="text-white">{index + 1}</span> of {queue.length}
        </span>
        <span className="font-semibold text-amber">+{session.xp} XP this session</span>
      </div>
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-slate-700/70">
        <div className="h-full rounded-full bg-gradient-to-r from-azure to-cyan transition-[width] duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="flip-scene">
        <div
          className={`flip-card h-[480px] cursor-pointer sm:h-[440px] ${flipped ? 'is-flipped' : ''}`}
          onClick={() => setFlipped((f) => !f)}
          role="button"
          tabIndex={0}
          aria-label={flipped ? 'Flip card to front' : 'Flip card to see definition'}
          aria-pressed={flipped}
          onKeyDown={(e) => e.key === 'Enter' && setFlipped((f) => !f)}
        >
          {/* Front */}
          <div className="flip-face glass flex flex-col rounded-3xl p-7 shadow-2xl shadow-black/30">
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${style.chip}`}>
                <DomainIcon className="h-3.5 w-3.5" /> {style.label}
              </span>
              {cs ? (
                <span className={`text-xs font-semibold ${isMastered(cs) ? 'text-emerald' : 'text-slate-400'}`}>
                  {isMastered(cs) ? 'Mastered' : `Box ${cs.box}`} · {cs.reviews} review{cs.reviews === 1 ? '' : 's'}
                </span>
              ) : (
                <span className="rounded-full bg-cyan/15 px-2 py-0.5 text-xs font-bold text-cyan">New</span>
              )}
            </div>
            <div className="flex flex-1 items-center justify-center px-2 text-center">
              <h3 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">{card.term}</h3>
            </div>
            <p className="flex items-center justify-center gap-2 text-sm font-medium text-slate-400">
              <RotateCw className="h-4 w-4" /> Click or press <kbd className="rounded-md bg-slate-700 px-1.5 py-0.5 text-xs text-white">Space</kbd> to flip
            </p>
          </div>

          {/* Back */}
          <div className="flip-face flip-back glass flex flex-col rounded-3xl p-6 shadow-2xl shadow-black/30">
            <div className="mb-3 flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${style.chip}`}>
                <DomainIcon className="h-3.5 w-3.5" /> {card.term}
              </span>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              <p className="text-[15px] leading-relaxed text-slate-200">{card.definition}</p>
              <div className="rounded-2xl border border-cyan/25 bg-cyan/5 p-3.5">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-cyan">
                  <Lightbulb className="h-3.5 w-3.5" /> Real-world Azure analogy
                </p>
                <p className="text-sm leading-relaxed text-slate-300">{card.analogy}</p>
              </div>
            </div>
            <div className="relative mt-4 grid grid-cols-3 gap-2">
              {RATINGS.map((r) => (
                <button
                  key={r.key}
                  onClick={(e) => {
                    e.stopPropagation()
                    rate(r.key)
                  }}
                  tabIndex={flipped ? 0 : -1}
                  className={`flex flex-col items-center rounded-xl border px-2 py-2.5 transition active:scale-95 ${r.cls}`}
                >
                  <span className="flex items-center gap-1.5 text-sm font-bold">
                    <r.icon className="h-4 w-4" /> {r.label}
                  </span>
                  <span className="text-[11px] opacity-80">
                    {r.hint} · +{RATING_XP[r.key]} XP
                  </span>
                  <kbd className="mt-1 hidden rounded bg-slate-900/60 px-1.5 text-[10px] text-slate-300 sm:block">{r.shortcut}</kbd>
                </button>
              ))}
            </div>
          </div>
        </div>
        {pop && (
          <div key={pop.id} className="relative h-0">
            <span className="xp-float pointer-events-none absolute left-1/2 -top-16 text-lg font-extrabold text-amber drop-shadow">+{pop.amount} XP</span>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <Keyboard className="h-4 w-4" /> Space flip · 1 Hard · 2 Good · 3 Mastered
        </span>
        {state.hearts < MAX_HEARTS && (
          <span className="flex items-center gap-1.5 font-semibold text-rose-300">
            <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
            {CARDS_PER_HEART - state.heartProgress} more card{CARDS_PER_HEART - state.heartProgress === 1 ? '' : 's'} to restore a heart
          </span>
        )}
      </div>
    </div>
  )
}
