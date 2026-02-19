import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { makeAutoObservable, runInAction } from 'mobx';
import { IPlatformLinkUseCase } from '../../domain/interfaces/usecases/platforms/IPlatformLinkUseCase';
import { LinkedPlatform } from '../../domain/entities/LinkedPlatform';
import { Platform } from '../../domain/enums/Platform';
import { TYPES } from '../../di/types';

/**
 * ViewModel para vinculación de plataformas.
 * 
 * Transient: solo activo durante la pantalla de vinculación.
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
        runInAction(() => {
            this._isLinking = true;
            this._errorMessage = null;
        });

        try {
            const platforms = await this.platformLinkUseCase.getLinkedPlatforms(userId);
            runInAction(() => {
                this._linkedPlatforms = platforms;
            });
        } catch (error) {
            runInAction(() => {
                this._errorMessage = (error as Error).message;
            });
        } finally {
            runInAction(() => {
                this._isLinking = false;
            });
        }
    }

    generateSteamLoginUrl(returnUrl: string): void {
        const url = this.platformLinkUseCase.getSteamLoginUrl(returnUrl);
        runInAction(() => {
            this._steamLoginUrl = url;
        });
    }

    async linkSteamById(userId: string, profileUrlOrId: string): Promise<boolean> {
        runInAction(() => {
            this._isLinking = true;
            this._errorMessage = null;
        });

        try {
            await this.platformLinkUseCase.linkSteamById(userId, profileUrlOrId);
            await this.loadLinkedPlatforms(userId);
            return true;
        } catch (error) {
            runInAction(() => {
                this._errorMessage = (error as Error).message;
            });
            return false;
        } finally {
            runInAction(() => {
                this._isLinking = false;
            });
        }
    }

    async linkSteam(
        userId: string,
        callbackUrl: string,
        params: Record<string, string>,
    ): Promise<boolean> {
        runInAction(() => {
            this._isLinking = true;
            this._errorMessage = null;
        });

        try {
            await this.platformLinkUseCase.linkSteam(userId, callbackUrl, params);
            await this.loadLinkedPlatforms(userId);
            return true;
        } catch (error) {
            runInAction(() => {
                this._errorMessage = (error as Error).message;
            });
            return false;
        } finally {
            runInAction(() => {
                this._isLinking = false;
            });
        }
    }

    async linkEpic(userId: string, fileContent: string): Promise<boolean> {
        runInAction(() => {
            this._isLinking = true;
            this._errorMessage = null;
        });

        try {
            await this.platformLinkUseCase.linkEpic(userId, fileContent);
            await this.loadLinkedPlatforms(userId);
            return true;
        } catch (error) {
            runInAction(() => {
                this._errorMessage = (error as Error).message;
            });
            return false;
        } finally {
            runInAction(() => {
                this._isLinking = false;
            });
        }
    }

    async unlinkPlatform(userId: string, platform: Platform): Promise<boolean> {
        runInAction(() => {
            this._isLinking = true;
            this._errorMessage = null;
        });

        try {
            await this.platformLinkUseCase.unlinkPlatform(userId, platform);
            await this.loadLinkedPlatforms(userId);
            return true;
        } catch (error) {
            runInAction(() => {
                this._errorMessage = (error as Error).message;
            });
            return false;
        } finally {
            runInAction(() => {
                this._isLinking = false;
            });
        }
    }

    isPlatformLinked(platform: Platform): boolean {
        return this._linkedPlatforms.some(p => p.getPlatform() === platform);
    }

    clearError(): void {
        this._errorMessage = null;
    }
}
