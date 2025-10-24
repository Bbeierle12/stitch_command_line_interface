/**
 * Authentication Service - JWT Token Management
 * Handles user authentication, token generation, and role-based access control
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { logger } from '../utils/logger';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'developer' | 'viewer';
  passwordHash?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface TokenPayload {
  userId: string;
  username: string;
  email: string;
  role: User['role'];
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Authentication Service
 */
export class AuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_REFRESH_SECRET: string;
  private readonly ACCESS_TOKEN_EXPIRY: string;
  private readonly REFRESH_TOKEN_EXPIRY: string;
  private readonly SALT_ROUNDS: number;
  
  // In-memory user store (replace with database in production)
  private users: Map<string, User> = new Map();
  private refreshTokens: Map<string, string> = new Map(); // userId -> refreshToken

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
    this.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
    this.ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
    this.REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';
    this.SALT_ROUNDS = 10;

    // Production safety checks
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      // Throw error if using default secrets in production
      if (this.JWT_SECRET.includes('dev-secret') || this.JWT_SECRET.includes('change-this')) {
        throw new Error(
          '🚨 SECURITY ERROR: Cannot use default JWT_SECRET in production! ' +
          'Set a strong JWT_SECRET environment variable.'
        );
      }
      
      if (this.JWT_REFRESH_SECRET.includes('dev-refresh') || this.JWT_REFRESH_SECRET.includes('change-this')) {
        throw new Error(
          '🚨 SECURITY ERROR: Cannot use default JWT_REFRESH_SECRET in production! ' +
          'Set a strong JWT_REFRESH_SECRET environment variable.'
        );
      }

      logger.info('✅ Production JWT secrets validated');
    } else {
      // Development warning
      if (this.JWT_SECRET.includes('dev')) {
        logger.warn('⚠️  WARNING: Using default JWT secret in development. Change in production!');
      }
    }

    // Create default users only in non-production
    if (!isProduction) {
      this.createDefaultUsers();
    } else {
      logger.info('✅ Production mode: Skipping default user creation');
    }
  }

  /**
   * Create default users for development
   */
  private async createDefaultUsers(): Promise<void> {
    try {
      // Admin user
      await this.registerUser({
        username: 'admin',
        email: 'admin@secureide.dev',
        password: 'admin123',
        role: 'admin',
      });

      // Developer user
      await this.registerUser({
        username: 'developer',
        email: 'dev@secureide.dev',
        password: 'dev123',
        role: 'developer',
      });

      logger.info('Default users created: admin/admin123, developer/dev123');
    } catch (error) {
      // Users already exist
    }
  }

  /**
   * Register a new user
   */
  async registerUser(data: {
    username: string;
    email: string;
    password: string;
    role?: User['role'];
  }): Promise<User> {
    const { username, email, password, role = 'developer' } = data;

    // Check if user exists
    if (this.findUserByUsername(username) || this.findUserByEmail(email)) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Create user
    const user: User = {
      id: this.generateUserId(),
      username,
      email,
      role,
      passwordHash,
      createdAt: new Date(),
    };

    this.users.set(user.id, user);
    logger.info(`User registered: ${username} (${role})`);

    // Remove password hash from return value
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Authenticate user and generate tokens
   */
  async login(username: string, password: string): Promise<AuthTokens> {
    const user = this.findUserByUsername(username);

    if (!user || !user.passwordHash) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    user.lastLogin = new Date();

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Store refresh token
    this.refreshTokens.set(user.id, tokens.refreshToken);

    logger.info(`User logged in: ${username}`);
    return tokens;
  }

  /**
   * Logout user
   */
  async logout(userId: string): Promise<void> {
    this.refreshTokens.delete(userId);
    logger.info(`User logged out: ${userId}`);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as TokenPayload;

      // Check if refresh token is stored
      const storedToken = this.refreshTokens.get(payload.userId);
      if (storedToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      // Get user
      const user = this.users.get(payload.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new tokens
      const tokens = this.generateTokens(user);

      // Update stored refresh token
      this.refreshTokens.set(user.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Verify access token and get payload
   */
  verifyToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET) as TokenPayload;
      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      }
      throw new Error('Invalid token');
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private generateTokens(user: User): AuthTokens {
    const payload: TokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
    } as jwt.SignOptions);

    // Calculate expiry time in seconds
    const decoded = jwt.decode(accessToken) as { exp: number };
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Get user by ID
   */
  getUserById(userId: string): User | undefined {
    const user = this.users.get(userId);
    if (user) {
      const { passwordHash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return undefined;
  }

  /**
   * Find user by username
   */
  private findUserByUsername(username: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  /**
   * Find user by email
   */
  private findUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  /**
   * Generate unique user ID
   */
  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Check if user has required role
   */
  hasRole(user: TokenPayload, requiredRole: User['role']): boolean {
    const roleHierarchy: Record<User['role'], number> = {
      viewer: 1,
      developer: 2,
      admin: 3,
    };

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  }

  /**
   * List all users (admin only)
   */
  listUsers(): Omit<User, 'passwordHash'>[] {
    return Array.from(this.users.values()).map(user => {
      const { passwordHash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  /**
   * Update user role (admin only)
   */
  updateUserRole(userId: string, newRole: User['role']): User {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.role = newRole;
    logger.info(`User role updated: ${user.username} -> ${newRole}`);

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Delete user (admin only)
   */
  deleteUser(userId: string): void {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    this.users.delete(userId);
    this.refreshTokens.delete(userId);
    logger.info(`User deleted: ${user.username}`);
  }
}

// Singleton instance
export const authService = new AuthService();
