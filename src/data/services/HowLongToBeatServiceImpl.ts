import 'reflect-metadata';
import { injectable } from 'inversify';
import axios from 'axios';
import { IHowLongToBeatService } from '../../domain/interfaces/services/IHowLongToBeatService';
import { HltbResult } from '../../domain/entities/HltbResult';
import { HLTB_SEARCH_URL } from '../config/ApiConstants';

// Estructura relevante de un resultado de HLTB
interface HltbGameEntry {
    game_name: string;
    comp_main: number;   // segundos de historia principal
    comp_plus: number;   // segundos historia + extras
    comp_100: number;    // segundos completista (100%)
    similarity?: number; // relevancia del resultado
}

/**
 * NO usar la librería npm "howlongtobeat" — depende de módulos Node.js
 * (events, stream, buffer) incompatibles con el runtime de React Native.
 *
 * Se hace POST directo al endpoint interno de HLTB con Axios.
 * Requiere headers de navegador para no ser bloqueado.
 *
 * Los campos comp_main/comp_plus/comp_100 vienen en segundos.
 * Se convierten a horas decimales: segundos / 3600.
 *
 * AVISO: URL puede cambiar. Versiones recientes de HLTB han añadido
 * un hash en la ruta (/api/search/{hash}). Si falla, revisar la URL.
 */
@injectable()
export class HowLongToBeatServiceImpl implements IHowLongToBeatService {

    async getGameDuration(gameTitle: string): Promise<HltbResult | null> {
        try {
            const response = await axios.post(
                HLTB_SEARCH_URL,
                {
                    searchType: 'games',
                    searchTerms: gameTitle.split(' '),
                    searchPage: 1,
                    size: 5,
                    searchOptions: {
                        games: {
                            userId: 0,
                            platform: '',
                            sortCategory: 'popular',
                            rangeCategory: 'main',
                            rangeTime: { min: null, max: null },
                            gameplay: { perspective: '', flow: '', genre: '' },
                            rangeYear: { min: '', max: '' },
                            modifier: '',
                        },
                        filter: '',
                        sort: 0,
                        randomizer: 0,
                    },
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Referer': 'https://howlongtobeat.com',
                        'Origin': 'https://howlongtobeat.com',
                    },
                    timeout: 8000,
                },
            );

            const results: HltbGameEntry[] = response.data?.data ?? [];
            if (results.length === 0) return null;

            // Seleccionar el resultado más relevante (primero = mayor relevancia)
            const best = results[0];

            const toHours = (seconds: number): number | null =>
                seconds > 0 ? Math.round((seconds / 3600) * 10) / 10 : null;

            return new HltbResult(
                toHours(best.comp_main),
                toHours(best.comp_plus),
                toHours(best.comp_100),
            );
        } catch {
            return null;
        }
    }
}
