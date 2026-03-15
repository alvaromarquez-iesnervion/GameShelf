import { User } from '../../entities/User';

export interface IAuthRepository {
    register(email: string, password: string): Promise<User>;
    login(email: string, password: string): Promise<User>;
    logout(): Promise<void>;
    /** Restaura la sesión al arrancar la app. Devuelve null si no hay sesión activa. */
    getCurrentUser(): Promise<User | null>;
    /** Elimina la cuenta de Firebase Auth del usuario activo. Irreversible. */
    deleteAuthUser(): Promise<void>;
    /** Elimina todas las subcolecciones y el documento raíz de Firestore para el uid dado. */
    deleteUserFirestoreData(uid: string): Promise<void>;
    /** Envía un correo de recuperación de contraseña al email indicado. */
    resetPassword(email: string): Promise<void>;
}
