export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};

export type LibraryStackParamList = {
    Library: undefined;
    GameDetail: { gameId: string; steamAppId?: number };
};

export type SearchStackParamList = {
    Search: undefined;
    GameDetail: { gameId: string; steamAppId?: number };
};

export type WishlistStackParamList = {
    Wishlist: undefined;
    GameDetail: { gameId: string; steamAppId?: number };
};

export type SettingsStackParamList = {
    Settings: undefined;
    PlatformLink: undefined;
    NotificationSettings: undefined;
    Profile: undefined;
};

export type MainTabParamList = {
    SearchTab: undefined;
    LibraryTab: undefined;
    SettingsTab: undefined;
};
