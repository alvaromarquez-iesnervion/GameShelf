/**
 * Unique symbols used by Inversify as service identifiers.
 * Imported by every layer that needs to resolve dependencies from the container.
 */
export const TYPES = {
    // Firebase instances (constant values registered in container.ts)
    FirebaseAuth: Symbol.for('FirebaseAuth'),
    Firestore: Symbol.for('Firestore'),

    // Repositories
    IAuthRepository: Symbol.for('IAuthRepository'),
    IGameRepository: Symbol.for('IGameRepository'),
    IWishlistRepository: Symbol.for('IWishlistRepository'),
    IPlatformRepository: Symbol.for('IPlatformRepository'),
    INotificationRepository: Symbol.for('INotificationRepository'),
    ISettingsRepository: Symbol.for('ISettingsRepository'),

    // GameShelfApi client
    IGameShelfApiClient: Symbol.for('IGameShelfApiClient'),

    // Use cases
    IAuthUseCase: Symbol.for('IAuthUseCase'),
    ILibraryUseCase: Symbol.for('ILibraryUseCase'),
    IWishlistUseCase: Symbol.for('IWishlistUseCase'),
    IGameDetailUseCase: Symbol.for('IGameDetailUseCase'),
    ISearchUseCase: Symbol.for('ISearchUseCase'),
    IPlatformLinkUseCase: Symbol.for('IPlatformLinkUseCase'),
    ISettingsUseCase: Symbol.for('ISettingsUseCase'),
    IHomeUseCase: Symbol.for('IHomeUseCase'),

    // View models
    AuthViewModel: Symbol.for('AuthViewModel'),
    LibraryViewModel: Symbol.for('LibraryViewModel'),
    WishlistViewModel: Symbol.for('WishlistViewModel'),
    GameDetailViewModel: Symbol.for('GameDetailViewModel'),
    SearchViewModel: Symbol.for('SearchViewModel'),
    PlatformLinkViewModel: Symbol.for('PlatformLinkViewModel'),
    SettingsViewModel: Symbol.for('SettingsViewModel'),
    HomeViewModel: Symbol.for('HomeViewModel'),
    ProfileViewModel: Symbol.for('ProfileViewModel'),

    // Country preference service
    ICountryPreferenceService: Symbol.for('ICountryPreferenceService'),

    // Push notification service
    PushNotificationService: Symbol.for('PushNotificationService'),
};
