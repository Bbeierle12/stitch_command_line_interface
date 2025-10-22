/**
 * Authentication Service
 * Handles user authentication, token management, and session storage
 */

import { apiClient, ApiClientError } from './apiClient';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthToken {
  token: string;
  expiresAt: string;
}

export interface AuthUser {
  username: string;
  role: string;
  permissions: string[];
}

const TOKEN_STORAGE_KEY = 'cyberops_auth_token';
const TOKEN_EXPIRY_KEY = 'cyberops_auth_expiry';
const USER_STORAGE_KEY = 'cyberops_user';

class AuthService {
  private tokenCheckInterval: number | null = null;

  /**
   * Initialize auth service
   * Restore token from storage and setup auto-refresh
   */
  initialize(): void {
    const token = this.getStoredToken();
    if (token && !this.isTokenExpired()) {
      apiClient.setToken(token);
      this.startTokenExpiryCheck();
    } else {
      this.clearAuth();
    }
  }

  /**
   * Login with username and password
   */
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      const response = await apiClient.post<AuthToken>('/auth/login', credentials);
      
      // Store token and expiry
      this.storeToken(response.token, response.expiresAt);
      apiClient.setToken(response.token);
      
      // Fetch user profile
      const user = await this.fetchUserProfile();
      this.storeUser(user);
      
      // Start token expiry monitoring
      this.startTokenExpiryCheck();
      
      return user;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw new Error(error.message);
      }
      throw new Error('Login failed. Please try again.');
    }
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint if token exists
      if (apiClient.getToken()) {
        await apiClient.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      this.clearAuth();
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<void> {
    try {
      const response = await apiClient.post<AuthToken>('/auth/refresh');
      this.storeToken(response.token, response.expiresAt);
      apiClient.setToken(response.token);
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearAuth();
      throw error;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): AuthUser | null {
    const userJson = localStorage.getItem(USER_STORAGE_KEY);
    if (!userJson) return null;
    
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getStoredToken();
    return !!token && !this.isTokenExpired();
  }

  /**
   * Fetch user profile from API
   */
  private async fetchUserProfile(): Promise<AuthUser> {
    return await apiClient.get<AuthUser>('/auth/profile');
  }

  /**
   * Store token and expiry in localStorage
   */
  private storeToken(token: string, expiresAt: string): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt);
  }

  /**
   * Store user data in localStorage
   */
  private storeUser(user: AuthUser): void {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  /**
   * Get stored token
   */
  private getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  /**
   * Get token expiry time
   */
  private getTokenExpiry(): Date | null {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    return expiry ? new Date(expiry) : null;
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(): boolean {
    const expiry = this.getTokenExpiry();
    if (!expiry) return true;
    
    // Add 5 minute buffer
    const bufferMs = 5 * 60 * 1000;
    return Date.now() + bufferMs >= expiry.getTime();
  }

  /**
   * Clear all authentication data
   */
  private clearAuth(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    apiClient.setToken(null);
    this.stopTokenExpiryCheck();
  }

  /**
   * Start monitoring token expiry
   */
  private startTokenExpiryCheck(): void {
    this.stopTokenExpiryCheck();
    
    // Check every minute
    this.tokenCheckInterval = window.setInterval(() => {
      if (this.isTokenExpired()) {
        console.log('Token expired, attempting refresh...');
        this.refreshToken().catch(() => {
          console.error('Token refresh failed, clearing auth');
          this.clearAuth();
          // Notify user to re-login
          window.dispatchEvent(new CustomEvent('auth:expired'));
        });
      }
    }, 60000);
  }

  /**
   * Stop token expiry monitoring
   */
  private stopTokenExpiryCheck(): void {
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
      this.tokenCheckInterval = null;
    }
  }
}

export const authService = new AuthService();
