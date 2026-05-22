/**
 * Símbolos únicos que Inversify usa como identificadores de servicio.
 * Importado por todas las capas que necesiten resolver dependencias del contenedor.
 */
export const TYPES = {
    // Firebase instances (valores constantes registrados en container.ts)
    FirebaseAuth: Symbol.for('FirebaseAuth'),
    Firestore: Symbol.for('Firestore'),

    // Repositorios
    IAuthRepository: Symbol.for('IAuthRepository'),
    IGameRepository: Symbol.for('IGameRepository'),
    IWishlistRepository: Symbol.for('IWishlistRepository'),
    IPlatformRepository: Symbol.for('IPlatformRepository'),
    INotificationRepository: Symbol.for('INotificationRepository'),
    ISettingsRepository: Symbol.for('ISettingsRepository'),

    // Cliente GameShelfApi
    IGameShelfApiClient: Symbol.for('IGameShelfApiClient'),

    // Casos de uso
    IAuthUseCase: Symbol.for('IAuthUseCase'),
    ILibraryUseCase: Symbol.for('ILibraryUseCase'),
    IWishlistUseCase: Symbol.for('IWishlistUseCase'),
    IGameDetailUseCase: Symbol.for('IGameDetailUseCase'),
    ISearchUseCase: Symbol.for('ISearchUseCase'),
    IPlatformLinkUseCase: Symbol.for('IPlatformLinkUseCase'),
    ISettingsUseCase: Symbol.for('ISettingsUseCase'),
    IHomeUseCase: Symbol.for('IHomeUseCase'),

    // ViewModels
    AuthViewModel: Symbol.for('AuthViewModel'),
    LibraryViewModel: Symbol.for('LibraryViewModel'),
    WishlistViewModel: Symbol.for('WishlistViewModel'),
    GameDetailViewModel: Symbol.for('GameDetailViewModel'),
    SearchViewModel: Symbol.for('SearchViewModel'),
    PlatformLinkViewModel: Symbol.for('PlatformLinkViewModel'),
    SettingsViewModel: Symbol.for('SettingsViewModel'),
    HomeViewModel: Symbol.for('HomeViewModel'),
    ProfileViewModel: Symbol.for('ProfileViewModel'),

    // Country Preference Service
    ICountryPreferenceService: Symbol.for('ICountryPreferenceService'),

    // Push Notification Service
    PushNotificationService: Symbol.for('PushNotificationService'),
};
