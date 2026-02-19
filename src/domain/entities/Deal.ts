export class Deal {

    private id: string;
    private storeName: string;
    private price: number;
    private originalPrice: number;
    private discountPercentage: number;
    private url: string;

    constructor(
        id: string,
        storeName: string,
        price: number,
        originalPrice: number,
        discountPercentage: number,
        url: string,
    ) {
        this.id = id;
        this.storeName = storeName;
        this.price = price;
        this.originalPrice = originalPrice;
        this.discountPercentage = discountPercentage;
        this.url = url;
    }

    getId(): string { return this.id; }
    getStoreName(): string { return this.storeName; }
    getPrice(): number { return this.price; }
    getOriginalPrice(): number { return this.originalPrice; }
    getDiscountPercentage(): number { return this.discountPercentage; }
    getUrl(): string { return this.url; }
}
