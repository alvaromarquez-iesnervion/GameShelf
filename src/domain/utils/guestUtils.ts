export const GUEST_ID_PREFIX = 'guest_';
export const GUEST_KEY_ID = '@gameshelf/guest_id';
export const GUEST_KEY_PLATFORMS = '@gameshelf/guest_platforms';
export const GUEST_KEY_LIBRARY = '@gameshelf/guest_library';

/** Returns true when a userId belongs to a guest session. */
export function isGuestUser(userId: string): boolean {
    return userId.startsWith(GUEST_ID_PREFIX);
}

/**
 * Generates a guest UUID using expo-crypto (cryptographically strong, safe for Hermes/JSC).
 * Returns a string in the form "guest_xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".
 */
export function generateGuestId(): string {
    const { randomUUID } = require('expo-crypto') as { randomUUID: () => string };
    return `${GUEST_ID_PREFIX}${randomUUID()}`;
}
