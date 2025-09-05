import jwt, { SignOptions } from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private static readonly SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
  private static readonly JWT_SECRET = process.env.JWT_SECRET!;
  private static readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
  private static readonly JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  /**
   * Hash password with bcrypt and salt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcryptjs.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcryptjs.compare(password, hash);
  }

  /**
   * Generate access token
   */
  static generateAccessToken(payload: JWTPayload): string {
    const options: SignOptions = {
      expiresIn: this.JWT_EXPIRES_IN as any,
      issuer: 'freelance-marketplace',
      audience: 'freelance-marketplace-app'
    };
    return jwt.sign(payload, this.JWT_SECRET, options);
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(payload: JWTPayload): string {
    const options: SignOptions = {
      expiresIn: this.JWT_REFRESH_EXPIRES_IN as any,
      issuer: 'freelance-marketplace',
      audience: 'freelance-marketplace-app'
    };
    return jwt.sign(payload, this.JWT_REFRESH_SECRET, options);
  }

  /**
   * Generate token pair (access + refresh)
   */
  static async generateTokenPair(user: User): Promise<TokenPair> {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    return { accessToken, refreshToken };
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.JWT_SECRET, {
        issuer: 'freelance-marketplace',
        audience: 'freelance-marketplace-app'
      }) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.JWT_REFRESH_SECRET, {
        issuer: 'freelance-marketplace',
        audience: 'freelance-marketplace-app'
      }) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<string | null> {
    // Verify refresh token
    const payload = this.verifyRefreshToken(refreshToken);
    if (!payload) {
      return null;
    }

    // Check if refresh token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      // Remove expired token
      if (storedToken) {
        await prisma.refreshToken.delete({
          where: { id: storedToken.id }
        });
      }
      return null;
    }

    // Generate new access token
    return this.generateAccessToken({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role
    });
  }

  /**
   * Revoke refresh token
   */
  static async revokeRefreshToken(token: string): Promise<boolean> {
    try {
      await prisma.refreshToken.delete({
        where: { token }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  static async revokeAllUserTokens(userId: string): Promise<boolean> {
    try {
      await prisma.refreshToken.deleteMany({
        where: { userId }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate password reset token
   */
  static async generatePasswordResetToken(userId: string): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId,
        expiresAt
      }
    });

    return token;
  }

  /**
   * Verify password reset token
   */
  static async verifyPasswordResetToken(token: string): Promise<User | null> {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      // Clean up expired token
      if (resetToken) {
        await prisma.passwordResetToken.delete({
          where: { id: resetToken.id }
        });
      }
      return null;
    }

    return resetToken.user;
  }

  /**
   * Consume password reset token (delete after use)
   */
  static async consumePasswordResetToken(token: string): Promise<boolean> {
    try {
      await prisma.passwordResetToken.delete({
        where: { token }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clean up expired tokens
   */
  static async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    
    await Promise.all([
      prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: now } }
      }),
      prisma.passwordResetToken.deleteMany({
        where: { expiresAt: { lt: now } }
      })
    ]);
  }
}
