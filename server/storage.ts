import { 
  users, type User, type InsertUser,
  rooms, type Room, type InsertRoom,
  messages, type Message, type InsertMessage,
  bartenders, type Bartender, type InsertBartender,
  menuItems, type MenuItem, type InsertMenuItem,
  bartenderMoods, type BartenderMood, type InsertBartenderMood,
  bartenderMemories, type BartenderMemory, type InsertBartenderMemory,
  type MemoryEntry, memoryEntrySchema,
  items, type Item, type InsertItem,
  userInventory, type UserInventory, type InsertUserInventory,
  equipmentSlotTypes, type EquipmentSlot
} from "@shared/schema";
import { db } from './db';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { type } from 'os';

import { IStorage } from './storage.interface';

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private rooms: Map<number, Room>;
  private messages: Map<number, Message>;
  private bartenders: Map<number, Bartender>;
  private menuItems: Map<number, MenuItem>;
  private bartenderMoods: Map<string, BartenderMood>; // key: "userId-bartenderId"
  private bartenderMemories: Map<string, BartenderMemory>; // key: "userId-bartenderId"
  
  private userId: number;
  private roomId: number;
  private messageId: number;
  private bartenderId: number;
  private menuItemId: number;
  private moodId: number;
  private memoryId: number;
  private items: Map<number, Item>;
  private userInventory: Map<string, UserInventory>; // Changed to string key for "userId-itemId"
  private inventoryItemId: number; // Added missing property

  private itemId: number;
  constructor() {
    this.users = new Map();
    this.rooms = new Map();
    this.messages = new Map();
    this.bartenders = new Map();
    this.menuItems = new Map();
    this.bartenderMoods = new Map();
    this.bartenderMemories = new Map();
    
    this.userId = 1;
    this.roomId = 1;
    this.messageId = 1;
    this.bartenderId = 1;
    this.menuItemId = 1;
    this.moodId = 1;
    this.memoryId = 1;
    this.itemId = 1;
    this.inventoryItemId = 1; // Initialize the inventory item ID
    this.items = new Map();
    this.userInventory = new Map();
    
    // Initialize with default data in the constructor
    // These need to be after the userId, bartenderId and menuItemId
    // are defined because the create functions use them
    // We also need to use the methods createBartender and createMenuItem
    // as they add the items to the maps.
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default bartenders - the three gems
    const defaultBartenders: InsertBartender[] = [
      { 
        name: "Amethyst", 
        sprite: "amethyst", 
        avatar: "amethyst", 
        personality: "The pink-haired sister on the left. Sweet and charming, always ready with a kind word."
      },
      { 
        name: "Sapphire", 
        sprite: "sapphire", 
        avatar: "sapphire", 
        personality: "The blue-haired sister in the middle. Intelligent and witty, great at solving problems."
      },
      { 
        name: "Ruby", 
        sprite: "ruby", 
        avatar: "ruby", 
        personality: "The red-haired sister on the right. Fiery and passionate, tells amazing stories about adventures."
      }
    ];
    
    // Create bartenders first so we have their IDs
    defaultBartenders.forEach(bartender => this.createBartender(bartender)); // Calls createBartender
    
    // Create default rooms - one for each gem
    const defaultRooms: InsertRoom[] = [
      { name: "The Rose Garden", description: "A warm and inviting space with Amethyst's sweet service." },
      { name: "The Ocean View", description: "A thoughtful atmosphere where Sapphire offers clever insights." },
      { name: "The Dragon's Den", description: "An exciting corner where Ruby shares thrilling tales." }
    ];
    
    defaultRooms.forEach(room => this.createRoom(room));
    
    // Create default menu items
    const defaultDrinks: InsertMenuItem[] = [
      {
        name: "Dragon's Breath Ale",
        description: "Strong ale with a fiery kick that'll warm your bones",
        price: 5,
        category: "drinks",
        icon: "dragonAle"
      },
      {
        name: "Elven Moonshine",
        description: "Delicate spirits distilled under a full moon",
        price: 12,
        category: "drinks",
        icon: "elvenMoonshine"
      },
      {
        name: "Dwarven",
        description: "Sweet honey mead from the mountain halls",
        price: 8,
        category: "drinks",
        icon: "dwarvenMead"
      },
      {
        name: "Wizard's Brew",
        description: "Glowing blue concoction with mysterious effects",
        price: 15,
        category: "drinks",
        icon: "wizardBrew"
      }
    ];
    
    const defaultFood: InsertMenuItem[] = [
      {
        name: "Hearty Stew",
        description: "Thick and filling stew with chunks of meat and vegetables",
        price: 10,
        category: "food",
        icon: "heartyStew"
      },
      {
        name: "Roasted Pheasant",
        description: "Whole bird roasted with herbs and served with potatoes",
        price: 18,
        category: "food",
        icon: "roastedPheasant"
      },
      {
        name: "Elven Bread",
        description: "Light and filling bread that stays fresh for days",
        price: 6,
        category: "food",
        icon: "elvenBread"
      },
      {
        name: "Cheese Platter",
        description: "Assortment of fine cheeses from across the realm",
        price: 15,
        category: "food",
        icon: "cheesePlatter"
      }
    ];
    
    const defaultSpecials: InsertMenuItem[] = [
      {
        name: "Hero's Feast",
        description: "Legendary meal that grants vigor and strength",
        price: 30,
        category: "specials",
        icon: "herosFeast"
      },
      {
        name: "Fairy Wine",
        description: "Shimmering wine that makes you feel light as air",
        price: 25,
        category: "specials",
        icon: "fairyWine"
      },
      {
        name: "Goblin Surprise",
        description: "You never know what you'll get, but it's always interesting",
        price: 8,
        category: "specials",
        icon: "goblinSurprise"
      },
      {
        name: "Midnight Whiskey",
        description: "Dark as night with hints of smoke and mystery",
        price: 20,
        category: "specials",
        icon: "midnightWhiskey"
      }
    ];
    
    [...defaultDrinks, ...defaultFood, ...defaultSpecials].forEach(item => this.createMenuItem(item)); // Calls createMenuItem
  }
  // User operations
  async addCurrency(userId: number, silver: number): Promise<{ silver: number; gold: number; }> {
    // Implementation for adding currency
    const user = await this.getUser(userId);
    return { silver: user?.silver || 0, gold: user?.gold || 0 };
  }
  async spendCurrency(userId: number, silver: number): Promise<{ silver: number; gold: number; } | null> {
    // Implementation for spending currency
    return null;
  }
  async getCurrency(userId: number): Promise<{ silver: number; gold: number; }> {
    // Implementation for getting currency
    const user = await this.getUser(userId);
    return { silver: user?.silver || 0, gold: user?.gold || 0 };
  }
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Already case-insensitive, but let's make it explicit for consistency
    const lowercaseUsername = username.toLowerCase();
    for (const user of this.users.values()) {
      if (user.username.toLowerCase() === lowercaseUsername) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const timestamp = new Date();
    // Handle undefined email by setting it to null
    const email = insertUser.email !== undefined ? insertUser.email : null;
    const user: User = {
      ...insertUser,
      id,
      passwordHash: null,
      joinedAt: timestamp,
      email: email,
      online: true,
      roomId: insertUser.roomId ?? 1,
      level: insertUser.level ?? 1,
      silver: insertUser.silver ?? 0,
      gold: insertUser.gold ?? 0
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserRoom(userId: number, roomId: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (user) {
      const updatedUser: User = { ...user, roomId };
      this.users.set(userId, updatedUser);
      return updatedUser;
    }
    return undefined;
  }

  async updateUserStatus(userId: number, online: boolean): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (user) {
      const updatedUser: User = { ...user, online };
      this.users.set(userId, updatedUser);
      return updatedUser;
    }
    return undefined;
  }

  async getOnlineUsers(roomId: number): Promise<User[]> {
    const onlineUsers: User[] = [];
    for (const user of this.users.values()) {
      if (user.online && user.roomId === roomId) {
        onlineUsers.push(user);
      }
    }
    return onlineUsers;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    // Already case-insensitive, but let's make it explicit for consistency
    const lowercaseEmail = email.toLowerCase();
    for (const user of this.users.values()) {
      if (user.email && user.email.toLowerCase() === lowercaseEmail) {
        return user;
      }
    }
    return undefined;
  }

  async updateUserPassword(userId: number, passwordHash: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (user) {
      const updatedUser: User = { ...user, passwordHash };
      this.users.set(userId, updatedUser);
      return updatedUser;
    }
    return undefined;
  }
  
  async registerUser(username: string, password: string, email?: string, avatar: string = 'knight'): Promise<User> {
    const existingUser = await this.getUserByUsername(username);
    if (existingUser) {
      throw new Error('Username already taken');
    }
    if (email) {
      const existingEmail = await this.getUserByEmail(email);
      if (existingEmail) {
        throw new Error('Email already registered');
      }
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = await this.createUser({ username, email: email || null, avatar, silver: 100, gold: 0, level: 1, roomId: 1, online: true });
    const updatedUser = await this.updateUserPassword(user.id, passwordHash);
    
    return updatedUser!;
  }

  async verifyUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    return user && user.passwordHash && await bcrypt.compare(password, user.passwordHash) ? user : null;
  }

  // Room operations
  async getRoom(id: number): Promise<Room | undefined> {
    return this.rooms.get(id);
  }  

  async getRoomByName(name: string): Promise<Room | undefined> {
    // Already case-insensitive, but let's make it explicit for consistency
    const lowercaseName = name.toLowerCase();
    for (const room of this.rooms.values()) {
      if (room.name.toLowerCase() === lowercaseName) {
        return room;
      }
    }
    return undefined;
  }

  async getRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values());
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = this.roomId++;
    const room: Room = { ...insertRoom, id };
    this.rooms.set(id, room);
    return room;
  }

  // Message operations
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const timestamp = new Date();

    const message: Message = { 
      ...insertMessage, 
      id, 
      timestamp, 
      type: insertMessage.type || 'text',
      userId: insertMessage.userId !== undefined ? insertMessage.userId : null,
      bartenderId: insertMessage.bartenderId !== undefined ? insertMessage.bartenderId : null,
    };
    
    this.messages.set(id, message);
    return message; // Return the original message
  }

  async getMessagesByRoom(roomId: number, limit = 50): Promise<Message[]> {
    const roomMessages: Message[] = [];
    // **IMPORTANT** - Add a comment to remind users to update their tsconfig.json
    // To use the most recent iterator features, add `"downlevelIteration": true` to the `compilerOptions` section.
    for (const message of this.messages.values()) {
      if (message.roomId === roomId) {
        roomMessages.push(message);
      }
    }
    
    // Sort by timestamp (newest first) and limit
    return roomMessages.sort((a, b) => {
      if (!a.timestamp && !b.timestamp) return 0;
      if (!a.timestamp) return -1; // Treat null as earlier
      if (!b.timestamp) return 1; // Treat null as earlier
      return a.timestamp.getTime() - b.timestamp.getTime();
    }).slice(-limit); 
  }

  // Bartender operations
  async getBartenders(): Promise<Bartender[]> {
    return Array.from(this.bartenders.values());
  }

  async getBartender(id: number): Promise<Bartender | undefined> {
    return this.bartenders.get(id);
  }

  async createBartender(insertBartender: InsertBartender): Promise<Bartender> {
    const id = this.bartenderId++;
    const bartender: Bartender = { ...insertBartender, id };
    this.bartenders.set(id, bartender);
    return bartender;
  }

  // Menu operations
  async getMenuItems(category?: string): Promise<MenuItem[]> {
    if (category) {
      return Array.from(this.menuItems.values()).filter(
        item => item.category === category
      );
    }
    return Array.from(this.menuItems.values());
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    return this.menuItems.get(id);
  }

  async createMenuItem(insertMenuItem: InsertMenuItem): Promise<MenuItem> {
    const id = this.menuItemId++;
    const menuItem: MenuItem = { ...insertMenuItem, id };
    this.menuItems.set(id, menuItem);
    return menuItem;
  }

  // Bartender Mood operations
  async getBartenderMood(userId: number, bartenderId: number): Promise<BartenderMood | undefined> {
    const key = `${userId}-${bartenderId}`;
    return this.bartenderMoods.get(key);
  }

  async createBartenderMood(mood: InsertBartenderMood): Promise<BartenderMood> {
    const id = this.moodId++;
    const timestamp = new Date();
    const bartenderMood: BartenderMood = { 
      ...mood,
      mood: mood.mood ?? 50, 
      id,
      updatedAt: timestamp
    };
    
    const key = `${mood.userId}-${mood.bartenderId}`;
    this.bartenderMoods.set(key, bartenderMood);
    return bartenderMood;

  }

  async updateBartenderMood(userId: number, bartenderId: number, moodChange: number): Promise<BartenderMood> {
    const key = `${userId}-${bartenderId}`;
    let mood = this.bartenderMoods.get(key);
    
    if (!mood) {
      // Create a new mood entry with default neutral mood
      mood = await this.createBartenderMood({ 
        userId, 
        bartenderId, 
        mood: 50 // Neutral mood by default
      });
    }
    
    // Calculate new mood value, clamped between 0 and 100
    const newMoodValue = Math.max(0, Math.min(100, mood.mood + moodChange));
    
    // Update mood
    const updatedMood: BartenderMood = { 
      ...mood, 
      mood: newMoodValue,
      updatedAt: new Date()
    };
    
    this.bartenderMoods.set(key, updatedMood);
    return updatedMood;
  }

  async getAllBartenderMoodsForUser(userId: number): Promise<BartenderMood[]> {
    const userMoods: BartenderMood[] = [];
    
    for (const [key, mood] of this.bartenderMoods.entries()) {
      if (key.startsWith(`${userId}-`)) {
        userMoods.push(mood);
      }
    }
    
    return userMoods;
  }

  // Bartender Memory operations
  async getBartenderMemory(userId: number, bartenderId: number): Promise<BartenderMemory | undefined> {
    const key = `${userId}-${bartenderId}`;
    return this.bartenderMemories.get(key);
  }

  async createBartenderMemory(memory: InsertBartenderMemory): Promise<BartenderMemory> {
    const id = this.memoryId++;
    const timestamp = new Date();
    
    const bartenderMemory: BartenderMemory = {
      ...memory,
      id,
      memories: [],
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    
    const key = `${memory.userId}-${memory.bartenderId}`;
    this.bartenderMemories.set(key, bartenderMemory);
    return bartenderMemory;
  }

  async addMemoryEntry(userId: number, bartenderId: number, entry: MemoryEntry): Promise<BartenderMemory> {
    const key = `${userId}-${bartenderId}`;
    let memory = this.bartenderMemories.get(key);
    
    if (!memory) {
      // Create a new memory record for this user-bartender pair
      memory = await this.createBartenderMemory({
        userId,
        bartenderId,
        memories: '[]'
      });
    }
    
    // Parse existing memories, add new one, then stringify back to JSON
    let memories: MemoryEntry[] = [];
    try {
      // Handle null, undefined, or invalid JSON
      if (memory.memories && typeof memory.memories === 'string') {
        memories = JSON.parse(memory.memories) as MemoryEntry[];
      }
      
      // If memories is not an array after parsing, initialize it
      if (!Array.isArray(memories)) {
        memories = [];
      }
    } catch (error) {
      console.error('Error parsing memory entries in MemStorage:', error);
      // If there's an error parsing, start with an empty array
      memories = [];
    }
    
    // Add new entry to memory array
    memories.push({
      ...entry,
      timestamp: new Date()
    });
    
    // Sort memories by timestamp (newest first)
    memories.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Update the memories
    const updatedMemory: BartenderMemory = {
      ...memory,
      memories: JSON.stringify(memories),
      updatedAt: new Date()
    };
    
    this.bartenderMemories.set(key, updatedMemory);
    return updatedMemory;
  }

  async getMemoryEntries(userId: number, bartenderId: number, limit = 10): Promise<MemoryEntry[]> {
    const memory = await this.getBartenderMemory(userId, bartenderId);
    
    if (!memory) {
      return [];
    }
    
    try {
      // Handle null, undefined, or invalid JSON
      let memories: MemoryEntry[] = [];
      if (memory.memories && typeof memory.memories === 'string') {
        memories = JSON.parse(memory.memories) as MemoryEntry[];
      }
      
      // If memories is not an array after parsing, initialize it
      if (!Array.isArray(memories)) {
        memories = [];
        return [];
      }
      
      // Sort by timestamp (newest first) and limit
      memories.sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      });
      
      return memories.slice(0, limit);
    } catch (error) {
      console.error('Error parsing memory entries in MemStorage:', error);
      return [];
    }
  }

  async getSummarizedMemories(userId: number, bartenderId: number, maxEntries = 5): Promise<string> {
    try {
      const entries = await this.getMemoryEntries(userId, bartenderId, maxEntries);
      
      if (!entries || entries.length === 0) {
        return "This customer is new. No previous interactions.";
      }
      
      // Generate a summarized format for each memory with error handling
      const memorySummaries = entries.map(entry => {
        try {
          const dateStr = entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : 'Unknown date';
          let summary = `[${dateStr}, ${entry.type || 'interaction'}${entry.importance ? `, importance: ${entry.importance}` : ''}] ${entry.content || 'Interaction recorded'}`;
          
          if (entry.context) {
            summary += ` (Context: ${entry.context})`;
          }
          
          return summary;
        } catch (error) {
          // Fallback for any problematic memory entry
          return `- Past interaction recorded`;
        }
      });
      
      return memorySummaries.join('\n');
    } catch (error) {
      console.error('Error processing memories for summary in MemStorage:', error);
      return "Unable to retrieve previous interactions.";
    }
  }
  
  // Inventory operations
  async getItems(): Promise<Item[]> {
    return Array.from(this.items.values());
  }

  async getItem(id: number): Promise<Item | undefined> {
    return this.items.get(id);
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const id = this.itemId++;
    const timestamp = new Date();
    const item: Item = {
      ...insertItem,
      id,
      createdAt: timestamp,
      rarity: insertItem.rarity ?? 'common',
      stackable: insertItem.stackable ?? false,
      maxStack: insertItem.maxStack ?? 1,
      icon: insertItem.icon ?? 'default_item',
      stats: insertItem.stats ?? '{}'
    };
    this.items.set(id, item);
    return item;
  }

  // Implementation for IStorage.createBaseItem
  async createBaseItem(insertItem: InsertItem): Promise<Item> {
    return this.createItem(insertItem);
  }

  async getUserInventory(userId: number): Promise<(UserInventory & { item: Item; })[]> {
    const inventory: (UserInventory & { item: Item; })[] = [];
    for (const [key, inventoryItem] of this.userInventory.entries()) {
      if (inventoryItem.userId === userId) {
        const item = this.items.get(inventoryItem.itemId);
        if (item) {
          inventory.push({ ...inventoryItem, item });
        }
      }
    }
    return inventory;
  }

  async getUserInventoryItem(userId: number, itemId: number): Promise<UserInventory | undefined> {
    const key = `${userId}-${itemId}`;
    return this.userInventory.get(key);
  }

  async addItemToInventory(userId: number, itemId: number, quantity: number = 1): Promise<UserInventory> {
    const item = await this.getItem(itemId);
    if (!item) throw new Error('Item not found');
    
    const key = `${userId}-${itemId}`;
    const existingInventory = this.userInventory.get(key);
    
    if (existingInventory) {
      const updatedInventory = {
        ...existingInventory,
        quantity: existingInventory.quantity + quantity,
        updatedAt: new Date()
      };
      this.userInventory.set(key, updatedInventory);
      return updatedInventory;
    } else {
      const newInventory = {
        id: this.inventoryItemId++,
        userId,
        itemId,
        quantity,
        equipped: false,
        equipSlot: null,
        updatedAt: new Date()
      };
      this.userInventory.set(key, newInventory);
      return newInventory;
    }
  }
  
  async removeItemFromInventory(userId: number, itemId: number, quantity: number = 1): Promise<boolean> {
    const key = `${userId}-${itemId}`;
    const existingInventory = this.userInventory.get(key);
    
    if (!existingInventory) return false;
    
    if (existingInventory.quantity <= quantity) {
      this.userInventory.delete(key);
    } else {
      this.userInventory.set(key, {
        ...existingInventory,
        quantity: existingInventory.quantity - quantity,
        updatedAt: new Date()
      });
    }
    return true;
  }

  async equipItem(userId: number, itemId: number, slot: string): Promise<UserInventory | null> {
    const key = `${userId}-${itemId}`;
    const inventoryItem = this.userInventory.get(key);
    
    if (!inventoryItem) return null;
    
    // Unequip any item in the same slot
    for (const [otherKey, otherItem] of this.userInventory.entries()) {
      if (otherItem.userId === userId && otherItem.equipped && otherItem.equipSlot === slot) {
        this.userInventory.set(otherKey, {
          ...otherItem,
          equipped: false,
          equipSlot: null,
          updatedAt: new Date()
        });
      }
    }
    
    const updatedItem = {
      ...inventoryItem,
      equipped: true,
      equipSlot: slot,
      updatedAt: new Date()
    };
    this.userInventory.set(key, updatedItem);
    return updatedItem;
  }

  async unequipItem(userId: number, itemId: number): Promise<UserInventory | null> {
    const key = `${userId}-${itemId}`;
    const inventoryItem = this.userInventory.get(key);
    
    if (!inventoryItem || !inventoryItem.equipped) return null;
    
    const updatedItem = {
      ...inventoryItem,
      equipped: false,
      equipSlot: null,
      updatedAt: new Date()
    };
    this.userInventory.set(key, updatedItem);
    return updatedItem;
  }

  async getEquippedItems(userId: number): Promise<(UserInventory & { item: Item; })[]> {
    const equippedItems: (UserInventory & { item: Item; })[] = [];
    
    for (const [key, inventoryItem] of this.userInventory.entries()) {
      if (inventoryItem.userId === userId && inventoryItem.equipped) {
        const item = this.items.get(inventoryItem.itemId);
        if (item) {
          equippedItems.push({ ...inventoryItem, item });
        }
      }
    }
    
    return equippedItems;
  }
  
  // Required by IStorage interface
  async hasItem(userId: number, itemId: number, quantity: number = 1): Promise<boolean> {
    const inventoryItem = await this.getUserInventoryItem(userId, itemId);
    return !!inventoryItem && inventoryItem.quantity >= quantity;
  }
  
  async transferItem(senderId: number, receiverId: number, itemId: number, quantity: number = 1): Promise<boolean> {
    // Check if sender has the item
    const senderHasItem = await this.hasItem(senderId, itemId, quantity);
    if (!senderHasItem) return false;
    
    // Remove from sender
    await this.removeItemFromInventory(senderId, itemId, quantity);
    
    // Add to receiver
    await this.addItemToInventory(receiverId, itemId, quantity);
    
    return true;
  }
  
  async craftItem(userId: number, craftedItemId: number, materials: {itemId: number, quantity: number}[]): Promise<Item | null> {
    // Check if user has all required materials
    for (const material of materials) {
      const hasItem = await this.hasItem(userId, material.itemId, material.quantity);
      if (!hasItem) return null;
    }
    
    // Remove all materials from inventory
    for (const material of materials) {
      await this.removeItemFromInventory(userId, material.itemId, material.quantity);
    }
    
    // Get the crafted item
    const craftedItem = await this.getItem(craftedItemId);
    if (!craftedItem) return null;
    
    // Add crafted item to inventory
    await this.addItemToInventory(userId, craftedItemId, 1);
    
    return craftedItem;
  }
}

export class MessageStorage {
  private userStorage: MemStorage;
  private roomStorage: MemStorage;
  private messageStorage: MemStorage;
  private bartenderStorage: MemStorage;
  private menuItemStorage: MemStorage;
  private bartenderMoodStorage: BartenderMoodStorage;

  constructor() {
    this.userStorage = new MemStorage();
    this.roomStorage = new MemStorage();
    this.messageStorage = new MemStorage();
    this.bartenderStorage = new MemStorage();
    this.menuItemStorage = new MemStorage();
    this.bartenderMoodStorage = new BartenderMoodStorage();
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values({
        ...message,
        timestamp: new Date()
      })
      .returning();
    return newMessage;
  }

  async getItems(): Promise<Item[]> {
    return db.select().from(items);
  }

  async getItem(id: number): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item || undefined;
  }

  async getMessagesByRoom(roomId: number, limit = 50): Promise<Message[]> {
    const roomMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.roomId, roomId))
      .orderBy(desc(messages.timestamp))
      .limit(limit);
    
    return roomMessages;
  }
  async getCurrency(userId: number): Promise<{silver: number, gold: number}> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      silver: user.silver || 0,
      gold: user.gold || 0
    };
  }
  
  async addCurrency(userId: number, silver: number): Promise<{silver: number, gold: number}> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Calculate new totals
    let totalSilver = (user.silver || 0) + silver;
    let goldToAdd = 0;
    
    // Convert silver to gold if it exceeds 100
    if (totalSilver >= 100) {
      goldToAdd = Math.floor(totalSilver / 100);
      totalSilver = totalSilver % 100;
    }
    
    const totalGold = (user.gold || 0) + goldToAdd;
    
    // Update the user's currency
    await db.update(users)
      .set({ 
        silver: totalSilver,
        gold: totalGold
      })
      .where(eq(users.id, userId));
    
    return { silver: totalSilver, gold: totalGold };
  }
  
  async spendCurrency(userId: number, silver: number): Promise<{silver: number, gold: number} | null> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Calculate total wealth in silver
    const userSilver = user.silver || 0;
    const userGold = user.gold || 0;
    const totalWealthInSilver = userSilver + (userGold * 100);
    
    // Check if user has enough currency
    if (totalWealthInSilver < silver) {
      return null; // Not enough funds
    }
    
    // Calculate remaining silver after purchase
    let remainingSilver = totalWealthInSilver - silver;
    
    // Calculate new silver and gold values
    const newGold = Math.floor(remainingSilver / 100);
    const newSilver = remainingSilver % 100;
    
    // Update the user's currency
    await db.update(users)
      .set({ 
        silver: newSilver,
        gold: newGold
      })
      .where(eq(users.id, userId));
    
    return { silver: newSilver, gold: newGold };
  }

  // User operations, delegate to userStorage
  async getUser(id: number): Promise<User | undefined> {
    return this.userStorage.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.userStorage.getUserByUsername(username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.userStorage.getUserByEmail(email);
  }

  async updateUserPassword(userId: number, passwordHash: string): Promise<User | undefined> {
    return this.userStorage.updateUserPassword(userId, passwordHash);
  }
  // Inventory operations
  async createBaseItem(insertItem: InsertItem): Promise<Item> {
    const [item] = await db.insert(items).values(insertItem).returning();
    return item;
  }

    async getBartenderMood(userId: number, bartenderId: number): Promise<BartenderMood | undefined> { return this.bartenderMoodStorage.getBartenderMood(userId, bartenderId); }
    async createBartenderMood(mood: InsertBartenderMood): Promise<BartenderMood> { return this.bartenderMoodStorage.createBartenderMood(mood); }
    async updateBartenderMood(userId: number, bartenderId: number, moodChange: number): Promise<BartenderMood> { return this.bartenderMoodStorage.updateBartenderMood(userId, bartenderId, moodChange); }
    async getAllBartenderMoodsForUser(userId: number): Promise<BartenderMood[]> { return this.bartenderMoodStorage.getAllBartenderMoodsForUser(userId); }
  
  // Bartender Memory operations
  async getBartenderMemory(userId: number, bartenderId: number): Promise<BartenderMemory | undefined> {
    const [memory] = await db
      .select()
      .from(bartenderMemories)
      .where(
        and(
          eq(bartenderMemories.userId, userId),
          eq(bartenderMemories.bartenderId, bartenderId)
        )
      );
    return memory || undefined;
  }
  
  async createBartenderMemory(insertMemory: InsertBartenderMemory): Promise<BartenderMemory> {
    const [memory] = await db
      .insert(bartenderMemories)
      .values(insertMemory)
      .returning();
    return memory;
  }
  
  async addMemoryEntry(userId: number, bartenderId: number, entry: MemoryEntry): Promise<BartenderMemory> {
    let memory = await this.getBartenderMemory(userId, bartenderId);
    
    if (!memory) {
      // Create initial memory record if it doesn't exist
      memory = await this.createBartenderMemory({
        userId,
        bartenderId,
        memories: JSON.stringify([])
      });
    }
    
    // Parse existing memories with error handling
    let memories: MemoryEntry[] = [];
    try {
      // Handle null, undefined, or invalid JSON
      if (memory.memories && typeof memory.memories === 'string') {
        memories = JSON.parse(memory.memories) as MemoryEntry[];
      }
      
      // If memories is not an array after parsing, initialize it
      if (!Array.isArray(memories)) {
        memories = [];
      }
    } catch (error) {
      console.error('Error parsing memory entries:', error);
      // Initialize as empty array if parsing fails
      memories = [];
    }
    
    // Validate entry with zod schema
    memoryEntrySchema.parse(entry);
    
    // Add new entry to memories
    memories.push(entry);
    
    // Update memory record with new entry
    const [updatedMemory] = await db
      .update(bartenderMemories)
      .set({
        memories: JSON.stringify(memories),
        updatedAt: new Date()
      })
      .where(
        and(
          eq(bartenderMemories.userId, userId),
          eq(bartenderMemories.bartenderId, bartenderId)
        )
      )
      .returning();
    
    return updatedMemory;
  }
  
  async getMemoryEntries(userId: number, bartenderId: number, limit = 10): Promise<MemoryEntry[]> {
    const memory = await this.getBartenderMemory(userId, bartenderId);
    
    if (!memory) {
      return [];
    }
    
    try {
      // Handle null, undefined, or invalid JSON
      let memories: MemoryEntry[] = [];
      if (memory.memories && typeof memory.memories === 'string') {
        memories = JSON.parse(memory.memories) as MemoryEntry[];
      }
      
      // If memories is not an array after parsing, initialize it
      if (!Array.isArray(memories)) {
        memories = [];
        return [];
      }
      
      // Sort by timestamp (most recent first)
      memories.sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      });
      
      // Return limited number of entries
      return memories.slice(0, limit);
    } catch (error) {
      console.error('Error parsing memory entries:', error);
      return [];
    }
  }
  
  async getSummarizedMemories(userId: number, bartenderId: number, maxEntries = 5): Promise<string> {
    try {
      const memories = await this.getMemoryEntries(userId, bartenderId, maxEntries);
      
      if (!memories || memories.length === 0) {
        return "No previous interactions recorded.";
      }
      
      // Sort by importance (highest first) and then by recency (most recent first)
      memories.sort((a, b) => {
        // Check if importance exists before comparing
        const importanceA = a.importance || 0;
        const importanceB = b.importance || 0;
        
        if (importanceB !== importanceA) {
          return importanceB - importanceA;
        }
        
        // Safely handle timestamps
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      });
      
      // Create a summarized string of memories with error handling
      return memories.map(memory => {
        try {
          const date = memory.timestamp ? new Date(memory.timestamp) : new Date();
          return `- ${memory.content || 'Interaction recorded'} (${date.toLocaleDateString()})`;
        } catch (error) {
          // Provide a fallback for any problemati memory entry
          return `- Past interaction recorded`;
        }
      }).join("\n");
      
    } catch (error) {
      console.error('Error processing memories for summary:', error);
      return "Unable to retrieve previous interactions.";
    }
  }

  // Inventory operations
  async createItem(insertItem: InsertItem): Promise<Item> {
    const [item] = await db.insert(items).values(insertItem).returning();
    return item;
  }

  async getUserInventory(userId: number): Promise<(UserInventory & {item: Item})[]> {
    // Join user_inventory with items to get full item details
    const inventoryItems = await db
      .select({
        inventory: userInventory,
        item: items
      })
      .from(userInventory)
      .innerJoin(items, eq(userInventory.itemId, items.id))
      .where(eq(userInventory.userId, userId));
      
    // Transform the result into the expected format
    return inventoryItems.map(row => ({
      ...row.inventory,
      item: row.item
    }));
  }

  async getUserInventoryItem(userId: number, itemId: number): Promise<UserInventory | undefined> {
    const [inventoryItem] = await db
      .select()
      .from(userInventory)
      .where(
        and(
          eq(userInventory.userId, userId),
          eq(userInventory.itemId, itemId)
        )
      );
    return inventoryItem || undefined;
  }

  async addItemToInventory(userId: number, itemId: number, quantity: number = 1): Promise<UserInventory> {
    // Check if the item exists
    const item = await this.getItem(itemId);
    if (!item) {
      throw new Error('Item not found');
    }
    
    // Check if the user already has this item in their inventory
    const existingItem = await this.getUserInventoryItem(userId, itemId);
    
    if (existingItem) {
      // If item is stackable, update quantity
      if (item.stackable) {
        const newQuantity = existingItem.quantity + quantity;
        const maxStack = item.maxStack || 99;  // Default max stack of 99 if not specified
        
        // Enforce max stack size
        const finalQuantity = Math.min(newQuantity, maxStack);
        
        // Update quantity
        const [updatedItem] = await db
          .update(userInventory)
          .set({ 
            quantity: finalQuantity,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(userInventory.userId, userId),
              eq(userInventory.itemId, itemId)
            )
          )
          .returning();
        
        return updatedItem;
      } else {
        // If not stackable, create a new inventory entry
        const [newInventoryItem] = await db
          .insert(userInventory)
          .values({
            userId,
            itemId,
            quantity: 1,
            equipped: false
          })
          .returning();
        
        return newInventoryItem;
      }
    } else {
      // Item not in inventory yet, add it
      const [newInventoryItem] = await db
        .insert(userInventory)
        .values({
          userId,
          itemId,
          quantity,
          equipped: false
        })
        .returning();
      
      return newInventoryItem;
    }
  }

  async removeItemFromInventory(userId: number, itemId: number, quantity: number = 1): Promise<boolean> {
    // Get the inventory item
    const inventoryItem = await this.getUserInventoryItem(userId, itemId);
    if (!inventoryItem) {
      return false; // Item not in inventory
    }
    
    if (inventoryItem.quantity <= quantity) {
      // Remove the entire inventory entry
      await db
        .delete(userInventory)
        .where(
          and(
            eq(userInventory.userId, userId),
            eq(userInventory.itemId, itemId)
          )
        );
      return true;
    } else {
      // Reduce the quantity
      await db
        .update(userInventory)
        .set({ 
          quantity: inventoryItem.quantity - quantity,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(userInventory.userId, userId),
            eq(userInventory.itemId, itemId)
          )
        );
      return true;
    }
  }

  async equipItem(userId: number, itemId: number, slot: string): Promise<UserInventory | null> {
    // Verify the slot is valid
    if (!equipmentSlotTypes.safeParse(slot).success) {
      throw new Error('Invalid equipment slot');
    }
    
    // Check if the item exists in the user's inventory
    const inventoryItem = await this.getUserInventoryItem(userId, itemId);
    if (!inventoryItem) {
      return null; // Item not in inventory
    }
    
    // First, unequip any item currently in this slot
    await db
      .update(userInventory)
      .set({ 
        equipped: false,
        equipSlot: null,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(userInventory.userId, userId),
          eq(userInventory.equipSlot, slot),
          eq(userInventory.equipped, true)
        )
      );
    
    // Now equip the new item
    const [equippedItem] = await db
      .update(userInventory)
      .set({ 
        equipped: true,
        equipSlot: slot,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(userInventory.userId, userId),
          eq(userInventory.itemId, itemId)
        )
      )
      .returning();
    
    return equippedItem || null;
  }

  async unequipItem(userId: number, itemId: number): Promise<UserInventory | null> {
    // Check if the item exists in the user's inventory and is equipped
    const inventoryItem = await this.getUserInventoryItem(userId, itemId);
    if (!inventoryItem || !inventoryItem.equipped) {
      return null; // Item not in inventory or not equipped
    }
    
    // Unequip the item
    const [unequippedItem] = await db
      .update(userInventory)
      .set({ 
        equipped: false,
        equipSlot: null,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(userInventory.userId, userId),
          eq(userInventory.itemId, itemId)
        )
      )
      .returning();
    
    return unequippedItem || null;
  }

  async getEquippedItems(userId: number): Promise<(UserInventory & {item: Item})[]> {
    // Join user_inventory with items to get full item details for equipped items
    const equippedItems = await db
      .select({
        inventory: userInventory,
        item: items
      })
      .from(userInventory)
      .innerJoin(items, eq(userInventory.itemId, items.id))
      .where(
        and(
          eq(userInventory.userId, userId),
          eq(userInventory.equipped, true)
        )
      );
      
    // Transform the result into the expected format
    return equippedItems.map(row => ({
      ...row.inventory,
      item: row.item
    }));
  }
}

export class BartenderMoodStorage {
  async getBartenderMood(userId: number, bartenderId: number): Promise<BartenderMood | undefined> {
    const [mood] = await db
      .select()
      .from(bartenderMoods)
      .where(
        and(
          eq(bartenderMoods.userId, userId),
          eq(bartenderMoods.bartenderId, bartenderId)
        )
      );
    return mood || undefined;
  }
  
  async createBartenderMood(insertMood: InsertBartenderMood): Promise<BartenderMood> {
    const [mood] = await db
      .insert(bartenderMoods)
      .values(insertMood)
      .returning();
    return mood;
  }
  
  async updateBartenderMood(userId: number, bartenderId: number, moodChange: number): Promise<BartenderMood> {
    let mood = await this.getBartenderMood(userId, bartenderId);
    
    if (!mood) {
      // Create initial mood if it doesn't exist
      mood = await this.createBartenderMood({
        userId,
        bartenderId,
        mood: 50 // Start at neutral
      });
    }
    
    // Calculate new mood value (clamped between 0-100)
    let newMood = Math.min(100, Math.max(0, mood.mood + moodChange));
    
    // Update the mood
    const [updatedMood] = await db
      .update(bartenderMoods)
      .set({ 
        mood: newMood,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(bartenderMoods.userId, userId),
          eq(bartenderMoods.bartenderId, bartenderId)
        )
      )
      .returning();
    
    return updatedMood;
  }
  
  async getAllBartenderMoodsForUser(userId: number): Promise<BartenderMood[]> {
    return db
      .select()
      .from(bartenderMoods)
      .where(eq(bartenderMoods.userId, userId));
  }
}
export class BartenderMemoryStorage {
  async getBartenderMemory(userId: number, bartenderId: number): Promise<BartenderMemory | undefined> {
    const [memory] = await db
      .select()
      .from(bartenderMemories)
      .where(
        and(
          eq(bartenderMemories.userId, userId),
          eq(bartenderMemories.bartenderId, bartenderId)
        )
      );
    return memory || undefined;
  }
  
  async createBartenderMemory(insertMemory: InsertBartenderMemory): Promise<BartenderMemory> {
    const [memory] = await db
      .insert(bartenderMemories)
      .values(insertMemory)
      .returning();
    return memory;
  }

  async getMemoryEntries(userId: number, bartenderId: number, limit = 10): Promise<MemoryEntry[]> {
    const memory = await this.getBartenderMemory(userId, bartenderId);
    
    if (!memory) {
      return [];
    }
    
    try {
      // Handle null, undefined, or invalid JSON
      let memories: MemoryEntry[] = [];
      if (memory.memories && typeof memory.memories === 'string') {
        memories = JSON.parse(memory.memories) as MemoryEntry[];
      }
      
      // If memories is not an array after parsing, initialize it
      if (!Array.isArray(memories)) {
        memories = [];
        return [];
      }
      
      // Sort by timestamp (most recent first)
      memories.sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      });
      return memories.slice(0, limit);
    } catch (error) { return []; }
  }
}











// Use the memory storage implementation for now
export const storage = new MemStorage();

/**
 * Resets all user online statuses to false
 * This is useful when restarting the server to prevent "user already exists" errors
 */
export async function resetUserOnlineStatus() {
  try {
    await db.update(users).set({ online: false });
    console.log("[database] Reset all user online statuses to offline");
  } catch (error) {
    console.error("[database] Error resetting user online statuses:", error);
  }
}
