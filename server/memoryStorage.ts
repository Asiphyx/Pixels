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
import { IStorage } from './storage.interface'; // Import the interface
import * as bcrypt from 'bcryptjs';

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private rooms: Map<number, Room>;
  private messages: Map<number, Message>;
  private bartenders: Map<number, Bartender>;
  private menuItems: Map<number, MenuItem>;
  private bartenderMoods: Map<string, BartenderMood>; // key: "userId-bartenderId"
  private bartenderMemories: Map<string, BartenderMemory>; // key: "userId-bartenderId"
  private items: Map<number, Item>;
  private userInventory: Map<string, UserInventory>; // key: "userId-itemId"
  private inventoryItemId: number; // Separate counter for inventory item IDs

  private userId: number;
  private roomId: number;
  private messageId: number;
  private bartenderId: number;
  private menuItemId: number;
  private moodId: number;
  private memoryId: number;
  private itemId: number;

  constructor() {
    this.users = new Map();
    this.rooms = new Map();
    this.messages = new Map();
    this.bartenders = new Map();
    this.menuItems = new Map();
    this.bartenderMoods = new Map();
    this.bartenderMemories = new Map();
    this.items = new Map();
    this.userInventory = new Map();
    
    this.userId = 1;
    this.roomId = 1;
    this.messageId = 1;
    this.bartenderId = 1;
    this.menuItemId = 1;
    this.moodId = 1;
    this.memoryId = 1;
    this.itemId = 1;
    this.inventoryItemId = 1; // Initialize inventory item ID counter
    
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default bartenders
    const defaultBartenders: InsertBartender[] = [
      { name: "Amethyst", sprite: "amethyst", avatar: "amethyst", personality: "Sweet and charming." },
      { name: "Sapphire", sprite: "sapphire", avatar: "sapphire", personality: "Intelligent and witty." },
      { name: "Ruby", sprite: "ruby", avatar: "ruby", personality: "Fiery and passionate." }
    ];
    defaultBartenders.forEach(bartender => this.createBartender(bartender));

    // Create default rooms
    const defaultRooms: InsertRoom[] = [
      { name: "The Rose Garden", description: "Amethyst's corner." },
      { name: "The Ocean View", description: "Sapphire's spot." },
      { name: "The Dragon's Den", description: "Ruby's domain." }
    ];
    defaultRooms.forEach(room => this.createRoom(room));

    // Create default menu items
    const defaultMenuItems: InsertMenuItem[] = [
      { name: "Dragon's Breath Ale", description: "Spicy!", price: 5, category: "drinks", icon: "dragonAle" },
      { name: "Hearty Stew", description: "Fills you up.", price: 10, category: "food", icon: "heartyStew" },
      { name: "Hero's Feast", description: "For legends!", price: 30, category: "specials", icon: "herosFeast" }
    ];
    defaultMenuItems.forEach(item => this.createMenuItem(item));

     // Create default items
    const defaultItems: InsertItem[] = [
        { name: "Rusty Sword", description: "Barely holds an edge.", type: 'weapon', value: 5, weight: 10, stackable: false }, // Removed equipSlot, added value/weight
        { name: "Health Potion", description: "Restores a bit of health.", type: 'consumable', value: 10, weight: 1, stackable: true, maxStack: 10 }, // Added value/weight
    ];
    defaultItems.forEach(item => this.createItem(item));
  }

  // --- User operations ---
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const lowercaseUsername = username.toLowerCase();
    for (const user of this.users.values()) {
      if (user.username.toLowerCase() === lowercaseUsername) {
        return user;
      }
    }
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const lowercaseEmail = email.toLowerCase();
    for (const user of this.users.values()) {
      if (user.email && user.email.toLowerCase() === lowercaseEmail) {
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
      passwordHash: null, // Will be set later in registerUser
      joinedAt: timestamp,
      email: insertUser.email !== undefined ? insertUser.email : null,
      online: true,
      roomId: insertUser.roomId !== undefined ? insertUser.roomId : 1, // Default roomId
      silver: insertUser.silver ?? 100, // Default currency
      gold: insertUser.gold ?? 0,
      level: insertUser.level ?? 1
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserRoom(userId: number, roomId: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (user) {
      const updatedUser = { ...user, roomId };
      this.users.set(userId, updatedUser);
      return updatedUser;
    }
    return undefined;
  }

  async updateUserStatus(userId: number, online: boolean): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (user) {
      const updatedUser = { ...user, online };
      this.users.set(userId, updatedUser);
      return updatedUser;
    }
    return undefined;
  }
  
  async updateUserPassword(userId: number, passwordHash: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (user) {
      const updatedUser = { ...user, passwordHash };
      this.users.set(userId, updatedUser);
      return updatedUser;
    }
    return undefined;
  }

  async getOnlineUsers(roomId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.online && user.roomId === roomId);
  }

  // --- Authentication operations ---
  async registerUser(username: string, password: string, email?: string, avatar: string = 'knight'): Promise<User> {
    if (await this.getUserByUsername(username)) {
      throw new Error('Username already taken');
    }
    if (email && await this.getUserByEmail(email)) {
      throw new Error('Email already registered');
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const user = await this.createUser({ 
      username, 
      email: email || null, 
      avatar, 
      silver: 100, 
      gold: 0, 
      level: 1, 
      roomId: 1, 
      online: true 
    });
    
    // Update the user with the password hash
    return await this.updateUserPassword(user.id, passwordHash) || user; // Should always succeed
  }

  async verifyUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (user && user.passwordHash && await bcrypt.compare(password, user.passwordHash)) {
      return await this.updateUserStatus(user.id, true) || user; // Mark as online
    }
    return null;
  }

  // --- Currency operations ---
  async addCurrency(userId: number, silverToAdd: number): Promise<{ silver: number; gold: number; }> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');

    let currentSilver = user.silver ?? 0;
    let currentGold = user.gold ?? 0;

    currentSilver += silverToAdd;
    currentGold += Math.floor(currentSilver / 100);
    currentSilver %= 100;

    const updatedUser = { ...user, silver: currentSilver, gold: currentGold };
    this.users.set(userId, updatedUser);
    return { silver: currentSilver, gold: currentGold };
  }

  async spendCurrency(userId: number, silverToSpend: number): Promise<{ silver: number; gold: number; } | null> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');

    let currentSilver = user.silver ?? 0;
    let currentGold = user.gold ?? 0;
    const totalWealthInSilver = currentSilver + currentGold * 100;

    if (totalWealthInSilver < silverToSpend) {
      return null; // Not enough funds
    }

    const remainingSilverTotal = totalWealthInSilver - silverToSpend;
    const newGold = Math.floor(remainingSilverTotal / 100);
    const newSilver = remainingSilverTotal % 100;

    const updatedUser = { ...user, silver: newSilver, gold: newGold };
    this.users.set(userId, updatedUser);
    return { silver: newSilver, gold: newGold };
  }

  async getCurrency(userId: number): Promise<{ silver: number; gold: number; }> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    return { silver: user.silver ?? 0, gold: user.gold ?? 0 };
  }

  // --- Room operations ---
  async getRoom(id: number): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async getRoomByName(name: string): Promise<Room | undefined> {
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

  // --- Message operations ---
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
    return message;
  }

  async getMessagesByRoom(roomId: number, limit = 50): Promise<Message[]> {
    const roomMessages = Array.from(this.messages.values())
                             .filter(msg => msg.roomId === roomId)
                             .sort((a, b) => (a.timestamp?.getTime() ?? 0) - (b.timestamp?.getTime() ?? 0)); // Oldest first
    return roomMessages.slice(-limit); // Take the last 'limit' messages
  }

  // --- Bartender operations ---
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

  // --- Menu operations ---
  async getMenuItems(category?: string): Promise<MenuItem[]> {
    const allItems = Array.from(this.menuItems.values());
    if (category) {
      return allItems.filter(item => item.category === category);
    }
    return allItems;
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

  // --- Bartender Mood operations ---
  async getBartenderMood(userId: number, bartenderId: number): Promise<BartenderMood | undefined> {
    const key = `${userId}-${bartenderId}`;
    return this.bartenderMoods.get(key);
  }

  async createBartenderMood(insertMood: InsertBartenderMood): Promise<BartenderMood> {
    const id = this.moodId++;
    const timestamp = new Date();
    const bartenderMood: BartenderMood = { 
      ...insertMood,
      mood: insertMood.mood ?? 50, // Default neutral mood
      id,
      updatedAt: timestamp
    };
    const key = `${insertMood.userId}-${insertMood.bartenderId}`;
    this.bartenderMoods.set(key, bartenderMood);
    return bartenderMood;
  }

  async updateBartenderMood(userId: number, bartenderId: number, moodChange: number): Promise<BartenderMood> {
    const key = `${userId}-${bartenderId}`;
    let mood = this.bartenderMoods.get(key);
    if (!mood) {
      mood = await this.createBartenderMood({ userId, bartenderId, mood: 50 });
    }
    const newMoodValue = Math.max(0, Math.min(100, mood.mood + moodChange));
    const updatedMood = { ...mood, mood: newMoodValue, updatedAt: new Date() };
    this.bartenderMoods.set(key, updatedMood);
    return updatedMood;
  }

  async getAllBartenderMoodsForUser(userId: number): Promise<BartenderMood[]> {
    return Array.from(this.bartenderMoods.values()).filter(mood => mood.userId === userId);
  }

  // --- Bartender Memory operations ---
  async getBartenderMemory(userId: number, bartenderId: number): Promise<BartenderMemory | undefined> {
    const key = `${userId}-${bartenderId}`;
    return this.bartenderMemories.get(key);
  }

  async createBartenderMemory(insertMemory: InsertBartenderMemory): Promise<BartenderMemory> {
    const id = this.memoryId++;
    const timestamp = new Date();
    const bartenderMemory: BartenderMemory = {
      ...insertMemory,
      id,
      memories: insertMemory.memories || '[]', // Default to empty JSON array string
      createdAt: timestamp,
      updatedAt: timestamp
    };
    const key = `${insertMemory.userId}-${insertMemory.bartenderId}`;
    this.bartenderMemories.set(key, bartenderMemory);
    return bartenderMemory;
  }

  async addMemoryEntry(userId: number, bartenderId: number, entry: MemoryEntry): Promise<BartenderMemory> {
    const key = `${userId}-${bartenderId}`;
    let memoryRecord = this.bartenderMemories.get(key);
    if (!memoryRecord) {
      memoryRecord = await this.createBartenderMemory({ userId, bartenderId, memories: '[]' });
    }

    let memories: MemoryEntry[] = [];
    try {
      if (memoryRecord.memories && typeof memoryRecord.memories === 'string') {
        memories = JSON.parse(memoryRecord.memories) as MemoryEntry[];
      }
      if (!Array.isArray(memories)) memories = []; // Ensure it's an array
    } catch (error) {
      console.error('Error parsing memory entries in MemStorage:', error);
      memories = [];
    }

    // Add timestamp if missing
    const entryWithTimestamp = { ...entry, timestamp: entry.timestamp ?? new Date() };
    memories.push(entryWithTimestamp);
    
    // Optional: Sort memories (e.g., by timestamp)
    memories.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const updatedMemoryRecord = { ...memoryRecord, memories: JSON.stringify(memories), updatedAt: new Date() };
    this.bartenderMemories.set(key, updatedMemoryRecord);
    return updatedMemoryRecord;
  }

  async getMemoryEntries(userId: number, bartenderId: number, limit = 10): Promise<MemoryEntry[]> {
    const memoryRecord = this.bartenderMemories.get(`${userId}-${bartenderId}`);
    if (!memoryRecord || !memoryRecord.memories) return [];

    try {
      // Ensure memories is parsed correctly from a string
      let memories: MemoryEntry[] = [];
      if (typeof memoryRecord.memories === 'string') {
          memories = JSON.parse(memoryRecord.memories);
      } else {
          // Handle cases where memories might not be a string (though unlikely based on schema)
          console.error('Memory record memories is not a string:', memoryRecord.memories);
      }
      if (!Array.isArray(memories)) return [];
      
      // Sort by timestamp (newest first)
      memories.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return memories.slice(0, limit);
    } catch (error) {
      console.error('Error parsing memory entries in MemStorage:', error);
      return [];
    }
  }

  async getSummarizedMemories(userId: number, bartenderId: number, maxEntries = 5): Promise<string> {
    const entries = await this.getMemoryEntries(userId, bartenderId, maxEntries);
    if (!entries || entries.length === 0) {
      return "No previous interactions recorded.";
    }
    return entries.map(entry => {
      try {
        const dateStr = entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : 'Unknown date';
        return `[${dateStr}, type: ${entry.type || 'interaction'}, importance: ${entry.importance || 'normal'}] ${entry.content || 'Interaction recorded'}`;
      } catch { 
        return '- Past interaction recorded (format error)';
      }
    }).join('\n'); // Corrected join separator
  }

  // --- Inventory operations ---
  async getItems(): Promise<Item[]> {
    return Array.from(this.items.values());
  }

  async getItem(id: number): Promise<Item | undefined> {
    return this.items.get(id);
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const id = this.itemId++;
    const timestamp = new Date();
    // Ensure the created item conforms to the Item type, especially non-nullable fields with defaults
    const item: Item = {
      rarity: insertItem.rarity ?? 'common', // Add default from schema if not provided
      icon: insertItem.icon ?? 'default_item', // Add default from schema if not provided
      stats: insertItem.stats ?? {}, // Add default from schema if not provided
      stackable: insertItem.stackable ?? null, // Ensure stackable is boolean | null
      maxStack: insertItem.maxStack ?? null, // Ensure maxStack is number | null
      createdAt: insertItem.createdAt ?? timestamp, // Ensure createdAt is Date | null
      ...insertItem, // Spread insertItem last to allow explicit values to override defaults
      id,
    };
    this.items.set(id, item);
    return item;
  }

  async getUserInventory(userId: number): Promise<(UserInventory & { item: Item })[]> {
    const inventoryList: (UserInventory & { item: Item })[] = [];
    for (const inventoryItem of this.userInventory.values()) {
      if (inventoryItem.userId === userId) {
        const itemDetails = this.items.get(inventoryItem.itemId);
        if (itemDetails) {
          inventoryList.push({ ...inventoryItem, item: itemDetails });
        }
      }
    }
    return inventoryList;
  }
  
  async getUserInventoryItem(userId: number, itemId: number): Promise<UserInventory | undefined> {
     for (const item of this.userInventory.values()) {
      if (item.userId === userId && item.itemId === itemId) {
        return item;
      }
    }
    return undefined;
  }

  async addItemToInventory(userId: number, itemId: number, quantity: number = 1): Promise<UserInventory> {
    const itemDetails = await this.getItem(itemId);
    if (!itemDetails) throw new Error('Item not found');

    let inventoryItem = await this.getUserInventoryItem(userId, itemId);

    if (inventoryItem) {
      if (itemDetails.stackable) {
        const maxStack = itemDetails.maxStack || 99;
        const newQuantity = Math.min(inventoryItem.quantity + quantity, maxStack);
        inventoryItem = { ...inventoryItem, quantity: newQuantity, updatedAt: new Date() };
      } else {
        // For non-stackable items, we conceptually can't add quantity. 
        // You might decide to throw an error or just return the existing item.
        // Or, if multiple instances are allowed, create a new entry (needs different key or ID handling).
        // For simplicity, let's just update the timestamp if it exists.
        inventoryItem = { ...inventoryItem, updatedAt: new Date() }; 
      }
    } else {
      // Item not in inventory, create new entry
      const id = this.inventoryItemId++;
      inventoryItem = {
        id,
        userId,
        itemId,
        quantity: itemDetails.stackable ? quantity : 1, // Start with 1 for non-stackable
        equipped: false,
        equipSlot: null,
        updatedAt: new Date()
      };
    }
    
    this.userInventory.set(`${userId}-${itemId}`, inventoryItem); // Use composite key for simplicity here
    return inventoryItem;
  }

  async removeItemFromInventory(userId: number, itemId: number, quantity: number = 1): Promise<boolean> {
    const key = `${userId}-${itemId}`;
    const inventoryItem = this.userInventory.get(key);
    if (!inventoryItem) return false;

    if (inventoryItem.quantity <= quantity) {
      this.userInventory.delete(key);
    } else {
      const updatedItem = { ...inventoryItem, quantity: inventoryItem.quantity - quantity, updatedAt: new Date() };
      this.userInventory.set(key, updatedItem);
    }
    return true;
  }

  async equipItem(userId: number, itemId: number, slot: string): Promise<UserInventory | null> {
    const key = `${userId}-${itemId}`;
    const inventoryItem = this.userInventory.get(key);
    const itemDetails = this.items.get(itemId);

    // Removed itemDetails.equipSlot check as 'equipSlot' is not on Item type
    if (!inventoryItem || !itemDetails) {
        return null; // Item not found, or cannot be equipped in this slot
    }

    // Unequip other items in the same slot first (if any)
    for(const [invKey, invItem] of this.userInventory.entries()) {
        if (invItem.userId === userId && invItem.equipped && invItem.equipSlot === slot) {
            this.userInventory.set(invKey, { ...invItem, equipped: false, equipSlot: null, updatedAt: new Date() });
            break; // Assume only one item per slot
        }
    }

    // Equip the new item
    const updatedItem = { ...inventoryItem, equipped: true, equipSlot: slot, updatedAt: new Date() };
    this.userInventory.set(key, updatedItem);
    return updatedItem;
  }

  async unequipItem(userId: number, itemId: number): Promise<UserInventory | null> {
    const key = `${userId}-${itemId}`;
    const inventoryItem = this.userInventory.get(key);
    if (!inventoryItem || !inventoryItem.equipped) return null;

    const updatedItem = { ...inventoryItem, equipped: false, equipSlot: null, updatedAt: new Date() };
    this.userInventory.set(key, updatedItem);
    return updatedItem;
  }

  async getEquippedItems(userId: number): Promise<(UserInventory & { item: Item })[]> {
    const equippedList: (UserInventory & { item: Item })[] = [];
    for (const inventoryItem of this.userInventory.values()) {
      if (inventoryItem.userId === userId && inventoryItem.equipped) {
        const itemDetails = this.items.get(inventoryItem.itemId);
        if (itemDetails) {
          equippedList.push({ ...inventoryItem, item: itemDetails });
        }
      }
    }
    return equippedList;
  }
  // --- Missing IStorage methods ---

  async createBaseItem(item: InsertItem): Promise<Item> {
    // In-memory storage doesn't distinguish between base items and created items
    // Just create a regular item
    return this.createItem(item);
  }

  async transferItem(senderId: number, receiverId: number, itemId: number, quantity: number = 1): Promise<boolean> {
    // Basic in-memory transfer logic (can be expanded)
    const senderInventoryItem = await this.getUserInventoryItem(senderId, itemId);
    if (!senderInventoryItem || senderInventoryItem.quantity < quantity) {
      return false; // Sender doesn't have enough items
    }

    await this.removeItemFromInventory(senderId, itemId, quantity);
    await this.addItemToInventory(receiverId, itemId, quantity);

    return true;
  }

  async craftItem(userId: number, craftedItemId: number, materials: {itemId: number, quantity: number}[]): Promise<Item | null> {
    // In-memory crafting is complex and depends on crafting recipes.
    // For a basic implementation, we'll just check if the user has the materials
    // and if so, add the crafted item and remove the materials.
    // This is a simplified placeholder.

    // Check if user has all materials
    for (const material of materials) {
      const hasMaterial = await this.hasItem(userId, material.itemId, material.quantity);
      if (!hasMaterial) {
        console.warn(`User ${userId} is missing material ${material.itemId} for crafting.`);
        return null; // User doesn't have enough materials
      }
    }

    // Get the crafted item details
    const craftedItemDetails = await this.getItem(craftedItemId);
    if (!craftedItemDetails) {
      console.error(`Crafted item ${craftedItemId} not found.`);
      return null; // Crafted item doesn't exist
    }

    // Remove materials from inventory
    for (const material of materials) {
      await this.removeItemFromInventory(userId, material.itemId, material.quantity);
    }

    // Add crafted item to inventory
    await this.addItemToInventory(userId, craftedItemId, 1); // Assuming crafting yields 1 item

    return craftedItemDetails;
  }

  async hasItem(userId: number, itemId: number, quantity: number = 1): Promise<boolean> {
    const inventoryItem = await this.getUserInventoryItem(userId, itemId);
    return inventoryItem !== undefined && inventoryItem.quantity >= quantity;
  }
}
