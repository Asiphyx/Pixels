import { pgTable, text, serial, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  avatar: text("avatar").notNull(),
  roomId: integer("room_id").notNull().default(1),
  joinedAt: timestamp("joined_at").defaultNow(),
  online: boolean("online").default(true),
  // Player stats
  level: integer("level").default(1),
  // Player currencies
  silver: integer("silver").default(0),
  gold: integer("gold").default(0)
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  joinedAt: true,
  passwordHash: true
});

export const userAuthSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
});

export const userRegisterSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  email: z.string().email().optional(),
  avatar: z.string().optional().default('knight'),
});

// Chat Room model
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull()
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true
});

// Message model
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  roomId: integer("room_id").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("user"), // user, system, bartender
  bartenderId: integer("bartender_id"),
  timestamp: timestamp("timestamp").defaultNow()
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true
});

// Bartender model
export const bartenders = pgTable("bartenders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sprite: text("sprite").notNull(),
  avatar: text("avatar").notNull(),
  personality: text("personality").notNull()
});

export const insertBartenderSchema = createInsertSchema(bartenders).omit({
  id: true
});

// Menu Item model
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  category: text("category").notNull(),
  icon: text("icon").notNull()
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({
  id: true
});

// Bartender Mood model - tracks the mood of each bartender for each user
export const bartenderMoods = pgTable("bartender_moods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bartenderId: integer("bartender_id").notNull(),
  mood: integer("mood").notNull().default(50), // 0-100 scale, 50 is neutral
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertBartenderMoodSchema = createInsertSchema(bartenderMoods).omit({
  id: true,
  updatedAt: true
});

// Bartender Memory model - tracks significant interactions between users and bartenders
export const bartenderMemories = pgTable("bartender_memories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bartenderId: integer("bartender_id").notNull(),
  // Store an array of memory entries with timestamps
  memories: jsonb("memories").notNull().default('[]'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertBartenderMemorySchema = createInsertSchema(bartenderMemories).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Define memory entry type for better type safety
export const memoryEntrySchema = z.object({
  timestamp: z.date(),
  content: z.string(),
  context: z.string().optional(),
  type: z.enum(['preference', 'event', 'conversation', 'personal']),
  importance: z.number().min(1).max(5) // 1-5 scale of importance
});

// Inventory Item model
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // weapon, armor, consumable, quest, etc.
  rarity: text("rarity").notNull().default("common"), // common, uncommon, rare, epic, legendary
  value: integer("value").notNull(), // Value in silver
  weight: integer("weight").notNull(), // Weight in arbitrary units
  stackable: boolean("stackable").default(false),
  maxStack: integer("max_stack").default(1),
  icon: text("icon").notNull().default("default_item"),
  stats: jsonb("stats").notNull().default('{}'), // For damage, defense, effects, etc.
  createdAt: timestamp("created_at").defaultNow()
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true
});

// User Inventory model
export const userInventory = pgTable("user_inventory", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  itemId: integer("item_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  equipped: boolean("equipped").default(false),
  equipSlot: text("equip_slot"), // head, chest, weapon, etc. - null if not equippable
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertUserInventorySchema = createInsertSchema(userInventory).omit({
  id: true,
  updatedAt: true
});

// Equipment Slots model to define valid slot types
export const equipmentSlotTypes = z.enum([
  'head',
  'neck',
  'chest',
  'hands',
  'waist',
  'legs',
  'feet',
  'mainHand',
  'offHand',
  'ring1',
  'ring2',
  'trinket'
]);

// Define item stats schema
export const itemStatsSchema = z.object({
  damage: z.number().optional(),
  defense: z.number().optional(),
  health: z.number().optional(),
  mana: z.number().optional(),
  strength: z.number().optional(),
  dexterity: z.number().optional(),
  intelligence: z.number().optional(),
  effects: z.array(z.string()).optional(),
  requirements: z.record(z.string(), z.number()).optional(),
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Bartender = typeof bartenders.$inferSelect;
export type InsertBartender = z.infer<typeof insertBartenderSchema>;

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

export type Item = typeof items.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type ItemStats = z.infer<typeof itemStatsSchema>;

export type UserInventory = typeof userInventory.$inferSelect;
export type InsertUserInventory = z.infer<typeof insertUserInventorySchema>;
export type EquipmentSlot = z.infer<typeof equipmentSlotTypes>;

export type BartenderMood = typeof bartenderMoods.$inferSelect;
export type InsertBartenderMood = z.infer<typeof insertBartenderMoodSchema>;

export type BartenderMemory = typeof bartenderMemories.$inferSelect;
export type InsertBartenderMemory = z.infer<typeof insertBartenderMemorySchema>;
export type MemoryEntry = z.infer<typeof memoryEntrySchema>;

// Websocket message types
export enum WebSocketMessageType {
  // Existing message types
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  SEND_MESSAGE = 'send_message',
  CHAT_MESSAGE = 'chat_message',
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  NEW_MESSAGE = 'new_message',
  ORDER_ITEM = 'order_item',
  BARTENDER_RESPONSE = 'bartender_response',
  BARTENDER_GREETING = 'bartender_greeting',
  ROOM_USERS = 'room_users',
  BARTENDER_MOOD_UPDATE = 'bartender_mood_update',
  BARTENDER_MEMORY_UPDATE = 'bartender_memory_update',
  BARTENDER_MEMORY_RECOLLECTION = 'bartender_memory_recollection',
  GET_MOODS = 'get_moods',
  GET_MEMORIES = 'get_memories',
  MEMORIES_RESPONSE = 'memories_response',
  
  // Authentication message types
  AUTH_LOGIN = 'auth_login',
  AUTH_REGISTER = 'auth_register',
  AUTH_SUCCESS = 'auth_success',
  AUTH_ERROR = 'auth_error',
  AUTH_LOGOUT = 'auth_logout',
  AUTH_PROFILE = 'auth_profile',
  AUTH_RESPONSE = 'auth_response',
  LOGIN = 'login',           // Legacy support
  REGISTER = 'register',     // Legacy support
  LOGOUT = 'logout',         // Legacy support
  
  // Inventory message types
  INVENTORY_GET = 'inventory_get',
  INVENTORY_UPDATE = 'inventory_update',
  INVENTORY_ADD_ITEM = 'inventory_add_item',
  INVENTORY_REMOVE_ITEM = 'inventory_remove_item',
  INVENTORY_EQUIP_ITEM = 'inventory_equip_item',
  INVENTORY_UNEQUIP_ITEM = 'inventory_unequip_item',
  INVENTORY_GET_EQUIPPED = 'inventory_get_equipped',
  EQUIPPED_ITEMS_UPDATE = 'equipped_items_update',
  GET_INVENTORY = 'get_inventory',   // Legacy support
  EQUIP_ITEM = 'equip_item',         // Legacy support
  UNEQUIP_ITEM = 'unequip_item',     // Legacy support
  USE_ITEM = 'use_item',             // Legacy support
  ADD_ITEM = 'add_item',             // Legacy support
  REMOVE_ITEM = 'remove_item',       // Legacy support
  
  // Currency message types
  CURRENCY_GET = 'currency_get',
  CURRENCY_ADD = 'currency_add',
  CURRENCY_SPEND = 'currency_spend',
  ADD_CURRENCY = 'add_currency',     // Legacy support
  SPEND_CURRENCY = 'spend_currency', // Legacy support
  
  // Shop/transaction message types
  SHOP_OPEN = 'shop_open',
  BUY_ITEM = 'buy_item',
  SELL_ITEM = 'sell_item',
  
  // Error messages
  ERROR = 'error'
}

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
}
