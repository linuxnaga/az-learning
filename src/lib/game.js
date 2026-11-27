import content from '../data/content.json'

export const { domains, flashcards, questions } = content

export const STORAGE_KEY = 'az900-quest-v1'
export const MAX_HEARTS = 5
export const XP_CORRECT = 25
export const XP_PERFECT_ROUND = 50
export const CARDS_PER_HEART = 3
export const RATING_XP = { hard: 5, good: 10, mastered: 15 }

const DAY = 24 * 60 * 60 * 1000
// Leitner-style boxes: interval before a card is due again.
const BOX_INTERVALS = [0, 1 * DAY, 3 * DAY, 7 * DAY, 14 * DAY, 30 * DAY]
const MAX_BOX = BOX_INTERVALS.length - 1

export const LEVELS = [
  { level: 1, title: 'Cloud Novice', xp: 0 },
  { level: 2, title: 'Azure Apprentice', xp: 100 },
  { level: 3, title: 'Cloud Architect', xp: 250 },
  { level: 4, title: 'Solutions Engineer', xp: 500 },
  { level: 5, title: 'Azure Expert', xp: 850 },
  { level: 6, title: 'Cloud Champion', xp: 1300 },
  { level: 7, title: 'Azure Legend', xp: 1900 },
]

export function levelInfo(xp) {
  let idx = 0
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].xp) idx = i
  const current = LEVELS[idx]
  const next = LEVELS[idx + 1]
  if (!next) {
    return { ...current, next: null, intoLevel: xp - current.xp, span: 0, pct: 100 }
  }
  const span = next.xp - current.xp
  const intoLevel = xp - current.xp
  return { ...current, next, intoLevel, span, pct: Math.min(100, (intoLevel / span) * 100) }
}

export const todayKey = (d = new Date()) => d.toLocaleDateString('en-CA')
const yesterdayKey = () => todayKey(new Date(Date.now() - DAY))

export function initialState() {
  return {
    xp: 0,
    hearts: MAX_HEARTS,
    heartProgress: 0,
    lastRecharge: null,
    streak: { count: 0, lastDate: null },
    cards: {},
    correctIds: {},
    stats: {
      cardsReviewed: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      bestCombo: 0,
      roundsPlayed: 0,
      perfectRounds: 0,
    },
    badges: {},
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState()
    const saved = JSON.parse(raw)
    const base = initialState()
    return { ...base, ...saved, stats: { ...base.stats, ...saved.stats }, streak: { ...base.streak, ...saved.streak } }
  } catch {
    return initialState()
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* storage full or unavailable: progress stays in memory */
  }
}

/** Streak shown in the HUD: a streak whose last day is before yesterday is broken. */
export function activeStreak(streak) {
  if (!streak.lastDate) return 0
  if (streak.lastDate === todayKey() || streak.lastDate === yesterdayKey()) return streak.count
  return 0
}

export function canRechargeToday(state) {
  return state.lastRecharge !== todayKey()
}

function touchStreak(streak) {
  const today = todayKey()
  if (streak.lastDate === today) return streak
  if (streak.lastDate === yesterdayKey()) return { count: streak.count + 1, lastDate: today }
  return { count: 1, lastDate: today }
}

export function isMastered(cardState) {
  return !!cardState && cardState.box >= 3
}

export function domainProgress(state, domainId) {
  const cards = flashcards.filter((c) => !domainId || c.domain === domainId)
  const qs = questions.filter((q) => !domainId || q.domain === domainId)
  const mastered = cards.filter((c) => isMastered(state.cards[c.id])).length
  const correct = qs.filter((q) => state.correctIds[q.id]).length
  return {
    cards: cards.length,
    mastered,
    questions: qs.length,
    correct,
    pct: Math.round(((mastered + correct) / (cards.length + qs.length)) * 100),
  }
}

export function dueCount(state, domainId) {
  const now = Date.now()
  return flashcards.filter(
    (c) => (!domainId || c.domain === domainId) && (state.cards[c.id]?.due ?? 0) <= now,
  ).length
}

/** Order a deck so due and new cards come first, weakest boxes before stronger ones. */
export function buildDeck(state, domainId) {
  return flashcards
    .filter((c) => !domainId || c.domain === domainId)
    .map((c) => ({ c, s: state.cards[c.id] }))
    .sort((a, b) => (a.s?.due ?? 0) - (b.s?.due ?? 0) || (a.s?.box ?? 0) - (b.s?.box ?? 0))
    .map(({ c }) => c)
}

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Build a quiz round. Questions never answered correctly are favoured. Options are shuffled. */
export function buildRound(state, domainId, size = 10) {
  const pool = questions.filter((q) => !domainId || q.domain === domainId)
  const unseen = shuffle(pool.filter((q) => !state.correctIds[q.id]))
  const seen = shuffle(pool.filter((q) => state.correctIds[q.id]))
  return [...unseen, ...seen].slice(0, size).map((q) => {
    const order = shuffle(q.options.map((_, i) => i))
    return {
      ...q,
      options: order.map((i) => q.options[i]),
      answer: order.indexOf(q.answer),
    }
  })
}

export const BADGES = [
  {
    id: 'first-deployment',
    name: 'First Deployment',
    description: 'Answer your first quiz question correctly.',
    icon: 'Rocket',
    check: (s) => s.stats.correctAnswers >= 1,
  },
  {
    id: 'first-flip',
    name: 'Hello, Cloud',
    description: 'Review your first flashcard.',
    icon: 'Layers',
    check: (s) => s.stats.cardsReviewed >= 1,
  },
  {
    id: 'five-in-a-row',
    name: '5-in-a-Row Streak',
    description: 'Answer 5 quiz questions correctly in a row.',
    icon: 'Zap',
    check: (s) => s.stats.bestCombo >= 5,
  },
  {
    id: 'cloud-master',
    name: 'Cloud Concepts Master',
    description: 'Correctly answer every Cloud Concepts question.',
    icon: 'Cloud',
    check: (s) => allCorrect(s, (q) => q.domain === 'cloud'),
  },
  {
    id: 'architect',
    name: 'Architecture Ace',
    description: 'Correctly answer every Architecture and Services question.',
    icon: 'Server',
    check: (s) => allCorrect(s, (q) => q.domain === 'architecture'),
  },
  {
    id: 'governor',
    name: 'Governance Guardian',
    description: 'Correctly answer every Management and Governance question.',
    icon: 'Scale',
    check: (s) => allCorrect(s, (q) => q.domain === 'governance'),
  },
  {
    id: 'security-guru',
    name: 'Security Guru',
    description: 'Correctly answer every security question (Zero Trust, RBAC, Entra ID, defense in depth...).',
    icon: 'ShieldCheck',
    check: (s) => allCorrect(s, (q) => q.tags.includes('security')),
  },
  {
    id: 'perfect-round',
    name: 'Zero Downtime',
    description: 'Finish a quiz round without a single wrong answer.',
    icon: 'Target',
    check: (s) => s.stats.perfectRounds >= 1,
  },
  {
    id: 'flashcard-fanatic',
    name: 'Flashcard Fanatic',
    description: 'Review 50 flashcards.',
    icon: 'BookOpen',
    check: (s) => s.stats.cardsReviewed >= 50,
  },
  {
    id: 'memory-bank',
    name: 'Memory Bank',
    description: 'Master 12 flashcards (reach review box 3 or higher).',
    icon: 'Brain',
    check: (s) => Object.values(s.cards).filter(isMastered).length >= 12,
  },
  {
    id: 'daily-habit',
    name: 'Always On',
    description: 'Study 3 days in a row.',
    icon: 'Flame',
    check: (s) => s.streak.count >= 3,
  },
  {
    id: 'cloud-architect',
    name: 'Certified Architect',
    description: 'Reach Level 3: Cloud Architect.',
    icon: 'Award',
    check: (s) => s.xp >= LEVELS[2].xp,
  },
]

function allCorrect(state, pred) {
  const qs = questions.filter(pred)
  return qs.length > 0 && qs.every((q) => state.correctIds[q.id])
}

function withBadges(state) {
  const badges = { ...state.badges }
  let changed = false
  for (const b of BADGES) {
    if (!badges[b.id] && b.check(state)) {
      badges[b.id] = Date.now()
      changed = true
    }
  }
  return changed ? { ...state, badges } : state
}

export function reducer(state, action) {
  switch (action.type) {
    case 'RATE_CARD': {
      const { id, rating } = action
      const prev = state.cards[id] ?? { box: 0, due: 0, reviews: 0 }
      let box
      if (rating === 'hard') box = 0
      else if (rating === 'good') box = Math.min(MAX_BOX, prev.box + 1)
      else box = Math.min(MAX_BOX, Math.max(prev.box + 2, 3))
      const due = rating === 'hard' ? Date.now() + 5 * 60 * 1000 : Date.now() + BOX_INTERVALS[box]

      let { hearts, heartProgress } = state
      if (hearts < MAX_HEARTS) {
        heartProgress += 1
        if (heartProgress >= CARDS_PER_HEART) {
          hearts += 1
          heartProgress = 0
        }
      } else {
        heartProgress = 0
      }

      return withBadges({
        ...state,
        xp: state.xp + RATING_XP[rating],
        hearts,
        heartProgress,
        streak: touchStreak(state.streak),
        cards: { ...state.cards, [id]: { box, due, reviews: prev.reviews + 1, lastRating: rating } },
        stats: { ...state.stats, cardsReviewed: state.stats.cardsReviewed + 1 },
      })
    }
    case 'ANSWER': {
      const { id, correct, combo } = action
      return withBadges({
        ...state,
        xp: state.xp + (correct ? XP_CORRECT : 0),
        hearts: correct ? state.hearts : Math.max(0, state.hearts - 1),
        streak: touchStreak(state.streak),
        correctIds: correct ? { ...state.correctIds, [id]: true } : state.correctIds,
        stats: {
          ...state.stats,
          questionsAnswered: state.stats.questionsAnswered + 1,
          correctAnswers: state.stats.correctAnswers + (correct ? 1 : 0),
          bestCombo: Math.max(state.stats.bestCombo, combo),
        },
      })
    }
    case 'ROUND_END': {
      const perfect = action.total > 0 && action.correct === action.total
      return withBadges({
        ...state,
        xp: state.xp + (perfect ? XP_PERFECT_ROUND : 0),
        stats: {
          ...state.stats,
          roundsPlayed: state.stats.roundsPlayed + 1,
          perfectRounds: state.stats.perfectRounds + (perfect ? 1 : 0),
        },
      })
    }
    case 'RECHARGE':
      if (!canRechargeToday(state)) return state
      return { ...state, hearts: MAX_HEARTS, heartProgress: 0, lastRecharge: todayKey() }
    case 'RESET':
      return initialState()
    default:
      return state
  }
}
