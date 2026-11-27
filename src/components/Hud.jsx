import { Cloud, Flame, Heart, Trophy } from 'lucide-react'
import { MAX_HEARTS, levelInfo } from '../lib/game'

export default function Hud({ xp, streak, hearts, heartPulse, xpFloats, unlockedCount, totalBadges, onOpenBadges }) {
  const lvl = levelInfo(xp)
  return (
    <header className="glass sticky top-0 z-40 border-x-0 border-t-0">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-azure to-cyan shadow-lg shadow-azure/30">
            <Cloud className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-extrabold tracking-tight text-white">AZ-900 Cloud Quest</p>
            <p className="text-[11px] font-medium text-slate-400">Azure Fundamentals</p>
          </div>
        </div>

        <div className="order-last flex min-w-[220px] flex-1 items-center gap-3 sm:order-none">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-amber/70 bg-amber/10 text-sm font-extrabold text-amber">
            {lvl.level}
          </div>
          <div className="relative flex-1">
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="font-bold text-white">{lvl.title}</span>
              <span className="font-semibold text-slate-400">
                {lvl.next ? `${lvl.intoLevel} / ${lvl.span} XP` : `${xp} XP · Max level`}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-700/70" role="progressbar" aria-valuenow={Math.round(lvl.pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Level progress">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber to-yellow-300 transition-[width] duration-700 ease-out"
                style={{ width: `${lvl.pct}%` }}
              />
            </div>
            {xpFloats.map((f) => (
              <span key={f.id} className="xp-float pointer-events-none absolute left-1/2 top-0 whitespace-nowrap text-sm font-extrabold text-amber drop-shadow">
                +{f.amount} XP
              </span>
            ))}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-800/80 px-3 py-1.5" title="Daily streak">
            <Flame className={`h-5 w-5 ${streak > 0 ? 'flame fill-orange-500 text-orange-400' : 'text-slate-500'}`} />
            <span className={`text-sm font-extrabold ${streak > 0 ? 'text-orange-300' : 'text-slate-400'}`}>{streak}</span>
          </div>

          <div className={`flex items-center gap-0.5 rounded-xl bg-slate-800/80 px-2.5 py-1.5 ${heartPulse ? 'heart-pulse' : ''}`} title={`${hearts} of ${MAX_HEARTS} hearts`} aria-label={`${hearts} of ${MAX_HEARTS} hearts`}>
            {Array.from({ length: MAX_HEARTS }, (_, i) => (
              <Heart
                key={i}
                className={`h-4 w-4 transition-colors duration-300 ${i < hearts ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`}
              />
            ))}
          </div>

          <button
            onClick={onOpenBadges}
            className="relative flex items-center gap-1.5 rounded-xl bg-amber/15 px-3 py-1.5 text-amber transition hover:bg-amber/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber"
            aria-label="Open badges"
          >
            <Trophy className="h-5 w-5" />
            <span className="text-sm font-extrabold">
              {unlockedCount}/{totalBadges}
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
