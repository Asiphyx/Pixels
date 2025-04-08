import { 
  users, type User, type InsertUser,
  rooms, type Room, type InsertRoom,
  messages, type Message, type InsertMessage,
  bartenders, type Bartender, type InsertBartender,
  menuItems, type MenuItem, type InsertMenuItem,
  bartenderMoods, type BartenderMood, type InsertBartenderMood
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRoom(userId: number, roomId: number): Promise<User | undefined>;
  updateUserStatus(userId: number, online: boolean): Promise<User | undefined>;
  getOnlineUsers(roomId: number): Promise<User[]>;
  
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private rooms: Map<number, Room>;
  private messages: Map<number, Message>;
  private bartenders: Map<number, Bartender>;
  private menuItems: Map<number, MenuItem>;
  private bartenderMoods: Map<string, BartenderMood>; // key: "userId-bartenderId"
  
  private userId: number;
  private roomId: number;
  private messageId: number;
  private bartenderId: number;
  private menuItemId: number;
  private moodId: number;

  constructor() {
    this.users = new Map();
    this.rooms = new Map();
    this.messages = new Map();
    this.bartenders = new Map();
    this.menuItems = new Map();
    this.bartenderMoods = new Map();
    
    this.userId = 1;
    this.roomId = 1;
    this.messageId = 1;
    this.bartenderId = 1;
    this.menuItemId = 1;
    this.moodId = 1;
    
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
}

export const storage = new MemStorage();
