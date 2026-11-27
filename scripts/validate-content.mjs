// Checks the flashcard and question data for structural errors and duplicates.
// Run with: npm run validate
import { readFileSync } from 'node:fs'

const load = (p) => JSON.parse(readFileSync(new URL(`../src/data/${p}`, import.meta.url), 'utf8'))
const domains = load('domains.json').map((d) => d.id)
const cards = domains.flatMap((d) => load(`flashcards/${d}.json`))
const questions = domains.flatMap((d) => load(`questions/${d}.json`))

const errors = []
const warnings = []
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
const words = (s) => new Set(norm(s).split(' ').filter((w) => w.length > 3))
const similarity = (a, b) => {
  const A = words(a), B = words(b)
  const inter = [...A].filter((w) => B.has(w)).length
  return inter / Math.max(1, Math.min(A.size, B.size))
}

const seenIds = new Set()
const checkId = (id) => {
  if (!id) errors.push('Item without id')
  else if (seenIds.has(id)) errors.push(`Duplicate id ${id}`)
  seenIds.add(id)
}

const terms = new Map()
for (const c of cards) {
  checkId(c.id)
  if (!domains.includes(c.domain)) errors.push(`${c.id}: unknown domain ${c.domain}`)
  for (const f of ['term', 'definition', 'analogy']) if (!c[f]?.trim()) errors.push(`${c.id}: missing ${f}`)
  const t = norm(c.term)
  if (terms.has(t)) errors.push(`${c.id}: duplicate term of ${terms.get(t)}`)
  terms.set(t, c.id)
}

const texts = new Map()
for (const q of questions) {
  checkId(q.id)
  if (!domains.includes(q.domain)) errors.push(`${q.id}: unknown domain ${q.domain}`)
  if (!q.question?.trim() || !q.explanation?.trim()) errors.push(`${q.id}: missing question or explanation`)
  if (!Array.isArray(q.options) || q.options.length !== 4) errors.push(`${q.id}: needs exactly 4 options`)
  else if (new Set(q.options.map(norm)).size !== 4) errors.push(`${q.id}: options are not unique`)
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= (q.options?.length ?? 0)) errors.push(`${q.id}: answer index out of range`)
  if (!Array.isArray(q.tags)) errors.push(`${q.id}: tags must be an array`)
  const t = norm(q.question)
  if (texts.has(t)) errors.push(`${q.id}: duplicate question text of ${texts.get(t)}`)
  texts.set(t, q.id)
}

// Flag near-duplicates (same correct answer and very similar wording) for a human to review.
for (let i = 0; i < questions.length; i++) {
  for (let j = i + 1; j < questions.length; j++) {
    const a = questions[i], b = questions[j]
    if (norm(a.options[a.answer]) === norm(b.options[b.answer]) && similarity(a.question, b.question) >= 0.7) {
      warnings.push(`${a.id} and ${b.id} look similar`)
    }
  }
}

const count = (arr) => Object.fromEntries(domains.map((d) => [d, arr.filter((x) => x.domain === d).length]))
console.log(`Flashcards: ${cards.length}`, count(cards))
console.log(`Questions:  ${questions.length}`, count(questions))
console.log(`Security-tagged questions: ${questions.filter((q) => q.tags.includes('security')).length}`)
warnings.forEach((w) => console.warn(`warning: ${w}`))
if (errors.length) {
  errors.forEach((e) => console.error(`error: ${e}`))
  process.exit(1)
}
console.log('Content OK')
