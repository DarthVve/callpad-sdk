import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { AuthService } from '../services/auth.service';
import type { AuthState, LoginCredentials } from '../types/auth.types';

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
    error: null,
  });

  // Initialize auth state on mount
  useEffect(() => {
    const token = AuthService.getToken();
    const user = AuthService.getUser();
    const isAuthenticated = AuthService.isAuthenticated();

    console.log('AuthProvider: Initializing auth state', { isAuthenticated, hasToken: !!token, hasUser: !!user });

    setAuthState({
      isAuthenticated,
      user,
      token,
      loading: false,
      error: null,
    });
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    console.log('AuthProvider: Starting login');
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { token, user } = await AuthService.login(credentials);
      
      console.log('AuthProvider: Login successful', { hasToken: !!token, user });
      
      setAuthState({
        isAuthenticated: true,
        user,
        token,
        loading: false,
        error: null,
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      
      console.error('AuthProvider: Login failed', errorMessage);
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(() => {
    console.log('AuthProvider: Logging out');
    AuthService.logout();
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  const value: AuthContextValue = {
    ...authState,
    login,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}