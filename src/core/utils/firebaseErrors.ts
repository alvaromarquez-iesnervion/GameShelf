const FIREBASE_ERROR_MAP: Record<string, string> = {
    'auth/user-not-found': 'No existe ninguna cuenta con ese correo',
    'auth/wrong-password': 'Contraseña incorrecta',
    'auth/invalid-credential': 'Correo o contraseña incorrectos',
    'auth/email-already-in-use': 'Ya existe una cuenta con ese correo',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
    'auth/invalid-email': 'El formato del correo no es válido',
    'auth/too-many-requests': 'Demasiados intentos. Intenta de nuevo más tarde',
    'auth/requires-recent-login': 'Por seguridad, vuelve a iniciar sesión e inténtalo de nuevo',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
    'auth/network-request-failed': 'Sin conexión a internet',
};

export function mapFirebaseError(error: unknown): string {
    const code = (error as { code?: string })?.code ?? '';
    return FIREBASE_ERROR_MAP[code] ?? 'Ocurrió un error inesperado. Intenta de nuevo más tarde';
}
