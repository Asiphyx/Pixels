import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { storage } from './storage';
import { userAuthSchema, userRegisterSchema } from '@shared/schema';

export const authRouter = Router();

// Login route
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = userAuthSchema.parse(req.body);
    
    // Verify credentials
    const user = await storage.verifyUser(validatedData.username, validatedData.password);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Return user data (without password)
    const { passwordHash, ...userData } = user;
    
    res.status(200).json({
      message: 'Login successful',
      user: userData
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error processing login request' });
  }
});

// Register route
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = userRegisterSchema.parse(req.body);
    
    // Register new user
    try {
      const user = await storage.registerUser(
        validatedData.username, 
        validatedData.password, 
        validatedData.email,
        req.body.avatar || 'knight' // Default avatar if not provided
      );
      
      // Return user data (without password)
      const { passwordHash, ...userData } = user;
      
      res.status(201).json({
        message: 'User registered successfully',
        user: userData
      });
    } catch (error: any) {
      // Handle duplicate username/email
      if (error.message?.includes('already taken') || error.message?.includes('already registered')) {
        return res.status(409).json({ message: error.message });
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid registration data', errors: error.errors });
    }
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error processing registration request' });
  }
});

// Get current user profile
authRouter.get('/profile/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return user data (without password)
    const { passwordHash, ...userData } = user;
    
    res.status(200).json({
      user: userData
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// Change password
authRouter.post('/change-password/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    // Get user
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const verifiedUser = await storage.verifyUser(user.username, currentPassword);
    
    if (!verifiedUser) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Hash the new password
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    // Update password
    await storage.updateUserPassword(userId, passwordHash);
    
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Error changing password' });
  }
});