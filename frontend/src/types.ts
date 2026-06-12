/**
 * User interface representing an authenticated user
 */
export interface User {
    id: number;
    username: string;
    email: string;
    role: 'user' | 'admin';
}

/**
 * Auth context value type
 */
export interface AuthContextType {
    user: User | null;
    loading: boolean;
    isLoggedIn: boolean;
    login: (email: string, password: string) => Promise<any>;
    logout: () => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<any>;
}
