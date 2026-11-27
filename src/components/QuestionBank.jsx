import { useMemo, useState } from 'react'
import { CheckCircle2, Circle, Search } from 'lucide-react'
import { questions } from '../lib/game'
import { DOMAIN_STYLES } from './icons'

const LETTERS = ['A', 'B', 'C', 'D']
const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unsolved', label: 'Not solved yet' },
  { id: 'solved', label: 'Solved' },
  { id: 'security', label: 'Security' },
]

/** Browse every question in the bank, with answers and explanations. */
export default function QuestionBank({ state, domain }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  const pool = useMemo(() => questions.filter((q) => !domain || q.domain === domain), [domain])
  const shown = useMemo(() => {
    const term = query.trim().toLowerCase()
    return pool.filter((q) => {
      if (filter === 'solved' && !state.correctIds[q.id]) return false
      if (filter === 'unsolved' && state.correctIds[q.id]) return false
      if (filter === 'security' && !q.tags.includes('security')) return false
      if (!term) return true
      return [q.question, q.explanation, ...q.options].some((t) => t.toLowerCase().includes(term))
    })
  }, [pool, query, filter, state.correctIds])

  const solved = pool.filter((q) => state.correctIds[q.id]).length

  return (
    <div className="mx-auto max-w-4xl">
      <div className="glass mb-5 rounded-3xl p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-extrabold text-white">Question Bank</h2>
          <p className="text-sm text-slate-400">
            <span className="font-bold text-white">{pool.length}</span> questions ·{' '}
            <span className="font-bold text-emerald">{solved}</span> solved
          </p>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions, answers or explanations"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan focus:outline-none"
            />
          </label>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter questions">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                  filter === f.id ? 'bg-azure text-white' : 'bg-slate-800/70 text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Showing {shown.length} of {pool.length}. Click a question to reveal the answer. Browsing doesn't earn XP; answer in the Quiz Arena to get credit.
        </p>
      </div>

      <ol className="space-y-2.5">
        {shown.map((q) => {
          const style = DOMAIN_STYLES[q.domain]
          const done = state.correctIds[q.id]
          return (
            <li key={q.id}>
              <details className="glass group rounded-2xl p-4">
                <summary className="flex cursor-pointer list-none items-start gap-3">
                  {done ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald" aria-label="Solved" />
                  ) : (
                    <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" aria-label="Not solved yet" />
                  )}
                  <div className="min-w-0 flex-1">
                    <span className={`mb-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${style.chip}`}>
                      <style.icon className="h-3 w-3" /> {style.label}
                    </span>
                    <p className="text-sm font-medium text-slate-100">{q.question}</p>
                  </div>
                </summary>
                <div className="mt-3 space-y-1.5 pl-8">
                  {q.options.map((opt, i) => (
                    <p
                      key={i}
                      className={`rounded-lg px-3 py-1.5 text-sm ${
                        i === q.answer ? 'bg-emerald/15 font-semibold text-emerald' : 'text-slate-400'
                      }`}
                    >
                      {LETTERS[i]}. {opt}
                    </p>
                  ))}
                  <p className="pt-1 text-sm leading-relaxed text-slate-300">
                    <span className="font-bold text-amber">Why? </span>
                    {q.explanation}
                  </p>
                </div>
              </details>
            </li>
          )
        })}
      </ol>
      {shown.length === 0 && <p className="py-10 text-center text-slate-500">No questions match.</p>}
    </div>
  )
}
