/** Account management: deletion and password recovery. */
export interface IAccountManagementUseCase {
    deleteAccount(): Promise<void>;
    resetPassword(email: string): Promise<void>;
}
