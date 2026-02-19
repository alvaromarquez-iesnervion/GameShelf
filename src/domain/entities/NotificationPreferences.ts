export class NotificationPreferences {

    private dealsEnabled: boolean;

    constructor(dealsEnabled: boolean) {
        this.dealsEnabled = dealsEnabled;
    }

    getDealsEnabled(): boolean { return this.dealsEnabled; }
    setDealsEnabled(value: boolean): void { this.dealsEnabled = value; }
}
