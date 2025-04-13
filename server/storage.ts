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

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRoom(userId: number, roomId: number): Promise<User | undefined>;
  updateUserStatus(userId: number, online: boolean): Promise<User | undefined>;
  updateUserPassword(userId: number, passwordHash: string): Promise<User | undefined>;
  getOnlineUsers(roomId: number): Promise<User[]>;
  
  // Authentication operations
  registerUser(username: string, password: string, email?: string, avatar?: string): Promise<User>;
  verifyUser(username: string, password: string): Promise<User | null>;
  
  // Currency operations
  addCurrency(userId: number, silver: number): Promise<{silver: number, gold: number}>;
  spendCurrency(userId: number, silver: number): Promise<{silver: number, gold: number} | null>;
  getCurrency(userId: number): Promise<{silver: number, gold: number}>;
  
  // Room operations
  getRoom(id: number): Promise<Room | undefined>;
  getRoomByName(name: string): Promise<Room | undefined>;
  getRooms(): Promise<Room[]>;
  createRoom(room: InsertRoom): Promise<Room>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByRoom(roomId: number, limit?: number): Promise<Message[]>;
  
  // Bartender operations
  getBartenders(): Promise<Bartender[]>;
  getBartender(id: number): Promise<Bartender | undefined>;
  createBartender(bartender: InsertBartender): Promise<Bartender>;
  
  // Menu operations
  getMenuItems(category?: string): Promise<MenuItem[]>;
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem>;

  // Bartender Mood operations
  getBartenderMood(userId: number, bartenderId: number): Promise<BartenderMood | undefined>;
  createBartenderMood(mood: InsertBartenderMood): Promise<BartenderMood>;
  updateBartenderMood(userId: number, bartenderId: number, moodChange: number): Promise<BartenderMood>;
  getAllBartenderMoodsForUser(userId: number): Promise<BartenderMood[]>;
  
  // Bartender Memory operations
  getBartenderMemory(userId: number, bartenderId: number): Promise<BartenderMemory | undefined>;
  createBartenderMemory(memory: InsertBartenderMemory): Promise<BartenderMemory>;
  addMemoryEntry(userId: number, bartenderId: number, entry: MemoryEntry): Promise<BartenderMemory>;
  getMemoryEntries(userId: number, bartenderId: number, limit?: number): Promise<MemoryEntry[]>;
  getSummarizedMemories(userId: number, bartenderId: number, maxEntries?: number): Promise<string>;
  
  // Inventory operations
  getItems(): Promise<Item[]>;
  getItem(id: number): Promise<Item | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  
  getUserInventory(userId: number): Promise<(UserInventory & {item: Item})[]>;
  getUserInventoryItem(userId: number, itemId: number): Promise<UserInventory | undefined>;
  addItemToInventory(userId: number, itemId: number, quantity?: number): Promise<UserInventory>;
  removeItemFromInventory(userId: number, itemId: number, quantity?: number): Promise<boolean>;
  equipItem(userId: number, itemId: number, slot: string): Promise<UserInventory | null>;
  unequipItem(userId: number, itemId: number): Promise<UserInventory | null>;
  getEquippedItems(userId: number): Promise<(UserInventory & {item: Item})[]>;
}

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
    
    // Initialize with default data
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
    defaultBartenders.forEach(bartender => this.createBartender(bartender));
    
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
        name: "Dwarven Mead",
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
    
    [...defaultDrinks, ...defaultFood, ...defaultSpecials].forEach(item => this.createMenuItem(item));
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username.toLowerCase() === username.toLowerCase()) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const timestamp = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      joinedAt: timestamp,
      online: true
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

  // Room operations
  async getRoom(id: number): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async getRoomByName(name: string): Promise<Room | undefined> {
    for (const room of this.rooms.values()) {
      if (room.name.toLowerCase() === name.toLowerCase()) {
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
    const message: Message = { ...insertMessage, id, timestamp };
    this.messages.set(id, message);
    return message;
  }

  async getMessagesByRoom(roomId: number, limit = 50): Promise<Message[]> {
    const roomMessages: Message[] = [];
    for (const message of this.messages.values()) {
      if (message.roomId === roomId) {
        roomMessages.push(message);
      }
    }
    
    // Sort by timestamp (newest first) and limit
    return roomMessages
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(-limit);
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }
  
  async updateUserPassword(userId: number, passwordHash: string): Promise<User | undefined> {
    await db.update(users)
      .set({ passwordHash })
      .where(eq(users.id, userId));
    return this.getUser(userId);
  }
  
  // Authentication operations
  async registerUser(username: string, password: string, email?: string, avatar: string = 'knight'): Promise<User> {
    // Check if username already exists
    const existingUser = await this.getUserByUsername(username);
    if (existingUser) {
      throw new Error('Username already taken');
    }
    
    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await this.getUserByEmail(email);
      if (existingEmail) {
        throw new Error('Email already registered');
      }
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Create the user
    const user = await this.createUser({
      username,
      email: email || null,
      passwordHash,
      avatar,
      silver: 100, // Starting currency
      gold: 0,
      level: 1,
      roomId: 1, // Default room
      online: true
    });
    
    return user;
  }
  
  async verifyUser(username: string, password: string): Promise<User | null> {
    // Find user by username
    const user = await this.getUserByUsername(username);
    if (!user || !user.passwordHash) {
      return null;
    }
    
    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return null;
    }
    
    // Update user to online status
    await this.updateUserStatus(user.id, true);
    
    // Return the user
    return user;
  }
  
  // Currency operations
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async updateUserRoom(userId: number, roomId: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ roomId })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }
  
  async updateUserStatus(userId: number, online: boolean): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ online })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }
  
  async getOnlineUsers(roomId: number): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(and(eq(users.roomId, roomId), eq(users.online, true)));
  }
  
  // Room operations
  async getRoom(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room || undefined;
  }
  
  async getRoomByName(name: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.name, name));
    return room || undefined;
  }
  
  async getRooms(): Promise<Room[]> {
    return db.select().from(rooms);
  }
  
  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const [room] = await db
      .insert(rooms)
      .values(insertRoom)
      .returning();
    return room;
  }
  
  // Message operations
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }
  
  async getMessagesByRoom(roomId: number, limit = 50): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.roomId, roomId))
      .orderBy(desc(messages.timestamp))
      .limit(limit)
      .then(messages => messages.reverse());
  }
  
  // Bartender operations
  async getBartenders(): Promise<Bartender[]> {
    return db.select().from(bartenders);
  }
  
  async getBartender(id: number): Promise<Bartender | undefined> {
    const [bartender] = await db.select().from(bartenders).where(eq(bartenders.id, id));
    return bartender || undefined;
  }
  
  async createBartender(insertBartender: InsertBartender): Promise<Bartender> {
    const [bartender] = await db
      .insert(bartenders)
      .values(insertBartender)
      .returning();
    return bartender;
  }
  
  // Menu operations
  async getMenuItems(category?: string): Promise<MenuItem[]> {
    if (category) {
      return db.select().from(menuItems).where(eq(menuItems.category, category));
    }
    return db.select().from(menuItems);
  }
  
  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    const [menuItem] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return menuItem || undefined;
  }
  
  async createMenuItem(insertMenuItem: InsertMenuItem): Promise<MenuItem> {
    const [menuItem] = await db
      .insert(menuItems)
      .values(insertMenuItem)
      .returning();
    return menuItem;
  }
  
  // Bartender Mood operations
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
          // Provide a fallback for any problematic memory entry
          return `- Past interaction recorded`;
        }
      }).join("\n");
      
    } catch (error) {
      console.error('Error processing memories for summary:', error);
      return "Unable to retrieve previous interactions.";
    }
  }

  // Inventory operations
  async getItems(): Promise<Item[]> {
    return db.select().from(items);
  }

  async getItem(id: number): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item || undefined;
  }

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

// Use the database storage implementation
export const storage = new DatabaseStorage();

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
