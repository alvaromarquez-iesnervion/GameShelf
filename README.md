# GameShelf

A mobile app to manage your video game library across multiple platforms. Consolidates your Steam, Epic Games, GOG, and PSN libraries in one place, with game details, deal tracking, and a wishlist.

Built with React Native and Expo.

---

## Stack

| Technology | Version | Role |
|---|---|---|
| React Native + Expo | 0.81.5 / SDK 54 | Framework |
| TypeScript | 5.9 | Language |
| MobX + mobx-react-lite | 6 | Reactive state (ViewModels) |
| React Navigation | 7 | Navigation (native-stack + bottom-tabs) |
| Inversify + reflect-metadata | 7 | Dependency injection |
| Firebase JS SDK | 12 | Auth + Firestore |
| Axios | 1.x | HTTP client |
| expo-image | 3.x | Optimized image rendering |

---

## Architecture

Clean Architecture + MVVM. Dependency flow: `core → presentation → domain ← data`.

```
src/
├── domain/        # Entities, DTOs, enums, interfaces, use cases — pure TypeScript
├── data/          # Repository and service implementations, Firebase, API clients
├── di/            # Inversify container (container.ts), TYPES symbols
├── presentation/  # MobX ViewModels, screens, UI components, theme
└── core/          # App.tsx entry point, React Navigation stacks and tabs
```

Entry: `index.ts` → `src/core/App.tsx` → `RootNavigator`

---

## Features

### Authentication
- Email/password login and registration (Firebase Auth)
- Persistent session across restarts
- Forgot password via email reset
- Guest mode — data stored locally with AsyncStorage, never synced to Firestore

### Library
- Steam library sync (Steam Web API)
- Epic Games library (OAuth2 Auth Code flow via WebView, GDPR JSON fallback)
- GOG library (OAuth2 WebView flow)
- PSN library (`psn-api`)
- 3-column grid with cover art, platform badges, and sorting (name / last played / playtime)
- Local search, deduplication across platforms

### Game Detail
- Hero image with gradient overlay
- ProtonDB Linux compatibility rating
- HowLongToBeat estimates (main story / main+extras / completionist)
- Steam metadata: Metacritic score, genres, developer, publisher, release date
- Active deals from IsThereAnyDeal (ITAD)
- Wishlist toggle

### Wishlist
- List of saved games with best available deal
- Add / remove games, pull-to-refresh

### Search
- Cross-platform game search

### Settings
- Link / unlink Steam, Epic Games, GOG, PSN accounts
- Notification preferences for deal alerts
- Profile view

---

## External APIs

| API | Purpose |
|---|---|
| Steam Web API | Library sync, game metadata |
| ProtonDB | Linux compatibility rating |
| HowLongToBeat | Playtime estimates |
| IsThereAnyDeal (ITAD) | Active deals |
| GameShelf API | Backend — unified data layer (replaces direct external calls) |

---

## Setup

```bash
cp .env.example .env
# Fill in your Firebase and API keys
npm install
npx expo start
```

The app operates in three modes depending on which environment variables are set:

| Mode | Condition |
|---|---|
| Mock | No env vars — all data is in-memory, no external calls |
| Steam-only | `EXPO_PUBLIC_STEAM_API_KEY` set |
| Full production | All `EXPO_PUBLIC_FIREBASE_*` + Steam + ITAD keys set |

---

## Commands

```bash
npx expo start            # Dev server (Expo Go)
npx expo start --android  # Android emulator
npx expo start --ios      # iOS simulator
npm run lint              # ESLint
npx tsc --noEmit          # Type-check (no test suite configured)
```
