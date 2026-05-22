/**
 * URLs base y API keys de las integraciones externas.
 * Las API keys se leen desde variables de entorno (.env) — nunca hardcodear.
 *
 * Steam API Key: https://steamcommunity.com/dev/apikey
 * ITAD API Key:  https://isthereanydeal.com/apps/my/
 */

// Steam
export const STEAM_API_BASE_URL = 'https://api.steampowered.com';
export const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login';
export const STEAM_CDN_BASE = 'https://steamcdn-a.akamaihd.net/steam/apps';
export const STEAM_API_KEY = process.env.EXPO_PUBLIC_STEAM_API_KEY ?? '';

// Epic Games (unofficial GraphQL — may change without notice)
export const EPIC_GRAPHQL_URL = 'https://graphql.epicgames.com/graphql';

// Epic Games — internal Auth API (undocumented — may change without notice)
// Client: launcherAppClient2 (official Epic Games Launcher client)
// Credentials are public (EpicResearch) but moved to .env as best practice
export const EPIC_AUTH_TOKEN_URL = 'https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token';
// Library service — returns games actually purchased on Epic Games Store (cursor-paginated)
// GET /library/api/public/items?includeMetadata=true[&cursor=...]
export const EPIC_LIBRARY_URL = 'https://library-service.live.use1a.on.epicgames.com';
// Epic catalogue — enriches title and images given namespace + catalogItemId (requires Bearer token)
// Supports up to 50 IDs per call (repeated ?id= param)
export const EPIC_CATALOG_URL = 'https://catalog-public-service-prod06.ol.epicgames.com/catalog/api/shared/namespace';
export const EPIC_AUTH_CLIENT_ID = process.env.EXPO_PUBLIC_EPIC_CLIENT_ID ?? '';
export const EPIC_AUTH_CLIENT_SECRET = process.env.EXPO_PUBLIC_EPIC_CLIENT_SECRET ?? '';
// URL the user opens in the browser to sign in to Epic and obtain the auth code
export const EPIC_AUTH_REDIRECT_URL = `https://www.epicgames.com/id/api/redirect?clientId=${EPIC_AUTH_CLIENT_ID}&responseType=code`;

// ProtonDB (endpoint JSON no documentado — puede desaparecer sin aviso)
export const PROTONDB_API_URL = 'https://www.protondb.com/api/v1/reports/summaries';

// IsThereAnyDeal (API v2 oficial)
export const ITAD_API_BASE_URL = 'https://api.isthereanydeal.com';
export const ITAD_API_KEY = process.env.EXPO_PUBLIC_ITAD_API_KEY ?? '';

// HowLongToBeat (token-based flow — do not use the howlongtobeat npm library)
// 1. GET /api/finder/init?t={timestamp}  → { token: string }
// 2. POST /api/finder with header x-auth-token: {token}
export const HLTB_INIT_URL = 'https://howlongtobeat.com/api/finder/init';
export const HLTB_SEARCH_URL = 'https://howlongtobeat.com/api/finder';

// Browser headers required by ProtonDB and HLTB to avoid being blocked
export const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://www.protondb.com',
    'Accept': 'application/json',
};
