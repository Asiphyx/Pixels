import { Router, Request, Response } from 'express';
import { storage } from './storage';
import { z } from 'zod';

export const inventoryRouter = Router();

// Get all game items
inventoryRouter.get('/items', async (req: Request, res: Response) => {
  try {
    const items = await storage.getItems();
    res.status(200).json({ items });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Error fetching items' });
  }
});

// Get specific item by ID
inventoryRouter.get('/items/:id', async (req: Request, res: Response) => {
  try {
    const itemId = parseInt(req.params.id);
    
    if (isNaN(itemId)) {
      return res.status(400).json({ message: 'Invalid item ID' });
    }
    
    const item = await storage.getItem(itemId);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.status(200).json({ item });
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ message: 'Error fetching item' });
  }
});

// Get user's inventory
inventoryRouter.get('/user/:userId/inventory', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const inventoryItems = await storage.getUserInventory(userId);
    res.status(200).json({ inventory: inventoryItems });
  } catch (error) {
    console.error('Error fetching user inventory:', error);
    res.status(500).json({ message: 'Error fetching user inventory' });
  }
});

// Get user's equipped items
inventoryRouter.get('/user/:userId/equipped', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const equippedItems = await storage.getEquippedItems(userId);
    res.status(200).json({ equipped: equippedItems });
  } catch (error) {
    console.error('Error fetching equipped items:', error);
    res.status(500).json({ message: 'Error fetching equipped items' });
  }
});

// Add item to user's inventory
inventoryRouter.post('/user/:userId/inventory/add', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const schema = z.object({
      itemId: z.number(),
      quantity: z.number().optional().default(1)
    });
    
    // Validate request body
    const validatedData = schema.parse(req.body);
    
    // Add item to inventory
    const inventoryItem = await storage.addItemToInventory(userId, validatedData.itemId, validatedData.quantity);
    
    res.status(200).json({
      message: 'Item added to inventory',
      inventoryItem
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
    }
    console.error('Error adding item to inventory:', error);
    res.status(500).json({ message: 'Error adding item to inventory' });
  }
});

// Remove item from user's inventory
inventoryRouter.post('/user/:userId/inventory/remove', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const schema = z.object({
      itemId: z.number(),
      quantity: z.number().optional().default(1)
    });
    
    // Validate request body
    const validatedData = schema.parse(req.body);
    
    // Remove item from inventory
    const success = await storage.removeItemFromInventory(userId, validatedData.itemId, validatedData.quantity);
    
    if (!success) {
      return res.status(404).json({ message: 'Item not found in inventory' });
    }
    
    res.status(200).json({
      message: 'Item removed from inventory'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
    }
    console.error('Error removing item from inventory:', error);
    res.status(500).json({ message: 'Error removing item from inventory' });
  }
});

// Equip an item
inventoryRouter.post('/user/:userId/inventory/equip', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const schema = z.object({
      itemId: z.number(),
      slot: z.string()
    });
    
    // Validate request body
    const validatedData = schema.parse(req.body);
    
    // Equip the item
    const equippedItem = await storage.equipItem(userId, validatedData.itemId, validatedData.slot);
    
    if (!equippedItem) {
      return res.status(404).json({ message: 'Item not found in inventory' });
    }
    
    res.status(200).json({
      message: 'Item equipped',
      equippedItem
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
    }
    
    if (error instanceof Error && error.message === 'Invalid equipment slot') {
      return res.status(400).json({ message: error.message });
    }
    
    console.error('Error equipping item:', error);
    res.status(500).json({ message: 'Error equipping item' });
  }
});

// Unequip an item
inventoryRouter.post('/user/:userId/inventory/unequip', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const schema = z.object({
      itemId: z.number()
    });
    
    // Validate request body
    const validatedData = schema.parse(req.body);
    
    // Unequip the item
    const unequippedItem = await storage.unequipItem(userId, validatedData.itemId);
    
    if (!unequippedItem) {
      return res.status(404).json({ message: 'Item not found or not equipped' });
    }
    
    res.status(200).json({
      message: 'Item unequipped',
      unequippedItem
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
    }
    console.error('Error unequipping item:', error);
    res.status(500).json({ message: 'Error unequipping item' });
  }
});

// Get user's currency
inventoryRouter.get('/user/:userId/currency', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const currency = await storage.getCurrency(userId);
    res.status(200).json({ currency });
  } catch (error) {
    console.error('Error fetching currency:', error);
    res.status(500).json({ message: 'Error fetching currency' });
  }
});

// Add currency to user
inventoryRouter.post('/user/:userId/currency/add', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const schema = z.object({
      silver: z.number().min(0)
    });
    
    // Validate request body
    const validatedData = schema.parse(req.body);
    
    // Add currency
    const currency = await storage.addCurrency(userId, validatedData.silver);
    
    res.status(200).json({
      message: 'Currency added',
      currency
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
    }
    console.error('Error adding currency:', error);
    res.status(500).json({ message: 'Error adding currency' });
  }
});

// Spend currency
inventoryRouter.post('/user/:userId/currency/spend', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const schema = z.object({
      silver: z.number().min(0)
    });
    
    // Validate request body
    const validatedData = schema.parse(req.body);
    
    // Spend currency
    const result = await storage.spendCurrency(userId, validatedData.silver);
    
    if (!result) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }
    
    res.status(200).json({
      message: 'Currency spent',
      currency: result
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
    }
    console.error('Error spending currency:', error);
    res.status(500).json({ message: 'Error spending currency' });
  }
});