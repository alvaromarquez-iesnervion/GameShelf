import { DocumentData } from 'firebase/firestore';
import { Game } from '../../domain/entities/Game';
import { Platform } from '../../domain/enums/Platform';
import { GameType } from '../../domain/enums/GameType';

/**
 * Mapper bidireccional entre documentos Firestore y la entidad Game.
 * Se reutiliza en GameRepositoryImpl y PlatformRepositoryImpl.
 *
 * Estructura del documento Firestore (users/{userId}/library/{gameId}):
 * {
 *   title: string,
 *   description: string,
 *   coverUrl: string,
 *   portraitCoverUrl: string,
 *   platform: 'STEAM' | 'EPIC_GAMES',
 *   steamAppId: number | null,
 *   itadGameId: string | null,
 * }
 */
export class FirestoreGameMapper {

    static toDomain(docId: string, data: DocumentData): Game {
        const validPlatforms = Object.values(Platform);
        const platform: Platform = validPlatforms.includes(data.platform)
            ? (data.platform as Platform)
            : Platform.UNKNOWN;
        const validGameTypes = Object.values(GameType);
        const gameType: GameType = validGameTypes.includes(data.gameType)
            ? (data.gameType as GameType)
            : GameType.GAME;
        return new Game(
            docId,
            data.title ?? '',
            data.description ?? '',
            data.coverUrl ?? '',
            platform,
            data.steamAppId ?? null,
            data.itadGameId ?? null,
            data.playtime ?? 0,
            data.lastPlayed?.toDate() ?? null,
            data.portraitCoverUrl ?? '',
            gameType,
            data.parentGameId ?? null,
            data.psnTitleId ?? null,
        );
    }

    static toFirestore(game: Game): Record<string, unknown> {
        return {
            title: game.getTitle(),
            description: game.getDescription(),
            coverUrl: game.getCoverUrl(),
            portraitCoverUrl: game.getPortraitCoverUrl(),
            platform: game.getPlatform(),
            steamAppId: game.getSteamAppId(),
            itadGameId: game.getItadGameId(),
            playtime: game.getPlaytime(),
            lastPlayed: game.getLastPlayed(),
            gameType: game.getGameType(),
            parentGameId: game.getParentGameId(),
            psnTitleId: game.getPsnTitleId(),
        };
    }
}
