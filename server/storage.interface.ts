import {
  User, InsertUser,
  Room, InsertRoom,
  Message, InsertMessage,
  Bartender, InsertBartender,
  MenuItem, InsertMenuItem,
  BartenderMood, InsertBartenderMood,
  BartenderMemory, InsertBartenderMemory,
  MemoryEntry,
  Item, InsertItem,
  UserInventory
} from "@shared/schema";

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

    // Item operations
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
    // Item Operations
    getItems(): Promise<Item[]>;
    getItem(id: number): Promise<Item | undefined>;
    createBaseItem(item: InsertItem): Promise<Item>;
    transferItem(senderId: number, receiverId: number, itemId: number, quantity?: number): Promise<boolean>;
    craftItem(userId: number, craftedItemId: number, materials: {itemId: number, quantity: number}[]): Promise<Item | null>;
    hasItem(userId: number, itemId: number, quantity?: number): Promise<boolean>;

    // Inventory Operations
    getUserInventory(userId: number): Promise<(UserInventory & {item: Item})[]>;
    getUserInventoryItem(userId: number, itemId: number): Promise<UserInventory | undefined>;
    addItemToInventory(userId: number, itemId: number, quantity?: number): Promise<UserInventory>;
    removeItemFromInventory(userId: number, itemId: number, quantity?: number): Promise<boolean>;
    equipItem(userId: number, itemId: number, slot: string): Promise<UserInventory | null>;
    unequipItem(userId: number, itemId: number): Promise<UserInventory | null>;
    getEquippedItems(userId: number): Promise<(UserInventory & {item: Item})[]>;
}
