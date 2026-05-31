# TalentMind — Cognitive Assessment Platform

> COMP492 Senior Design Project · 2026

TalentMind is a web-based cognitive assessment platform that evaluates candidates through interactive tasks and generates HR-ready competency profiles and role-fit scores.

## Repository Structure

```
TalentMind/
├── backend/              # Node.js + Express + Prisma (PostgreSQL)
├── hub-frontend/         # React — Candidate game hub + HR Dashboard
└── games/
    ├── balloon/          # Balloon Risk Task
    ├── digit-symbol/     # Digit Symbol Task
    ├── emotion-recognition/ # Emotion Recognition Task
    ├── eriksen-flanker/  # Eriksen Flanker Test
    ├── go-no-go/         # Go / No-Go Task
    ├── hanoi/            # Tower of Hanoi
    ├── nback/            # N-Back Task
    ├── numbers-memory/   # Numbers Memory Task
    ├── simon/            # Simon Says Task
    ├── stroop/           # Colour Stroop Task
    ├── target-tracking/  # Target Tracking Task
    └── typing/           # Typing Pressure Test
```

## Live Deployment

| Component | URL |
|---|---|
| Candidate Hub | https://game-hub-frontend-iota.vercel.app |
| HR Dashboard | https://game-hub-frontend-iota.vercel.app/hr |
| Backend API | https://graduation-tawny-beta.vercel.app |

## Tech Stack

- **Backend**: Node.js, Express, Prisma ORM, PostgreSQL (Neon)
- **Frontend**: React (Vite), inline styles, custom SVG radar chart
- **Games**: React (Vite / CRA), deployed on Vercel
- **Analytics**: Custom competency engine — 8 cognitive dimensions, 7 role profiles, percentile ranking

## Competencies Measured

| Competency | Assessment Tasks |
|---|---|
| Attention & Focus | N-Back, Eriksen Flanker, Go/No-Go |
| Memory & Recall | N-Back, Simon Says, Numbers Memory |
| Processing Speed | Digit Symbol, Colour Stroop |
| Decision Making | Tower of Hanoi, Balloon Task |
| Emotional Intelligence | Emotion Recognition |
| Impulse Control | Go/No-Go, Colour Stroop, Balloon Task |
| Stress Resistance | Balloon Task, Typing Pressure |
| Cognitive Flexibility | Tower of Hanoi, Digit Symbol, Colour Stroop |

## Team

Built as part of COMP492 Senior Design Project II — 2026.
