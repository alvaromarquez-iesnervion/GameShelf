import { Platform } from '../enums/Platform';

export class LinkedPlatform {

    private platform: Platform;
    private externalUserId: string;
    private linkedAt: Date;

    constructor(
        platform: Platform,
        externalUserId: string,
        linkedAt: Date,
    ) {
        this.platform = platform;
        this.externalUserId = externalUserId;
        this.linkedAt = linkedAt;
    }

    getPlatform(): Platform { return this.platform; }
    // Steam: SteamID 64-bit ("76561198..."). Epic: "imported" (flag de importación)
    getExternalUserId(): string { return this.externalUserId; }
    getLinkedAt(): Date { return this.linkedAt; }
}
