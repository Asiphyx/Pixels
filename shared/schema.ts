import { pgTable, text, serial, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  avatar: text("avatar").notNull(),
  roomId: integer("room_id").notNull().default(1),
  joinedAt: timestamp("joined_at").defaultNow(),
  online: boolean("online").default(true)
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  joinedAt: true
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

export type BartenderMood = typeof bartenderMoods.$inferSelect;
export type InsertBartenderMood = z.infer<typeof insertBartenderMoodSchema>;

export type BartenderMemory = typeof bartenderMemories.$inferSelect;
export type InsertBartenderMemory = z.infer<typeof insertBartenderMemorySchema>;
export type MemoryEntry = z.infer<typeof memoryEntrySchema>;

// Websocket message types
export enum WebSocketMessageType {
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  SEND_MESSAGE = 'send_message',
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
  ERROR = 'error'
}

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
}
