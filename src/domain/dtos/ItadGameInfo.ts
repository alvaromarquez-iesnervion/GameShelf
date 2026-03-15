/** Información básica de un juego según la API de IsThereAnyDeal. */
export interface ItadGameInfo {
    id: string;
    title: string;
    steamAppId: number | null;
    coverUrl: string;
}
