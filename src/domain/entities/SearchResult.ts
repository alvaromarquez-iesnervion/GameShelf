export class SearchResult {

    private id: string;
    private title: string;
    private coverUrl: string;
    private isInWishlist: boolean;

    constructor(
        id: string,
        title: string,
        coverUrl: string,
        isInWishlist: boolean,
    ) {
        this.id = id;
        this.title = title;
        this.coverUrl = coverUrl;
        this.isInWishlist = isInWishlist;
    }

    getId(): string { return this.id; }
    getTitle(): string { return this.title; }
    getCoverUrl(): string { return this.coverUrl; }
    getIsInWishlist(): boolean { return this.isInWishlist; }

    // Se actualiza en SearchUseCase tras cruzar con IWishlistRepository.isInWishlist()
    setIsInWishlist(value: boolean): void { this.isInWishlist = value; }
}
