/**
 * Types for the inventory system
 */

// Item rarity levels
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// Item categories
export type ItemCategory = 'potion' | 'weapon' | 'armor' | 'food' | 'drink' | 'trinket' | 'quest' | 'misc';

// Base item interface
export interface Item {
  id: string;
  name: string;
  description: string;
  icon: string; // Icon identifier or path
  rarity: ItemRarity;
  category: ItemCategory;
  value: number; // Gold value
  stackable: boolean;
  quantity?: number; // For stackable items
  effects?: ItemEffect[];
  usable: boolean;
  equippable: boolean;
  equipped?: boolean;
  weight: number; // Weight in units
}

// Item effect interface
export interface ItemEffect {
  type: 'health' | 'mana' | 'stamina' | 'strength' | 'agility' | 'intelligence' | 'charisma' | 'status';
  value: number;
  duration?: number; // Duration in seconds, if applicable
  description: string;
}

// Inventory interface
export interface Inventory {
  gold: number;
  maxWeight: number;
  currentWeight: number;
  items: Record<string, Item>; // Map of item ID to item
}

// Inventory slot interface
export interface InventorySlot {
  id: string;
  item: Item | null;
}

// Container interface (e.g., bag, backpack, chest)
export interface Container {
  id: string;
  name: string;
  slots: number; // Number of slots in the container
  items: Record<string, Item>; // Map of slot ID to item
}

// Equipment slots 
export type EquipmentSlot = 'head' | 'neck' | 'chest' | 'hands' | 'waist' | 'legs' | 'feet' | 'mainHand' | 'offHand' | 'ring1' | 'ring2' | 'trinket1' | 'trinket2';

// Equipment interface
export interface Equipment {
  slots: Record<EquipmentSlot, Item | null>;
}

// Inventory state for the context
export interface InventoryState {
  inventory: Inventory;
  equipment: Equipment;
  containers: Record<string, Container>;
  activeContainerId: string | null;
}