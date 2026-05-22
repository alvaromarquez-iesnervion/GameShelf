import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { makeAutoObservable, runInAction } from 'mobx';
import * as WebBrowser from 'expo-web-browser';
import { IPlatformLinkUseCase } from '../../domain/interfaces/usecases/platforms/IPlatformLinkUseCase';
import { PSN_REDIRECT_URI } from '../../domain/usecases/platforms/PlatformLinkUseCase';
import { LinkedPlatform } from '../../domain/entities/LinkedPlatform';
import { Platform } from '../../domain/enums/Platform';
import { TYPES } from '../../di/types';
import { withLoading } from './BaseViewModel';

/**
 * ViewModel for platform linking.
 *
 * Transient: only active during the platform linking screen.
 */
@injectable()
export class PlatformLinkViewModel {
    private _linkedPlatforms: LinkedPlatform[] = [];
    private _isLinking: boolean = false;
    private _errorMessage: string | null = null;
    private _steamLoginUrl: string | null = null;

    constructor(
        @inject(TYPES.IPlatformLinkUseCase)
        private readonly platformLinkUseCase: IPlatformLinkUseCase,
    ) {
        makeAutoObservable(this);
    }

    get linkedPlatforms(): LinkedPlatform[] {
        return this._linkedPlatforms;
    }

    get isLinking(): boolean {
        return this._isLinking;
    }

    get errorMessage(): string | null {
        return this._errorMessage;
    }

    get steamLoginUrl(): string | null {
        return this._steamLoginUrl;
    }

    async loadLinkedPlatforms(userId: string): Promise<void> {
        await withLoading(this, '_isLinking', '_errorMessage', async () => {
            const platforms = await this.platformLinkUseCase.getLinkedPlatforms(userId);
            runInAction(() => {
                this._linkedPlatforms = platforms;
            });
        });
    }

    generateSteamLoginUrl(returnUrl: string): void {
        const url = this.platformLinkUseCase.getSteamLoginUrl(returnUrl);
        runInAction(() => {
            this._steamLoginUrl = url;
        });
    }

    async linkSteamById(userId: string, profileUrlOrId: string): Promise<boolean> {
        await withLoading(this, '_isLinking', '_errorMessage', async () => {
            await this.platformLinkUseCase.linkSteamById(userId, profileUrlOrId);
        });
        await this.loadLinkedPlatforms(userId);
        if (this.isPlatformLinked(Platform.STEAM)) {
            runInAction(() => { this._errorMessage = null; });
            return true;
        }
        return false;
    }

    async linkSteam(
        userId: string,
        callbackUrl: string,
        params: Record<string, string>,
    ): Promise<boolean> {
        await withLoading(this, '_isLinking', '_errorMessage', async () => {
            await this.platformLinkUseCase.linkSteam(userId, callbackUrl, params);
        });
        await this.loadLinkedPlatforms(userId);
        if (this.isPlatformLinked(Platform.STEAM)) {
            runInAction(() => { this._errorMessage = null; });
            return true;
        }
        return false;
    }

    /**
     * Returns the URL the user must open in the browser to authenticate with Epic
     * and obtain the authorization code.
     */
    getEpicAuthUrl(): string {
        return this.platformLinkUseCase.getEpicAuthUrl();
    }

    getEpicLoginUrl(): string {
        return this.platformLinkUseCase.getEpicLoginUrl();
    }

    /**
     * Links Epic Games using the authorization code obtained from the browser.
     * Preferred flow — requires the user to have copied the ~32-char code.
     */
    async linkEpicByAuthCode(userId: string, authCode: string): Promise<boolean> {
        const result = await withLoading(this, '_isLinking', '_errorMessage', async () => {
            await this.platformLinkUseCase.linkEpicByAuthCode(userId, authCode);
            await this.loadLinkedPlatforms(userId);
            return true;
        });
        return result ?? false;
    }

    async linkEpic(userId: string, fileContent: string): Promise<boolean> {
        const result = await withLoading(this, '_isLinking', '_errorMessage', async () => {
            await this.platformLinkUseCase.linkEpic(userId, fileContent);
            await this.loadLinkedPlatforms(userId);
            return true;
        });
        return result ?? false;
    }

    /** Returns the GOG OAuth2 URL. */
    getGogAuthUrl(): string {
        return this.platformLinkUseCase.getGogAuthUrl();
    }

    /**
     * Links GOG using the authorization code captured from the WebView.
     */
    async linkGogByCode(userId: string, code: string): Promise<boolean> {
        const result = await withLoading(this, '_isLinking', '_errorMessage', async () => {
            await this.platformLinkUseCase.linkGogByCode(userId, code);
            await this.loadLinkedPlatforms(userId);
            return true;
        });
        return result ?? false;
    }

    /**
     * Links PlayStation Network: opens the browser for login and then
     * exchanges the access code for tokens.
     */
    async linkPsn(userId: string): Promise<boolean> {
        const result = await withLoading(this, '_isLinking', '_errorMessage', async () => {
            const loginUrl = this.platformLinkUseCase.getPsnLoginUrl();
            const redirect = await WebBrowser.openAuthSessionAsync(loginUrl, PSN_REDIRECT_URI);
            if (redirect.type !== 'success' || !redirect.url) {
                throw new Error('PSN authentication cancelled or failed.');
            }
            const code = new URL(redirect.url).searchParams.get('code');
            if (!code) throw new Error('No access code received from PSN.');
            await this.platformLinkUseCase.linkPsn(userId, code);
            await this.loadLinkedPlatforms(userId);
            return true;
        });
        return result ?? false;
    }

    async unlinkPlatform(userId: string, platform: Platform): Promise<boolean> {
        const result = await withLoading(this, '_isLinking', '_errorMessage', async () => {
            await this.platformLinkUseCase.unlinkPlatform(userId, platform);
            await this.loadLinkedPlatforms(userId);
            return true;
        });
        return result ?? false;
    }

    isPlatformLinked(platform: Platform): boolean {
        return this._linkedPlatforms.some(p => p.getPlatform() === platform);
    }

    clearError(): void {
        this._errorMessage = null;
    }
}
