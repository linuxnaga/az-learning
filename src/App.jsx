import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { ArrowRight, Award, BookOpen, Clock, LayoutDashboard, Layers, Swords, Trophy } from 'lucide-react'
import Hud from './components/Hud'
import BadgesModal from './components/BadgesModal'
import Flashcards from './components/Flashcards'
import QuizArena from './components/QuizArena'
import Confetti from './components/Confetti'
import { BADGE_ICONS, DOMAIN_STYLES } from './components/icons'
import {
  BADGES, MAX_HEARTS, activeStreak, domainProgress, domains, dueCount, flashcards, levelInfo, loadState, questions, reducer, saveState,
} from './lib/game'

const MODES = [
  { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
  { id: 'quiz', label: 'Quiz Arena', icon: Swords },
]

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)
  const [mode, setMode] = useState('home')
  const [domain, setDomain] = useState(null)
  const [badgesOpen, setBadgesOpen] = useState(false)
  const [xpFloats, setXpFloats] = useState([])
  const [toasts, setToasts] = useState([])
  const [confetti, setConfetti] = useState(0)
  const [heartPulse, setHeartPulse] = useState(false)
  const prev = useRef(state)

  useEffect(() => saveState(state), [state])

  const celebrate = useCallback(() => setConfetti(Date.now()), [])

  const pushToast = useCallback((toast) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { ...toast, id }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])

  // React to state changes: XP popups, heart pulses, badge and level-up celebrations.
  useEffect(() => {
    const before = prev.current
    prev.current = state
    if (before === state) return

    const gained = state.xp - before.xp
    if (gained > 0) {
      const id = Date.now() + Math.random()
      setXpFloats((f) => [...f, { id, amount: gained }])
      setTimeout(() => setXpFloats((f) => f.filter((x) => x.id !== id)), 1300)
    }
    if (state.hearts !== before.hearts) {
      setHeartPulse(true)
      setTimeout(() => setHeartPulse(false), 500)
    }
    const newBadges = BADGES.filter((b) => state.badges[b.id] && !before.badges[b.id])
    newBadges.forEach((b) => pushToast({ kind: 'badge', title: 'Badge unlocked!', text: b.name, icon: b.icon }))
    const lvlBefore = levelInfo(before.xp).level
    const lvlNow = levelInfo(state.xp)
    if (lvlNow.level > lvlBefore) pushToast({ kind: 'level', title: `Level ${lvlNow.level} reached!`, text: lvlNow.title, icon: 'Award' })
    if (newBadges.length || lvlNow.level > lvlBefore) celebrate()
  }, [state, pushToast, celebrate])

  const onRate = useCallback((id, rating) => dispatch({ type: 'RATE_CARD', id, rating }), [])
  const onAnswer = useCallback((id, correct, combo) => dispatch({ type: 'ANSWER', id, correct, combo }), [])
  const onRoundEnd = useCallback((correct, total) => dispatch({ type: 'ROUND_END', correct, total }), [])
  const onRecharge = useCallback(() => dispatch({ type: 'RECHARGE' }), [])
  const onReset = useCallback(() => {
    dispatch({ type: 'RESET' })
    setMode('home')
  }, [])
  const closeBadges = useCallback(() => setBadgesOpen(false), [])

  const switchMode = useCallback((m) => {
    setMode(m)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const streak = activeStreak(state.streak)
  const unlockedCount = Object.keys(state.badges).length

  return (
    <div className="min-h-screen pb-16">
      <Hud
        xp={state.xp}
        streak={streak}
        hearts={state.hearts}
        heartPulse={heartPulse}
        xpFloats={xpFloats}
        unlockedCount={unlockedCount}
        totalBadges={BADGES.length}
        onOpenBadges={() => setBadgesOpen(true)}
      />

      <main className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        {/* Mode switcher + domain filter */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <nav className="glass flex w-full rounded-2xl p-1 sm:inline-flex sm:w-auto sm:self-start" aria-label="Learning mode">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => switchMode(m.id)}
                aria-current={mode === m.id ? 'page' : undefined}
                className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-2.5 py-2 text-sm font-bold transition sm:flex-none sm:px-4 ${
                  mode === m.id ? 'bg-azure text-white shadow-lg shadow-azure/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                <m.icon className="h-4 w-4" /> {m.label}
              </button>
            ))}
          </nav>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by exam domain">
            <DomainChip active={domain === null} onClick={() => setDomain(null)} label="All Domains" />
            {domains.map((d) => (
              <DomainChip key={d.id} active={domain === d.id} onClick={() => setDomain(d.id)} label={DOMAIN_STYLES[d.id].label} weight={d.weight} icon={DOMAIN_STYLES[d.id].icon} />
            ))}
          </div>
        </div>

        {mode === 'home' && <Dashboard state={state} domain={domain} streak={streak} onMode={switchMode} onOpenBadges={() => setBadgesOpen(true)} />}
        {mode === 'flashcards' && <Flashcards state={state} domain={domain} active={!badgesOpen} onRate={onRate} />}
        {mode === 'quiz' && (
          <QuizArena
            state={state}
            domain={domain}
            active={!badgesOpen}
            onAnswer={onAnswer}
            onRoundEnd={onRoundEnd}
            onRecharge={onRecharge}
            onGoFlashcards={() => switchMode('flashcards')}
            onCelebrate={celebrate}
            onExit={() => switchMode('home')}
          />
        )}
      </main>

      <BadgesModal open={badgesOpen} onClose={closeBadges} unlocked={state.badges} stats={state.stats} onReset={onReset} />
      <Confetti burst={confetti} />

      <div className="pointer-events-none fixed left-1/2 top-20 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4" aria-live="polite">
        {toasts.map((t) => {
          const Icon = BADGE_ICONS[t.icon] ?? Award
          return (
            <div key={t.id} className="toast-in glass pointer-events-auto flex items-center gap-3 rounded-2xl border-amber/40 p-3.5 shadow-2xl">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber to-yellow-400 text-slate-900">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-amber">{t.title}</p>
                <p className="font-bold text-white">{t.text}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DomainChip({ active, onClick, label, weight, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
        active ? 'border-cyan bg-cyan/15 text-cyan' : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-500 hover:text-white'
      }`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
      {weight && <span className="font-semibold opacity-70">{weight}</span>}
    </button>
  )
}

function Dashboard({ state, domain, streak, onMode, onOpenBadges }) {
  const lvl = levelInfo(state.xp)
  const overall = domainProgress(state, domain)
  const due = dueCount(state, domain)
  const cardCount = flashcards.filter((c) => !domain || c.domain === domain).length
  const qCount = questions.filter((q) => !domain || q.domain === domain).length
  const accuracy = state.stats.questionsAnswered ? Math.round((state.stats.correctAnswers / state.stats.questionsAnswered) * 100) : 0
  const recent = BADGES.filter((b) => state.badges[b.id]).sort((a, b) => state.badges[b.id] - state.badges[a.id]).slice(0, 4)

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section className="glass relative overflow-hidden rounded-3xl p-7">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-azure/30 blur-3xl" />
          <p className="text-sm font-bold uppercase tracking-wide text-cyan">Level {lvl.level} · {lvl.title}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {state.stats.cardsReviewed + state.stats.questionsAnswered === 0 ? 'Start your journey to AZ-900' : 'Welcome back, cloud learner'}
          </h1>
          <p className="mt-2 max-w-xl text-slate-400">
            {lvl.next
              ? `${lvl.next.xp - state.xp} XP until ${lvl.next.title}. ${streak > 0 ? `You're on a ${streak}-day streak, keep it alive!` : 'Study today to start a streak.'}`
              : 'You have reached the top level. Keep your knowledge fresh with spaced repetition.'}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="Total XP" value={state.xp} cls="text-amber" />
            <MiniStat label="Day streak" value={streak} cls="text-orange-300" />
            <MiniStat label="Hearts" value={`${state.hearts}/${MAX_HEARTS}`} cls="text-rose-300" />
            <MiniStat label="Quiz accuracy" value={`${accuracy}%`} cls="text-emerald" />
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <ModeCard
            onClick={() => onMode('flashcards')}
            icon={BookOpen}
            accent="from-cyan/25 to-azure/10 border-cyan/30"
            iconCls="bg-cyan/20 text-cyan"
            title="Spaced-Repetition Flashcards"
            text={`${cardCount} cards · 3D flip · rate Hard, Good or Mastered to schedule reviews.`}
            meta={
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> {due} due now
              </span>
            }
          />
          <ModeCard
            onClick={() => onMode('quiz')}
            icon={Swords}
            accent="from-azure/30 to-emerald/10 border-azure/40"
            iconCls="bg-azure/25 text-sky-300"
            title="Gamified Quiz Arena"
            text={`${qCount} exam-style scenario questions · +25 XP each · lose a heart when wrong.`}
            meta={<span>{state.hearts > 0 ? `${state.hearts} hearts ready` : 'Out of hearts: recharge first'}</span>}
          />
        </div>
      </div>

      <aside className="space-y-6">
        <section className="glass rounded-3xl p-6">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-extrabold text-white">Domain progress</h2>
            <span className="text-sm font-bold text-cyan">{overall.pct}%</span>
          </div>
          <div className="space-y-4">
            {domains.map((d) => {
              const p = domainProgress(state, d.id)
              const s = DOMAIN_STYLES[d.id]
              return (
                <div key={d.id} className={domain && domain !== d.id ? 'opacity-50' : ''}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                      <s.icon className="h-4 w-4" /> {d.name}
                    </span>
                    <span className="whitespace-nowrap text-xs text-slate-500">{d.weight}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-700/70">
                    <div className={`h-full rounded-full ${s.bar} transition-[width] duration-700`} style={{ width: `${p.pct}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {p.mastered}/{p.cards} cards mastered · {p.correct}/{p.questions} questions solved
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="glass rounded-3xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-extrabold text-white">Recent badges</h2>
            <button onClick={onOpenBadges} className="flex items-center gap-1 text-xs font-bold text-amber hover:underline">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          {recent.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <Trophy className="h-4 w-4" /> No badges yet. Answer a question to earn "First Deployment".
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {recent.map((b) => {
                const Icon = BADGE_ICONS[b.icon]
                return (
                  <div key={b.id} title={b.name} className="grid aspect-square place-items-center rounded-2xl bg-gradient-to-br from-amber to-yellow-400 text-slate-900 shadow-lg shadow-amber/20">
                    <Icon className="h-6 w-6" />
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </aside>
    </div>
  )
}

function MiniStat({ label, value, cls }) {
  return (
    <div className="rounded-2xl bg-slate-900/50 p-3">
      <p className={`text-2xl font-extrabold ${cls}`}>{value}</p>
      <p className="text-xs font-medium text-slate-400">{label}</p>
    </div>
  )
}

function ModeCard({ onClick, icon: Icon, accent, iconCls, title, text, meta }) {
  return (
    <button
      onClick={onClick}
      className={`group flex flex-col rounded-3xl border bg-gradient-to-br p-6 text-left transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-azure/20 ${accent}`}
    >
      <div className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl ${iconCls}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-extrabold text-white">{title}</h3>
      <p className="mt-1 flex-1 text-sm text-slate-400">{text}</p>
      <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-300">
        {meta}
        <span className="flex items-center gap-1 text-cyan">
          Start <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </span>
      </div>
    </button>
  )
}
