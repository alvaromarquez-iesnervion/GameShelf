export const GUEST_ID_PREFIX = 'guest_';
export const GUEST_KEY_ID = '@gameshelf/guest_id';
export const GUEST_KEY_PLATFORMS = '@gameshelf/guest_platforms';
export const GUEST_KEY_LIBRARY = '@gameshelf/guest_library';

/** Returns true when a userId belongs to a guest session. */
export function isGuestUser(userId: string): boolean {
    return userId.startsWith(GUEST_ID_PREFIX);
}

/**
 * Generates a guest UUID using Math.random() (no Buffer API — safe for Hermes/JSC).
 * Returns a string in the form "guest_xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".
 */
export function generateGuestId(): string {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
    return `${GUEST_ID_PREFIX}${uuid}`;
}
