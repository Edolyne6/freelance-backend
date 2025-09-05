import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../utils/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *         - role
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           minLength: 8
 *           example: securePassword123
 *         firstName:
 *           type: string
 *           example: John
 *         lastName:
 *           type: string
 *           example: Doe
 *         role:
 *           type: string
 *           enum: [FREELANCER, CLIENT]
 *           example: FREELANCER
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           example: securePassword123
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Login successful
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             accessToken:
 *               type: string
 *               example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *             refreshToken:
 *               type: string
 *               example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  body('role')
    .isIn(['FREELANCER', 'CLIENT'])
    .withMessage('Role must be either FREELANCER or CLIENT'),
  // Optional freelancer fields
  body('hourlyRate')
    .optional()
    .isFloat({ min: 5 })
    .withMessage('Hourly rate must be at least $5'),
  body('bio')
    .optional()
    .isLength({ min: 50, max: 1000 })
    .withMessage('Bio must be between 50 and 1000 characters'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  // Optional client fields
  body('companyName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Company name must be less than 100 characters'),
  body('companySize')
    .optional()
    .isIn(['1-10', '11-50', '51-200', '201-500', '500+'])
    .withMessage('Invalid company size')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, errors.array());
  }

  const { 
    email, password, firstName, lastName, role,
    hourlyRate, bio, skills, companyName, companySize 
  } = req.body;

  // Validate role-specific required fields
  if (role === 'FREELANCER') {
    if (!hourlyRate) {
      throw new AppError('Hourly rate is required for freelancers', 400);
    }
    if (!bio) {
      throw new AppError('Bio is required for freelancers', 400);
    }
  }

  if (role === 'CLIENT') {
    if (!companyName) {
      throw new AppError('Company name is required for clients', 400);
    }
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new AppError('User with this email or username already exists', 409);
  }

  // Hash password
  const passwordHash = await AuthService.hashPassword(password);

  // Prepare user data based on role
  const userData: any = {
    email,
    firstName,
    lastName,
    role,
    passwordHash
  };

  // Add role-specific fields
  if (role === 'FREELANCER') {
    userData.hourlyRate = parseFloat(hourlyRate);
    userData.bio = bio;
  }

  if (role === 'CLIENT' && companyName) {
    userData.companyName = companyName;
    userData.companySize = companySize || null;
  }

  // Create user in transaction to handle skills separately
  const user = await prisma.$transaction(async (tx) => {
    // Create the user first
    const newUser = await tx.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        bio: true,
        isEmailVerified: true,
        averageRating: true,
        totalReviews: true,
        hourlyRate: true,
        companyName: true,
        companySize: true,
        createdAt: true
      }
    });

    // Add skills if provided (for freelancers)
    if (role === 'FREELANCER' && skills && Array.isArray(skills)) {
      await tx.userSkill.createMany({
        data: skills.map((skill: string) => ({
          userId: newUser.id,
          skill: skill.trim()
        }))
      });
    }

    return newUser;
  });

  // Generate tokens
  const tokens = await AuthService.generateTokenPair(user as any);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }
  });
}));

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, errors.array());
  }

  const { email, password } = req.body;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user || !await AuthService.comparePassword(password, user.passwordHash)) {
    throw new AppError('Invalid email or password', 401);
  }

  // Update last seen
  await prisma.user.update({
    where: { id: user.id },
    data: { 
      lastSeen: new Date(),
      isOnline: true
    }
  });

  // Generate tokens
  const tokens = await AuthService.generateTokenPair(user);

  // Return user without sensitive data
  const { passwordHash, ...userWithoutPassword } = user;

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: userWithoutPassword,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }
  });
}));

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  const newAccessToken = await AuthService.refreshAccessToken(refreshToken);

  if (!newAccessToken) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  res.json({
    success: true,
    accessToken: newAccessToken
  });
}));

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const userId = req.user!.id;

  // Update user online status
  await prisma.user.update({
    where: { id: userId },
    data: { isOnline: false }
  });

  // Revoke specific refresh token if provided, otherwise revoke all
  if (refreshToken) {
    await AuthService.revokeRefreshToken(refreshToken);
  } else {
    await AuthService.revokeAllUserTokens(userId);
  }

  res.json({
    success: true,
    message: 'Logout successful'
  });
}));

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: User not found
 */
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, errors.array());
  }

  const { email } = req.body;

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const resetToken = await AuthService.generatePasswordResetToken(user.id);

  // TODO: Send password reset email
  // await emailService.sendPasswordResetEmail(user.email, resetToken);

  res.json({
    success: true,
    message: 'Password reset email sent',
    // Remove this in production - only for testing
    resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
  });
}));

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, errors.array());
  }

  const { token, newPassword } = req.body;

  const user = await AuthService.verifyPasswordResetToken(token);
  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  // Hash new password
  const passwordHash = await AuthService.hashPassword(newPassword);

  // Update password and consume token
  await Promise.all([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    }),
    AuthService.consumePasswordResetToken(token),
    AuthService.revokeAllUserTokens(user.id) // Revoke all existing tokens
  ]);

  res.json({
    success: true,
    message: 'Password reset successful'
  });
}));

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      skills: true,
      languages: true
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Remove sensitive data and transform the response
  const { passwordHash, ...userWithoutPassword } = user;
  
  // Transform skills and languages from separate tables to arrays
  const transformedUser = {
    ...userWithoutPassword,
    skills: user.skills.map(s => s.skill),
    languages: user.languages.map(l => l.language),
    portfolio: user.portfolioData ? JSON.parse(user.portfolioData) : null
  };

  res.json({
    success: true,
    data: transformedUser
  });
}));

export default router;
