# PlayStation Network API Research

> Research date: 2026-03-18

---

## 1. Official PlayStation API

**There is no public/official PlayStation API** for third-party developers to access user game libraries. Sony does not offer a documented, supported API like Steam's Web API. All existing solutions are **unofficial and reverse-engineered** from PSN's internal endpoints (used by the PlayStation app, web store, and consoles).

---

## 2. Unofficial APIs & npm Packages

### Primary Recommendation: `psn-api` (npm)

- **Package:** [`psn-api`](https://www.npmjs.com/package/psn-api) (v2.18.0+)
- **GitHub:** [achievements-app/psn-api](https://github.com/achievements-app/psn-api) (~376 stars)
- **Size:** <3KB, TypeScript support, works in Node 14+ and browsers
- **Approach:** Low-level — each function maps to one PSN endpoint call
- **License:** MIT

### Other Notable Projects

| Project | Language | Notes |
|---------|----------|-------|
| [psnawp](https://pypi.org/project/psnawp/) | Python | Reverse-engineered from PSN Android app. Self rate-limits at 300 req/15min |
| [psn-php (Tustin)](https://github.com/Tustin/psn-php) | PHP | Mature PHP wrapper |
| [PSNjs (cubehouse)](https://github.com/cubehouse/PSNjs) | Node.js | Older, less maintained |
| [gumer-psn](https://github.com/jhewt/gumer-psn) | Node.js | Older wrapper |
| [PSN Leaderboard API](https://www.psnleaderboard.com/api/) | PHP/REST | Commercial service, confirmed working Jan 2026 |
| [psn-api-user-playtime](https://github.com/TheYuriG/psn-api-user-playtime) | Node.js | Fork of psn-api with enhanced playtime features |

---

## 3. Authentication Flow

PSN uses an **NPSSO (Network Platform Single Sign-On)** token-based OAuth flow:

### Step-by-step:

1. **Get NPSSO token (manual):**
   - Sign in at https://www.playstation.com/
   - Visit `https://ca.account.sony.com/api/v1/ssocookie` in the same browser
   - Copy the `npsso` value from the JSON response (64 characters)

2. **Exchange NPSSO for Access Code:**
   ```ts
   import { exchangeNpssoForAccessCode } from "psn-api";
   const accessCode = await exchangeNpssoForAccessCode(npssoToken);
   ```

3. **Exchange Access Code for Auth Tokens:**
   ```ts
   import { exchangeAccessCodeForAuthTokens } from "psn-api";
   const auth = await exchangeAccessCodeForAuthTokens(accessCode);
   // auth.accessToken — short-lived (few hours)
   // auth.refreshToken — lasts ~2 months
   ```

4. **Refresh when expired:**
   ```ts
   import { exchangeRefreshTokenForAuthTokens } from "psn-api";
   const newAuth = await exchangeRefreshTokenForAuthTokens(auth.refreshToken);
   ```

### Token Lifetimes:
- **Access token:** few hours
- **Refresh token:** ~2 months
- **NPSSO token:** must be re-obtained manually after refresh token expires

### Key Limitation for Mobile Apps:
The NPSSO token **cannot** be obtained programmatically — it requires the user to sign into PlayStation's website in a browser. For GameShelf, this means either:
- Opening a WebView to `playstation.com` login, then intercepting the `ssocookie` endpoint
- Asking the user to manually paste their NPSSO token (worse UX)

---

## 4. Available Data

### `getUserPlayedGames(auth, accountId)` — **Best for game library**
Returns played games with rich data:

| Field | Type | Description |
|-------|------|-------------|
| `titles[].titleId` | `string` | Game ID (e.g., `"CUSA01433_00"`) |
| `titles[].name` | `string` | Game name |
| `titles[].imageUrl` | `string` | Game icon URL |
| `titles[].category` | `string` | `"ps4_game"`, `"ps5_native_game"`, `"pspc_game"` |
| `titles[].service` | `string` | `"none"` (owned), `"none_purchased"`, `"ps_plus"` |
| `titles[].playCount` | `number` | Times played |
| `titles[].concept.id` | `number` | Unified concept ID across platforms |
| `titles[].concept.titleIds` | `string[]` | All version IDs for this game |
| `titles[].playDuration` | `string` | Playtime (ISO 8601 duration) |
| `titles[].firstPlayedDateTime` | `string` | First played timestamp |
| `titles[].lastPlayedDateTime` | `string` | Last played timestamp |

### `getPurchasedGames(auth)` — Purchased games only
- Returns **only PS4 and PS5** purchased games
- Only works for the authenticated user's own account
- Supports filtering by `platform`, `isActive`, `membership`

### `getUserTitles(auth, accountId)` — Trophy-based game list
- Returns games where the user has earned **at least one trophy**
- Includes trophy summary per game (bronze/silver/gold/platinum counts)
- Does NOT include games with zero trophies

### Other Available Endpoints (psn-api):
- **Profile:** `getProfileFromAccountId()` — username, avatar, PS Plus status, trophy summary
- **Presence:** `getBasicPresence()` — online status, current game, platform
- **Trophies:** `getUserTrophiesEarnedForTitle()` — individual trophy details per game
- **Friends:** `getUserFriendsAccountIds()` — friend list
- **Search:** `makeUniversalSearch()` — search for users/games on PSN
- **Devices:** `getAccountDevices()` — registered PlayStation devices

---

## 5. Limitations & Risks

### Rate Limiting
- PSN returns **429 Too Many Requests** when limits are hit
- `psnawp` self-limits at **300 requests per 15 minutes**
- `psn-api` does **not** self-rate-limit — you must implement your own

### Account Ban Risk
- **PSN Terms of Service Section 10.7** explicitly prohibits: *"automated methods, such as bots or scripts to interact with PSN content, or otherwise in connection with your Account"*
- Excessive API use can result in **temporary or permanent account ban**
- **Strong recommendation:** Use a **dedicated/throwaway PSN account**, never the user's primary account for server-side operations

### Data Gaps
- **No "full library" endpoint** — `getUserPlayedGames` only shows games that have been launched at least once
- **No purchase history with prices** — cannot retrieve transaction/payment data
- **PS3/Vita limited support** — most endpoints focus on PS4/PS5
- **Privacy settings** — other users' data may be hidden if their profile is private
- **NPSSO manual step** — cannot be fully automated without a browser session

### API Stability
- These are **undocumented internal endpoints** — Sony can change or break them at any time without notice
- The community has maintained compatibility for several years, but there are no guarantees

---

## 6. Integration Recommendation for GameShelf

### Recommended Approach:
1. **Package:** Use `psn-api` (npm) — TypeScript, tiny, well-maintained, active community
2. **Auth flow:** WebView-based login to capture NPSSO, then manage tokens with refresh
3. **Primary endpoint:** `getUserPlayedGames()` for the game library (richest data)
4. **Supplement with:** `getUserTitles()` for trophy data
5. **Rate limiting:** Implement 300 req/15min self-limit like psnawp
6. **Token storage:** Store refresh token securely; re-prompt NPSSO only every ~2 months
7. **Matching to IGDB/Steam:** Use `concept.id` or game name for cross-platform matching

### Install:
```bash
npm i psn-api
```

### Minimal Example:
```ts
import {
  exchangeNpssoForAccessCode,
  exchangeAccessCodeForAuthTokens,
  getUserPlayedGames,
  makeUniversalSearch,
} from "psn-api";

// 1. Auth
const accessCode = await exchangeNpssoForAccessCode(npssoToken);
const auth = await exchangeAccessCodeForAuthTokens(accessCode);

// 2. Get played games
const { titles } = await getUserPlayedGames(auth, "me", { limit: 100 });

// Each title has: name, titleId, imageUrl, category, playCount, playDuration, etc.
```
