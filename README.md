# AZ-900 Cloud Quest

A gamified, single-page study app for **Microsoft Azure Fundamentals (AZ-900)**, built with React, Tailwind CSS and Lucide icons. All progress is saved in your browser's `localStorage`.

## Features

- **HUD:** level and animated XP bar (Cloud Novice → Azure Apprentice → Cloud Architect → …), daily streak, 5 quiz hearts, and a trophy button that opens the badges modal.
- **Spaced-repetition flashcards:** 3D flip cards with the term and domain badge on the front, a definition plus a real-world Azure analogy on the back. Rate *Hard* (+5 XP), *Good* (+10 XP) or *Mastered* (+15 XP); cards are scheduled with Leitner boxes (Hard comes back in the same session). Shortcuts: `Space` flips, `1/2/3` rate.
- **Quiz Arena:** exam-style scenario questions with shuffled options, `+25 XP` floating feedback for correct answers, a shake and `-1 Heart` for wrong ones, a mandatory "Why?" explanation, combo counter, and an end-of-round summary (score, accuracy, XP, best combo, per-question review, retry). Shortcuts: `1–4` / `A–D` answer, `Enter` continues.
- **Hearts:** every 3 flashcards reviewed restores a heart, and there's a free full recharge once per day.
- **12 badges** such as *First Deployment*, *5-in-a-Row Streak*, *Cloud Concepts Master* and *Security Guru*, with toast and confetti celebrations.
- **Content:** 24 flashcards and 22 questions across the three official exam domains, in [`src/data/content.json`](src/data/content.json). Filter by domain or study all of them.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Project structure

```
src/
  App.jsx                 layout, dashboard, mode switcher, toasts
  components/             Hud, Flashcards, QuizArena, BadgesModal, Confetti
  lib/game.js             levels, XP, hearts, streak, badges, spaced repetition, storage
  data/content.json       flashcards and quiz questions
```

To add content, append entries to `content.json` using an existing `domain` id (`cloud`, `architecture`, `governance`). Questions tagged `"security"` count toward the Security Guru badge.
