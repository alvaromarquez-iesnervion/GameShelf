/** Gestión de cuenta: borrado y recuperación de contraseña. */
export interface IAccountManagementUseCase {
    deleteAccount(): Promise<void>;
    resetPassword(email: string): Promise<void>;
}
