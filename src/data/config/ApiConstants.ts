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

// Epic Games (GraphQL no oficial — puede cambiar sin aviso)
export const EPIC_GRAPHQL_URL = 'https://graphql.epicgames.com/graphql';

// Epic Games — Auth API interna (no documentada — puede cambiar sin aviso)
// Client: launcherAppClient2 (cliente oficial del Epic Games Launcher)
export const EPIC_AUTH_TOKEN_URL = 'https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token';
export const EPIC_ENTITLEMENTS_URL = 'https://entitlement-public-service-prod08.ol.epicgames.com/entitlement/api/account';
export const EPIC_AUTH_CLIENT_ID = '34a02cf8f4414e29b15921876da36f9a';
export const EPIC_AUTH_CLIENT_SECRET = 'daafbccc737745039dffe53d94fc76cf';
// URL que el usuario abre en el navegador para iniciar sesión en Epic y obtener el auth code
export const EPIC_AUTH_REDIRECT_URL = `https://www.epicgames.com/id/api/redirect?clientId=${EPIC_AUTH_CLIENT_ID}&responseType=code`;

// ProtonDB (endpoint JSON no documentado — puede desaparecer sin aviso)
export const PROTONDB_API_URL = 'https://www.protondb.com/api/v1/reports/summaries';

// IsThereAnyDeal (API v2 oficial)
export const ITAD_API_BASE_URL = 'https://api.isthereanydeal.com';
export const ITAD_API_KEY = process.env.EXPO_PUBLIC_ITAD_API_KEY ?? '';

// HowLongToBeat (flujo con token — no usar librería npm howlongtobeat)
// 1. GET /api/finder/init?t={timestamp}  → { token: string }
// 2. POST /api/finder con header x-auth-token: {token}
export const HLTB_INIT_URL = 'https://howlongtobeat.com/api/finder/init';
export const HLTB_SEARCH_URL = 'https://howlongtobeat.com/api/finder';

// Headers de navegador requeridos por ProtonDB y HLTB para no ser bloqueados
export const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://www.protondb.com',
    'Accept': 'application/json',
};
