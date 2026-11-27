import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowRight, BatteryCharging, BookOpen, CheckCircle2, Flame, Heart, HeartCrack, HelpCircle, LayoutDashboard, RefreshCw, Target, Trophy, XCircle, Zap,
} from 'lucide-react'
import { ROUND_SIZES, XP_CORRECT, XP_PERFECT_ROUND, buildRound, canRechargeToday, questions } from '../lib/game'
import { DOMAIN_STYLES } from './icons'

const LETTERS = ['A', 'B', 'C', 'D']

export default function QuizArena({ state, domain, roundSize, onRoundSize, active, onAnswer, onRoundEnd, onRecharge, onGoFlashcards, onCelebrate, onExit }) {
  const [round, setRound] = useState(null)
  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [results, setResults] = useState([])
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [finished, setFinished] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)
  const [pop, setPop] = useState(null)
  const stateRef = useRef(state)
  stateRef.current = state

  const start = useCallback(() => {
    setRound(buildRound(stateRef.current, domain, roundSize))
    setQIndex(0)
    setSelected(null)
    setResults([])
    setCombo(0)
    setBestCombo(0)
    setFinished(false)
  }, [domain, roundSize])

  useEffect(() => {
    start()
  }, [start])

  const q = round?.[qIndex]
  const answered = selected !== null
  const outOfHearts = state.hearts === 0

  const choose = useCallback(
    (i) => {
      if (!q || answered || finished) return
      const correct = i === q.answer
      const nextCombo = correct ? combo + 1 : 0
      setSelected(i)
      setCombo(nextCombo)
      setBestCombo((b) => Math.max(b, nextCombo))
      setResults((r) => [...r, { q, chosen: i, correct }])
      if (correct) setPop({ id: Date.now(), index: i })
      else setShakeKey((k) => k + 1)
      onAnswer(q.id, correct, nextCombo)
    },
    [q, answered, finished, combo, onAnswer],
  )

  const finish = useCallback(() => {
    const correct = results.filter((r) => r.correct).length
    setFinished(true)
    onRoundEnd(correct, results.length)
    if (results.length > 0 && correct / results.length >= 0.8) onCelebrate()
  }, [results, onRoundEnd, onCelebrate])

  const next = useCallback(() => {
    if (!answered) return
    if (qIndex + 1 >= round.length || stateRef.current.hearts === 0) {
      finish()
    } else {
      setQIndex((i) => i + 1)
      setSelected(null)
    }
  }, [answered, qIndex, round, finish])

  useEffect(() => {
    if (!active || finished || !q) return
    const onKey = (e) => {
      const n = ['1', '2', '3', '4'].indexOf(e.key)
      const l = LETTERS.indexOf(e.key.toUpperCase())
      if (n >= 0 && n < q.options.length) choose(n)
      else if (l >= 0 && l < q.options.length && e.key.length === 1) choose(l)
      else if (e.key === 'Enter' && answered) {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, finished, q, answered, choose, next])

  if (!round) return null

  // Out of hearts before the round has really started (or between rounds).
  if (outOfHearts && !answered && !finished) {
    return <OutOfHearts state={state} onRecharge={onRecharge} onGoFlashcards={onGoFlashcards} />
  }

  if (finished) {
    return (
      <RoundSummary
        results={results}
        total={round.length}
        bestCombo={bestCombo}
        hearts={state.hearts}
        onRetry={start}
        onExit={onExit}
        picker={<RoundPicker domain={domain} state={state} roundSize={roundSize} onRoundSize={onRoundSize} locked={false} />}
        onGoFlashcards={onGoFlashcards}
      />
    )
  }

  const style = DOMAIN_STYLES[q.domain]
  const DomainIcon = style.icon
  const isLast = qIndex + 1 >= round.length || (answered && state.hearts === 0)

  return (
    <div className="mx-auto max-w-3xl">
      <RoundPicker domain={domain} state={state} roundSize={roundSize} onRoundSize={onRoundSize} locked={results.length > 0} />
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-400">
          Question <span className="text-white">{qIndex + 1}</span> of {round.length}
        </span>
        <span className={`flex items-center gap-1 font-bold transition ${combo >= 2 ? 'text-orange-300' : 'text-slate-500'}`}>
          <Zap className="h-4 w-4" /> Combo x{combo}
        </span>
      </div>
      {round.length > 40 ? (
        <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-slate-700/70">
          <div className="h-full rounded-full bg-gradient-to-r from-azure to-cyan transition-[width] duration-500" style={{ width: `${(results.length / round.length) * 100}%` }} />
        </div>
      ) : (
      <div className="mb-5 flex gap-1.5">
        {round.map((_, i) => {
          const r = results[i]
          return (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                r ? (r.correct ? 'bg-emerald' : 'bg-rose-500') : i === qIndex ? 'bg-cyan' : 'bg-slate-700/70'
              }`}
            />
          )
        })}
      </div>
      )}

      <div key={shakeKey} className={`glass rounded-3xl p-6 shadow-2xl shadow-black/30 sm:p-7 ${shakeKey && answered && selected !== q.answer ? 'shake' : ''}`}>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${style.chip}`}>
          <DomainIcon className="h-3.5 w-3.5" /> {style.label}
        </span>
        <h3 className="mt-4 text-lg font-bold leading-relaxed text-white sm:text-xl">{q.question}</h3>

        <div className="mt-5 space-y-2.5">
          {q.options.map((opt, i) => {
            const isCorrect = i === q.answer
            const isChosen = i === selected
            let cls = 'border-slate-600/60 bg-slate-800/50 hover:border-azure hover:bg-azure/10'
            if (answered) {
              if (isCorrect) cls = 'border-emerald bg-emerald/15 ring-1 ring-emerald/50'
              else if (isChosen) cls = 'border-rose-500 bg-rose-500/15'
              else cls = 'border-slate-700/50 bg-slate-800/30 opacity-60'
            }
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                disabled={answered}
                className={`relative flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition duration-200 ${cls} ${!answered ? 'active:scale-[0.99]' : ''}`}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-extrabold ${
                    answered && isCorrect ? 'bg-emerald text-white' : answered && isChosen ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {LETTERS[i]}
                </span>
                <span className="flex-1 text-[15px] font-medium text-slate-100">{opt}</span>
                {answered && isCorrect && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald" />}
                {answered && isChosen && !isCorrect && <XCircle className="h-5 w-5 shrink-0 text-rose-400" />}
                {pop && pop.index === i && isChosen && isCorrect && (
                  <span key={pop.id} className="xp-float pointer-events-none absolute left-1/2 top-0 text-lg font-extrabold text-emerald drop-shadow">
                    +{XP_CORRECT} XP
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {answered && (
          <div className="pop-in mt-5">
            <div className={`rounded-2xl border p-4 ${selected === q.answer ? 'border-emerald/40 bg-emerald/10' : 'border-amber/40 bg-amber/10'}`}>
              <p className={`mb-1.5 flex items-center gap-2 font-extrabold ${selected === q.answer ? 'text-emerald' : 'text-amber'}`}>
                <HelpCircle className="h-4 w-4" /> Why?
                {selected === q.answer ? (
                  <span className="ml-auto text-sm">Correct · +{XP_CORRECT} XP</span>
                ) : (
                  <span className="ml-auto flex items-center gap-1 text-sm text-rose-300">
                    <HeartCrack className="h-4 w-4" /> -1 Heart
                  </span>
                )}
              </p>
              <p className="text-sm leading-relaxed text-slate-200">{q.explanation}</p>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="hidden text-xs text-slate-500 sm:block">Press Enter to continue</span>
              <button
                onClick={next}
                autoFocus
                className="ml-auto flex items-center gap-2 rounded-xl bg-azure px-5 py-2.5 font-bold text-white shadow-lg shadow-azure/30 transition hover:bg-sky-600"
              >
                {isLast ? 'See results' : 'Next question'} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      {!answered && <p className="mt-4 text-center text-xs text-slate-500">Keys 1–4 or A–D to answer</p>}
    </div>
  )
}

function OutOfHearts({ state, onRecharge, onGoFlashcards }) {
  const canRecharge = canRechargeToday(state)
  return (
    <div className="glass pop-in mx-auto max-w-xl rounded-3xl p-8 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-rose-500/15">
        <HeartCrack className="h-8 w-8 text-rose-400" />
      </div>
      <h3 className="text-2xl font-extrabold text-white">Out of hearts!</h3>
      <p className="mt-2 text-slate-400">Your quiz energy is depleted. Review flashcards to earn hearts back, or use your free daily recharge.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          onClick={onGoFlashcards}
          className="flex flex-col items-center gap-1 rounded-2xl border border-cyan/40 bg-cyan/10 px-4 py-4 text-cyan transition hover:bg-cyan/20"
        >
          <BookOpen className="h-6 w-6" />
          <span className="font-bold">Practice Flashcards to Restore</span>
          <span className="text-xs text-slate-400">Every 3 cards restores 1 heart</span>
        </button>
        <button
          onClick={onRecharge}
          disabled={!canRecharge}
          className="flex flex-col items-center gap-1 rounded-2xl border border-emerald/40 bg-emerald/10 px-4 py-4 text-emerald transition hover:bg-emerald/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800/40 disabled:text-slate-500"
        >
          <BatteryCharging className="h-6 w-6" />
          <span className="font-bold">Recharge</span>
          <span className="text-xs text-slate-400">{canRecharge ? 'Refill all 5 hearts (once per day)' : 'Used today, back tomorrow'}</span>
        </button>
      </div>
    </div>
  )
}

function RoundSummary({ results, total, bestCombo, hearts, onRetry, onExit, onGoFlashcards, picker }) {
  const correct = results.filter((r) => r.correct).length
  const answered = results.length
  const accuracy = answered ? Math.round((correct / answered) * 100) : 0
  const perfect = answered === total && correct === total
  const xp = correct * XP_CORRECT + (perfect ? XP_PERFECT_ROUND : 0)
  const endedEarly = answered < total

  const verdict = perfect
    ? { title: 'Flawless deployment!', text: 'A perfect round. You earned the perfect-round bonus.', icon: Trophy, cls: 'text-amber bg-amber/15' }
    : accuracy >= 80
      ? { title: 'Exam ready!', text: 'Strong work. You are scoring above the AZ-900 pass mark.', icon: Target, cls: 'text-emerald bg-emerald/15' }
      : accuracy >= 50
        ? { title: 'Good progress', text: 'Review the explanations below and try again.', icon: Flame, cls: 'text-cyan bg-cyan/15' }
        : { title: 'Keep practicing', text: 'Flashcards are a great way to strengthen these topics.', icon: BookOpen, cls: 'text-sky-300 bg-azure/20' }

  return (
    <div className="pop-in mx-auto max-w-3xl">
      <div className="glass rounded-3xl p-7 text-center">
        <div className={`mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl ${verdict.cls}`}>
          <verdict.icon className="h-8 w-8" />
        </div>
        <h3 className="text-2xl font-extrabold text-white">{verdict.title}</h3>
        <p className="mt-1 text-slate-400">{verdict.text}</p>
        {endedEarly && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3 py-1 text-sm font-semibold text-rose-300">
            <HeartCrack className="h-4 w-4" /> Round ended early: out of hearts
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Score" value={`${correct}/${total}`} cls="text-white" />
          <Stat label="Accuracy" value={`${accuracy}%`} cls={accuracy >= 80 ? 'text-emerald' : accuracy >= 50 ? 'text-cyan' : 'text-rose-300'} />
          <Stat label="XP earned" value={`+${xp}`} cls="text-amber" />
          <Stat label="Best combo" value={`x${bestCombo}`} cls="text-orange-300" />
        </div>

        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-700/70">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald to-cyan transition-[width] duration-1000" style={{ width: `${accuracy}%` }} />
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {hearts > 0 ? (
            <button onClick={onRetry} className="flex items-center gap-2 rounded-xl bg-azure px-5 py-2.5 font-bold text-white shadow-lg shadow-azure/30 transition hover:bg-sky-600">
              <RefreshCw className="h-4 w-4" /> Play another round
            </button>
          ) : (
            <button onClick={onGoFlashcards} className="flex items-center gap-2 rounded-xl bg-cyan px-5 py-2.5 font-bold text-slate-900 transition hover:bg-cyan/80">
              <Heart className="h-4 w-4" /> Restore hearts with flashcards
            </button>
          )}
          <button onClick={onExit} className="flex items-center gap-2 rounded-xl border border-slate-600 px-5 py-2.5 font-bold text-slate-200 transition hover:bg-slate-700/60">
            <LayoutDashboard className="h-4 w-4" /> Back to dashboard
          </button>
        </div>
      </div>

      <div className="mt-6">{picker}</div>

      <h4 className="mb-3 mt-8 text-sm font-bold uppercase tracking-wide text-slate-400">Round review</h4>
      <div className="space-y-2.5">
        {results.map(({ q, chosen, correct: ok }) => (
          <details key={q.id} className="glass group rounded-2xl p-4">
            <summary className="flex cursor-pointer list-none items-start gap-3">
              {ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />}
              <span className="text-sm font-medium text-slate-200">{q.question}</span>
            </summary>
            <div className="mt-3 space-y-1.5 pl-8 text-sm">
              {!ok && <p className="text-rose-300">Your answer: {q.options[chosen]}</p>}
              <p className="text-emerald">Correct answer: {q.options[q.answer]}</p>
              <p className="leading-relaxed text-slate-400">{q.explanation}</p>
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value, cls }) {
  return (
    <div className="rounded-2xl bg-slate-900/50 p-3">
      <p className={`text-2xl font-extrabold ${cls}`}>{value}</p>
      <p className="text-xs font-medium text-slate-400">{label}</p>
    </div>
  )
}

function RoundPicker({ domain, state, roundSize, onRoundSize, locked }) {
  const pool = questions.filter((q) => !domain || q.domain === domain)
  const solved = pool.filter((q) => state.correctIds[q.id]).length
  return (
    <div className="glass mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
      <p className="text-sm text-slate-300">
        <span className="font-bold text-white">{pool.length}</span> questions in this bank ·{' '}
        <span className="font-bold text-emerald">{solved}</span> solved
      </p>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-400">Round length</span>
        <div className="flex rounded-xl bg-slate-900/60 p-0.5" role="group" aria-label="Round length">
          {ROUND_SIZES.map((n) => {
            const label = n === 0 ? `All ${pool.length}` : n
            const activeSize = roundSize === n
            return (
              <button
                key={n}
                onClick={() => onRoundSize(n)}
                disabled={locked && !activeSize}
                title={locked && !activeSize ? 'Finish this round to change the length' : undefined}
                aria-pressed={activeSize}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  activeSize ? 'bg-azure text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
