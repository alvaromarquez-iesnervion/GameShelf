import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { makeAutoObservable, runInAction } from 'mobx';
import { ISearchUseCase } from '../../domain/interfaces/usecases/games/ISearchUseCase';
import { SearchResult } from '../../domain/entities/SearchResult';
import { TYPES } from '../../di/types';
import { BaseViewModel } from './BaseViewModel';

/**
 * ViewModel para búsqueda de juegos.
 * 
 * Transient: cada búsqueda es independiente.
 */
@injectable()
export class SearchViewModel extends BaseViewModel {
    private _results: SearchResult[] = [];
    private _query: string = '';
    private _isLoading: boolean = false;
    private _errorMessage: string | null = null;

    constructor(
        @inject(TYPES.ISearchUseCase)
        private readonly searchUseCase: ISearchUseCase,
    ) {
        super();
        makeAutoObservable(this);
    }

    get results(): SearchResult[] {
        return this._results;
    }

    get query(): string {
        return this._query;
    }

    get isLoading(): boolean {
        return this._isLoading;
    }

    get errorMessage(): string | null {
        return this._errorMessage;
    }

    async search(query: string, userId: string): Promise<void> {
        if (!query.trim()) {
            runInAction(() => {
                this._results = [];
                this._query = '';
            });
            return;
        }

        runInAction(() => { this._query = query; });

        await this.withLoading('_isLoading', '_errorMessage', async () => {
            const results = await this.searchUseCase.searchGames(query, userId);
            runInAction(() => {
                this._results = results;
            });
        });
    }

    clearResults(): void {
        this._results = [];
        this._query = '';
    }

    clearError(): void {
        this._errorMessage = null;
    }
}
