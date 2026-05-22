export class User {

    private id: string;
    private email: string;
    private displayName: string;
    private createdAt: Date;
    private notificationsEnabled: boolean = false;
    readonly isGuest: boolean;

    constructor(
        id: string,
        email: string,
        displayName: string,
        createdAt: Date,
        isGuest: boolean = false,
    ) {
        this.id = id;
        this.email = email;
        this.displayName = displayName;
        this.createdAt = createdAt;
        this.isGuest = isGuest;
    }

    getId(): string {
        return this.id;
    }

    getEmail(): string {
        return this.email;
    }

    getDisplayName(): string {
        return this.displayName;
    }

    getCreatedAt(): Date {
        return this.createdAt;
    }

    getNotificationsEnabled(): boolean {
        return this.notificationsEnabled;
    }


    setDisplayName(displayName: string): void {
        this.displayName = displayName;
    }

}