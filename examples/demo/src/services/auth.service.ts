import type { LoginCredentials, AuthUser } from '../types/auth.types';

const AUTH_URL = 'https://gopaddibackend.vgtechdemo.com/api/v1/auth/login';
const TOKEN_STORAGE_KEY = 'callpad_demo_token';
const USER_STORAGE_KEY = 'callpad_demo_user';

// Function to decode JWT without verification (copied from get-token.ts)
function decodeJWT(token: string): any {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const decodedPayload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    );
    return decodedPayload;
  } catch (e) {
    return null;
  }
}

// Extract user info from JWT token
function extractUserFromToken(token: string): AuthUser | null {
  const decoded = decodeJWT(token);
  if (!decoded) return null;

  return {
    id: decoded.sub || decoded.userId || decoded.id,
    email: decoded.email,
    firstName: decoded.firstName || decoded.first_name,
    lastName: decoded.lastName || decoded.last_name,
    avatarUrl: decoded.avatarUrl || decoded.avatar_url,
    exp: decoded.exp,
    iat: decoded.iat,
  };
}

export class AuthService {
  // Login function using the same logic as fetchTokenSilent from get-token.ts
  static async login(credentials: LoginCredentials): Promise<{ token: string; user: AuthUser }> {
    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Authentication failed: ${response.status} ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        if (errorText) {
          errorMessage += ` - ${errorText}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    const data = (await response.json()) as any;
    
    // Debug: Log the actual response structure
    console.log('Login response:', data);
    
    // Extract token from response - try multiple possible locations
    const token = data.token || 
                  data.access_token || 
                  data.jwt || 
                  data.data?.token ||
                  data.data?.access_token ||
                  data.data?.jwt ||
                  data.data?.user_details?.token ||
                  data.data?.user_details?.access_token;

    console.log('Extracted token:', token ? 'Found token' : 'No token found');

    if (!token) {
      console.error('Full response structure:', JSON.stringify(data, null, 2));
      throw new Error('No token found in response');
    }

    // Extract user info from token
    const user = extractUserFromToken(token);
    if (!user) {
      throw new Error('Invalid token format');
    }

    // Store token and user info
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

    return { token, user };
  }

  // Get stored token
  static getToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  // Get stored user
  static getUser(): AuthUser | null {
    const userJson = localStorage.getItem(USER_STORAGE_KEY);
    if (!userJson) return null;
    
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  // Check if user is authenticated and token is valid
  static isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    
    if (!token || !user) return false;

    // Check token expiration if available
    if (user.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (now >= user.exp) {
        this.logout();
        return false;
      }
    }

    return true;
  }

  // Logout and clear storage
  static logout(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  // Get authorization header for API calls
  static getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}