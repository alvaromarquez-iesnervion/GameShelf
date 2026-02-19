/**
 * Punto de entrada único para todos los mocks de la capa data.
 *
 * Para activar mocks en el contenedor DI, basta con cambiar el binding:
 *   container.bind<IAuthRepository>(TYPES.IAuthRepository).to(MockAuthRepository)
 *
 * O usar la variable de entorno EXPO_PUBLIC_USE_MOCKS=true en container.ts.
 */

// Datos semilla
export { simulateDelay } from './MockDataProvider';
export * from './MockDataProvider';

// Repositorios mock
export { MockAuthRepository } from './MockAuthRepository';
export { MockGameRepository } from './MockGameRepository';
export { MockWishlistRepository } from './MockWishlistRepository';
export { MockPlatformRepository } from './MockPlatformRepository';
export { MockNotificationRepository } from './MockNotificationRepository';

// Servicios mock
export { MockSteamApiService } from './MockSteamApiService';
export { MockEpicGamesApiService } from './MockEpicGamesApiService';
export { MockProtonDbService } from './MockProtonDbService';
export { MockHowLongToBeatService } from './MockHowLongToBeatService';
export { MockIsThereAnyDealService } from './MockIsThereAnyDealService';
