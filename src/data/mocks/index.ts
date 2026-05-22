/**
 * Single entry point for all data-layer mocks.
 *
 * To activate mocks in the DI container, change the binding:
 *   container.bind<IAuthRepository>(TYPES.IAuthRepository).to(MockAuthRepository)
 *
 * Or set EXPO_PUBLIC_USE_MOCKS=true in container.ts.
 */

// Seed data
export * from './MockDataProvider';

// Mock repositories
export { MockAuthRepository } from './MockAuthRepository';
export { MockGameRepository } from './MockGameRepository';
export { MockWishlistRepository } from './MockWishlistRepository';
export { MockPlatformRepository } from './MockPlatformRepository';
export { MockNotificationRepository } from './MockNotificationRepository';

// Mock API client
export { MockGameShelfApiClient } from './MockGameShelfApiClient';
