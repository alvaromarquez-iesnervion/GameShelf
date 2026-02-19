export class User {

    private id: string;
    private email: string;
    private displayName: string;
    private createdAt: Date;
    private notificationsEnabled: boolean = false;

    constructor(
        id: string,
        email: string,
        displayName: string,
        createdAt: Date,
    ) {
        this.id = id;
        this.email = email;
        this.displayName = displayName;
        this.createdAt = createdAt;
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