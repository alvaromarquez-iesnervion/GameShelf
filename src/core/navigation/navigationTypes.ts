import { Platform } from '../../domain/enums/Platform';

export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
    ForgotPassword: undefined;
};

export type LibraryStackParamList = {
    Library: undefined;
    GameDetail: { gameId: string; steamAppId?: number; platforms?: Platform[] };
};

export type SearchStackParamList = {
    Search: undefined;
    GameDetail: { gameId: string; steamAppId?: number; platforms?: Platform[] };
};

export type WishlistStackParamList = {
    Wishlist: undefined;
    GameDetail: { gameId: string; steamAppId?: number; platforms?: Platform[] };
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
