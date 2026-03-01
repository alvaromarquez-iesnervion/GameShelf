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
    IGuestSessionRepository: Symbol.for('IGuestSessionRepository'),
    IGameRepository: Symbol.for('IGameRepository'),
    IWishlistRepository: Symbol.for('IWishlistRepository'),
    IPlatformRepository: Symbol.for('IPlatformRepository'),
    INotificationRepository: Symbol.for('INotificationRepository'),

    // Símbolos internos para los wrappers guest-aware (no usar fuera de container.ts)
    FirestorePlatformRepository: Symbol.for('FirestorePlatformRepository'),
    LocalPlatformRepository: Symbol.for('LocalPlatformRepository'),
    FirestoreGameRepository: Symbol.for('FirestoreGameRepository'),
    LocalGameRepository: Symbol.for('LocalGameRepository'),

    // Servicios externos
    ISteamApiService: Symbol.for('ISteamApiService'),
    IEpicGamesApiService: Symbol.for('IEpicGamesApiService'),
    IGogApiService: Symbol.for('IGogApiService'),
    IProtonDbService: Symbol.for('IProtonDbService'),
    IHowLongToBeatService: Symbol.for('IHowLongToBeatService'),
    IIsThereAnyDealService: Symbol.for('IIsThereAnyDealService'),

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
};
