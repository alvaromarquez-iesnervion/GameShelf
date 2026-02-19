/**
 * Datos semilla centralizados para todos los mocks.
 * Representan la estructura real que devolverían las APIs en producción.
 *
 * Importar desde aquí en lugar de duplicar datos en cada mock.
 */

import { Game } from '../../domain/entities/Game';
import { User } from '../../domain/entities/User';
import { LinkedPlatform } from '../../domain/entities/LinkedPlatform';
import { WishlistItem } from '../../domain/entities/WishlistItem';
import { Deal } from '../../domain/entities/Deal';
import { GameDetail } from '../../domain/entities/GameDetail';
import { SearchResult } from '../../domain/entities/SearchResult';
import { NotificationPreferences } from '../../domain/entities/NotificationPreferences';
import { ProtonDbRating } from '../../domain/entities/ProtonDbRating';
import { HltbResult } from '../../domain/entities/HltbResult';
import { Platform } from '../../domain/enums/Platform';

// ─── Utilidad ─────────────────────────────────────────────────────────────────

/** Simula latencia de red para que los mocks ejerciten los estados de carga de la UI. */
export const simulateDelay = (ms = 600): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms));

const steamCover = (appId: number): string =>
    `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/header.jpg`;

// ─── Usuario ─────────────────────────────────────────────────────────────────

export const MOCK_USER = new User(
    'mock-uid-dev-001',
    'dev@gameshelf.app',
    'DevUser',
    new Date('2024-01-15T10:00:00Z'),
);

// ─── Juegos de Steam ──────────────────────────────────────────────────────────

export const MOCK_STEAM_GAMES: Game[] = [
    new Game(
        '1245620',
        'Elden Ring',
        'Un colosal RPG de acción ambientado en las Tierras Intermedias. Desarrollado por FromSoftware y George R.R. Martin.',
        steamCover(1245620),
        Platform.STEAM,
        1245620,
        'itad-elden-ring-uuid',
        3420,
        new Date('2024-02-15T20:00:00Z'),
    ),
    new Game(
        '1091500',
        'Cyberpunk 2077',
        'RPG de mundo abierto en una megalópolis del futuro donde el poder, el glamur y las modificaciones corporales conviven con la violencia.',
        steamCover(1091500),
        Platform.STEAM,
        1091500,
        'itad-cyberpunk-uuid',
        4890,
        new Date('2024-02-10T18:30:00Z'),
    ),
    new Game(
        '1145360',
        'Hades',
        'Roguelike de acción en el que juegas como el hijo inmortal del dios del Inframundo intentando escapar del reino de los muertos.',
        steamCover(1145360),
        Platform.STEAM,
        1145360,
        'itad-hades-uuid',
        2840,
        new Date('2024-02-18T22:00:00Z'),
    ),
    new Game(
        '1086940',
        "Baldur's Gate 3",
        'RPG por turnos basado en Dungeons & Dragons. Liderado por Larian Studios con una narrativa profunda y combate táctico.',
        steamCover(1086940),
        Platform.STEAM,
        1086940,
        'itad-bg3-uuid',
        8920,
        new Date('2024-02-17T15:00:00Z'),
    ),
    new Game(
        '367520',
        'Hollow Knight',
        'Juego de acción y aventura 2D en un vasto reino subterráneo habitado por insectos.',
        steamCover(367520),
        Platform.STEAM,
        367520,
        'itad-hollow-knight-uuid',
        1560,
        new Date('2024-01-20T12:00:00Z'),
    ),
    new Game(
        '413150',
        'Stardew Valley',
        'Simulador de granja en el que heredas la parcela de tu abuelo y construyes tu vida en la campiña.',
        steamCover(413150),
        Platform.STEAM,
        413150,
        'itad-stardew-uuid',
        5280,
        new Date('2024-02-14T10:00:00Z'),
    ),
];

// ─── Juegos jugados recientemente (últimas 2 semanas) ──────────────────────────

export const MOCK_RECENTLY_PLAYED: Game[] = [
    new Game(
        '1145360',
        'Hades',
        'Roguelike de acción en el que juegas como el hijo inmortal del dios del Inframundo intentando escapar del reino de los muertos.',
        steamCover(1145360),
        Platform.STEAM,
        1145360,
        'itad-hades-uuid',
        2840,
        new Date(),
    ),
    new Game(
        '1086940',
        "Baldur's Gate 3",
        'RPG por turnos basado en Dungeons & Dragons. Liderado por Larian Studios con una narrativa profunda y combate táctico.',
        steamCover(1086940),
        Platform.STEAM,
        1086940,
        'itad-bg3-uuid',
        8920,
        new Date(),
    ),
    new Game(
        '1245620',
        'Elden Ring',
        'Un colosal RPG de acción ambientado en las Tierras Intermedias. Desarrollado por FromSoftware y George R.R. Martin.',
        steamCover(1245620),
        Platform.STEAM,
        1245620,
        'itad-elden-ring-uuid',
        3420,
        new Date(),
    ),
];

// ─── Juegos de Epic ───────────────────────────────────────────────────────────

export const MOCK_EPIC_GAMES: Game[] = [
    new Game(
        'epic-death-stranding',
        'Death Stranding Director\'s Cut',
        'Un juego de acción y aventura de Hideo Kojima en el que debes reconectar a una sociedad fracturada.',
        'https://cdn1.epicgames.com/offer/3f5c1900cad04c1a9e5bd3757c3f6aef/EGS_DeathStrandingDirectorsCut_KojimaProductions_S1_2560x1440-2f24b15ca1acbfaec5a5a50bb27b7c1a',
        Platform.EPIC_GAMES,
        null,
        null,
    ),
    new Game(
        'epic-alan-wake-2',
        'Alan Wake 2',
        'Juego de terror psicológico y thriller de acción de Remedy Entertainment.',
        'https://cdn1.epicgames.com/offer/2a14c3f0f1a5473a8ee0e71c32f98e4f/EGS_AlanWake2_RemedyEntertainment_S1_2560x1440-9de5b74b4e97e80be6a91c427b14f1b5',
        Platform.EPIC_GAMES,
        null,
        null,
    ),
];

export const MOCK_ALL_GAMES: Game[] = [...MOCK_STEAM_GAMES, ...MOCK_EPIC_GAMES];

// ─── Plataformas vinculadas ───────────────────────────────────────────────────

export const MOCK_LINKED_PLATFORMS: LinkedPlatform[] = [
    new LinkedPlatform(
        Platform.STEAM,
        '76561198000000001',   // SteamID 64-bit de ejemplo
        new Date('2024-01-20T12:00:00Z'),
    ),
    new LinkedPlatform(
        Platform.EPIC_GAMES,
        'imported',
        new Date('2024-02-05T09:30:00Z'),
    ),
];

// ─── Ofertas (ITAD) ───────────────────────────────────────────────────────────

export const MOCK_DEALS_ELDEN_RING: Deal[] = [
    new Deal(
        'deal-elden-humble',
        'Humble Store',
        41.99,
        59.99,
        30,
        'https://www.humblebundle.com/store/elden-ring',
    ),
    new Deal(
        'deal-elden-greenmangaming',
        'Green Man Gaming',
        44.99,
        59.99,
        25,
        'https://www.greenmangaming.com/games/elden-ring/',
    ),
];

export const MOCK_DEALS_CYBERPUNK: Deal[] = [
    new Deal(
        'deal-cyberpunk-gog',
        'GOG',
        15.99,
        39.99,
        60,
        'https://www.gog.com/en/game/cyberpunk_2077',
    ),
    new Deal(
        'deal-cyberpunk-steam',
        'Steam',
        19.99,
        39.99,
        50,
        'https://store.steampowered.com/app/1091500/',
    ),
    new Deal(
        'deal-cyberpunk-humble',
        'Humble Store',
        17.99,
        39.99,
        55,
        'https://www.humblebundle.com/store/cyberpunk-2077',
    ),
];

export const MOCK_DEALS_HADES: Deal[] = [
    new Deal(
        'deal-hades-steam',
        'Steam',
        11.99,
        24.99,
        52,
        'https://store.steampowered.com/app/1145360/',
    ),
    new Deal(
        'deal-hades-humble',
        'Humble Store',
        12.49,
        24.99,
        50,
        'https://www.humblebundle.com/store/hades',
    ),
];

export const MOCK_DEALS_BG3: Deal[] = []; // Sin ofertas activas

export const MOCK_DEALS_HOLLOW_KNIGHT: Deal[] = [
    new Deal(
        'deal-hk-steam',
        'Steam',
        7.19,
        14.99,
        52,
        'https://store.steampowered.com/app/367520/',
    ),
];

export const MOCK_DEALS_STARDEW: Deal[] = [
    new Deal(
        'deal-stardew-steam',
        'Steam',
        8.99,
        14.99,
        40,
        'https://store.steampowered.com/app/413150/',
    ),
];

/** Mapa: steamAppId (string) → ofertas */
export const MOCK_DEALS_BY_STEAM_APP_ID: Record<string, Deal[]> = {
    '1245620': MOCK_DEALS_ELDEN_RING,
    '1091500': MOCK_DEALS_CYBERPUNK,
    '1145360': MOCK_DEALS_HADES,
    '1086940': MOCK_DEALS_BG3,
    '367520': MOCK_DEALS_HOLLOW_KNIGHT,
    '413150': MOCK_DEALS_STARDEW,
};

/** Mapa: itadGameId → ofertas */
export const MOCK_DEALS_BY_ITAD_ID: Record<string, Deal[]> = {
    'itad-elden-ring-uuid': MOCK_DEALS_ELDEN_RING,
    'itad-cyberpunk-uuid': MOCK_DEALS_CYBERPUNK,
    'itad-hades-uuid': MOCK_DEALS_HADES,
    'itad-bg3-uuid': MOCK_DEALS_BG3,
    'itad-hollow-knight-uuid': MOCK_DEALS_HOLLOW_KNIGHT,
    'itad-stardew-uuid': MOCK_DEALS_STARDEW,
};

// ─── Ratings de ProtonDB ──────────────────────────────────────────────────────

/** Mapa: steamAppId (string) → ProtonDbRating */
export const MOCK_PROTONDB_RATINGS: Record<string, ProtonDbRating> = {
    '1245620': new ProtonDbRating('platinum', 'platinum', 3241),
    '1091500': new ProtonDbRating('gold', 'gold', 8712),
    '1145360': new ProtonDbRating('platinum', 'platinum', 5430),
    '1086940': new ProtonDbRating('gold', 'platinum', 2108),
    '367520':  new ProtonDbRating('platinum', 'platinum', 1892),
    '413150':  new ProtonDbRating('platinum', 'platinum', 4561),
};

// ─── Datos de HowLongToBeat ───────────────────────────────────────────────────
// Horas decimales. Valores aproximados a los reales de HLTB.

/** Mapa: título del juego (normalizado a minúsculas) → HltbResult */
export const MOCK_HLTB_DATA: Record<string, HltbResult> = {
    'elden ring':         new HltbResult(58.5, 91.5, 131.0),
    'cyberpunk 2077':     new HltbResult(25.0, 58.0, 99.0),
    'hades':              new HltbResult(20.0, 57.0, 90.0),
    "baldur's gate 3":    new HltbResult(100.0, 180.0, 296.0),
    'hollow knight':      new HltbResult(40.0, 55.0, 63.0),
    'stardew valley':     new HltbResult(53.0, 112.0, 182.0),
    'death stranding':    new HltbResult(40.0, 61.0, 79.0),
    'alan wake 2':        new HltbResult(14.5, 20.0, 27.0),
};

// ─── Wishlist inicial ─────────────────────────────────────────────────────────

export const MOCK_INITIAL_WISHLIST: WishlistItem[] = [
    new WishlistItem(
        'wish-001',
        '1091500',
        'Cyberpunk 2077',
        steamCover(1091500),
        new Date('2024-03-10T15:00:00Z'),
        60,   // 60% de descuento activo
    ),
    new WishlistItem(
        'wish-002',
        '1086940',
        "Baldur's Gate 3",
        steamCover(1086940),
        new Date('2024-03-12T10:00:00Z'),
        null, // Sin oferta activa
    ),
];

// ─── Resultados de búsqueda (ITAD) ───────────────────────────────────────────
// Incluye juegos no presentes en la biblioteca para simular catálogo externo.

export const MOCK_SEARCH_RESULTS: SearchResult[] = [
    new SearchResult('itad-elden-ring-uuid', 'Elden Ring', steamCover(1245620), false),
    new SearchResult('itad-cyberpunk-uuid', 'Cyberpunk 2077', steamCover(1091500), true),
    new SearchResult('itad-hades-uuid', 'Hades', steamCover(1145360), false),
    new SearchResult('itad-bg3-uuid', "Baldur's Gate 3", steamCover(1086940), true),
    new SearchResult('itad-hollow-knight-uuid', 'Hollow Knight', steamCover(367520), false),
    new SearchResult('itad-stardew-uuid', 'Stardew Valley', steamCover(413150), false),
    // Juegos que no están en la biblioteca del usuario mock
    new SearchResult('itad-sekiro-uuid', 'Sekiro: Shadows Die Twice', steamCover(814380), false),
    new SearchResult('itad-ds3-uuid', 'Dark Souls III', steamCover(374320), false),
    new SearchResult('itad-witcher3-uuid', 'The Witcher 3: Wild Hunt', steamCover(292030), false),
];

// ─── Preferencias de notificaciones ──────────────────────────────────────────

export const MOCK_NOTIFICATION_PREFERENCES = new NotificationPreferences(true);

// ─── GameDetail completos (usados en MockGameRepository) ─────────────────────

export const MOCK_GAME_DETAIL_MAP: Record<string, GameDetail> = {
    '1245620': new GameDetail(
        MOCK_STEAM_GAMES[0],
        'platinum', 'platinum',
        58.5, 91.5, 131.0,
        MOCK_DEALS_ELDEN_RING,
    ),
    '1091500': new GameDetail(
        MOCK_STEAM_GAMES[1],
        'gold', 'gold',
        25.0, 58.0, 99.0,
        MOCK_DEALS_CYBERPUNK,
    ),
    '1145360': new GameDetail(
        MOCK_STEAM_GAMES[2],
        'platinum', 'platinum',
        20.0, 57.0, 90.0,
        MOCK_DEALS_HADES,
    ),
    '1086940': new GameDetail(
        MOCK_STEAM_GAMES[3],
        'gold', 'platinum',
        100.0, 180.0, 296.0,
        MOCK_DEALS_BG3,
    ),
    '367520': new GameDetail(
        MOCK_STEAM_GAMES[4],
        'platinum', 'platinum',
        40.0, 55.0, 63.0,
        MOCK_DEALS_HOLLOW_KNIGHT,
    ),
    '413150': new GameDetail(
        MOCK_STEAM_GAMES[5],
        'platinum', 'platinum',
        53.0, 112.0, 182.0,
        MOCK_DEALS_STARDEW,
    ),
    'epic-death-stranding': new GameDetail(
        MOCK_EPIC_GAMES[0],
        null, null,  // ProtonDB no aplica a juegos de Epic
        40.0, 61.0, 79.0,
        [],
    ),
    'epic-alan-wake-2': new GameDetail(
        MOCK_EPIC_GAMES[1],
        null, null,
        14.5, 20.0, 27.0,
        [],
    ),
};
