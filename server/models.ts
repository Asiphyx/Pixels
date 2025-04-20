export interface User {
  id: number;
  gold: number;
  level: number;
  inventory: UserInventory[];
  mood: Mood;
}

export interface Bartender {
  id: number;
  level: number;
  inventory: UserInventory[];
  mood: Mood;
}

export interface UserInventory {
  id: number;
  userId: number;
  item: string;
  quantity: number;
  level: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  type: string;
  level: number;
}

export interface Sentiment {
  id: string;
  text: string;
  score: number;
  timestamp: Date;
}

export interface Mood {
  id: string;
  name: string;
  description: string;
  timestamp: Date;
}

export * from './models';