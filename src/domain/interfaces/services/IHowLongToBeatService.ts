import { HltbResult } from '../../entities/HltbResult';

/**
 * API no oficial: POST https://howlongtobeat.com/api/search
 * NO usar la librería npm "howlongtobeat" — depende de módulos Node.js incompatibles
 * con el runtime de React Native (Hermes/JSC). Usar Axios directamente.
 * Los campos comp_main/comp_plus/comp_100 vienen en segundos → dividir entre 3600.
 */
export interface IHowLongToBeatService {
    /** Devuelve null si el endpoint falla o no hay resultados para el título. */
    getGameDuration(gameTitle: string): Promise<HltbResult | null>;
}
