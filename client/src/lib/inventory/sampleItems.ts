import { Item, ItemCategory, ItemRarity } from './types';

// Helper function to create unique IDs
const createId = (name: string): string => {
  return `item-${name.toLowerCase().replace(/\s+/g, '-')}`;
};

// Sample tavern-themed items
export const tavernItems: Item[] = [
  // Drinks
  {
    id: createId('Ale'),
    name: 'Ale',
    description: 'A frothy mug of ale, brewed locally.',
    icon: 'drink-ale',
    rarity: 'common',
    category: 'drink',
    value: 2,
    stackable: true,
    quantity: 1,
    effects: [
      {
        type: 'status',
        value: 1,
        duration: 300,
        description: 'Slightly tipsy: +1 to Charisma, -1 to Agility'
      }
    ],
    usable: true,
    equippable: false,
    weight: 0.5
  },
  {
    id: createId('Fine Wine'),
    name: 'Fine Wine',
    description: 'A bottle of exquisite wine from the western vineyards.',
    icon: 'drink-wine',
    rarity: 'uncommon',
    category: 'drink',
    value: 15,
    stackable: true,
    quantity: 1,
    effects: [
      {
        type: 'charisma',
        value: 2,
        duration: 600,
        description: 'Sophisticated: +2 to Charisma checks'
      }
    ],
    usable: true,
    equippable: false,
    weight: 1
  },
  {
    id: createId('Dwarven Stout'),
    name: 'Dwarven Stout',
    description: 'Strong and bitter stout imported from the mountain kingdoms.',
    icon: 'drink-stout',
    rarity: 'uncommon',
    category: 'drink',
    value: 8,
    stackable: true,
    quantity: 1,
    effects: [
      {
        type: 'strength',
        value: 2,
        duration: 300,
        description: 'Liquid Courage: +2 to Strength, -1 to Intelligence'
      }
    ],
    usable: true,
    equippable: false,
    weight: 0.7
  },
  
  // Food
  {
    id: createId('Hearty Stew'),
    name: 'Hearty Stew',
    description: 'A bowl of rich, filling stew with chunks of meat and vegetables.',
    icon: 'food-stew',
    rarity: 'common',
    category: 'food',
    value: 5,
    stackable: true,
    quantity: 1,
    effects: [
      {
        type: 'health',
        value: 15,
        description: 'Nourishing: Restores 15 health over time'
      }
    ],
    usable: true,
    equippable: false,
    weight: 0.8
  },
  {
    id: createId('Cheese Platter'),
    name: 'Cheese Platter',
    description: 'An assortment of fine cheeses arranged on a wooden board.',
    icon: 'food-cheese',
    rarity: 'uncommon',
    category: 'food',
    value: 12,
    stackable: true,
    quantity: 1,
    effects: [
      {
        type: 'status',
        value: 1,
        duration: 600,
        description: 'Satisfied: Gain 1 temporary hit point per hour'
      }
    ],
    usable: true,
    equippable: false,
    weight: 1.2
  },
  
  // Trinkets
  {
    id: createId('Lucky Dice'),
    name: 'Lucky Dice',
    description: 'A pair of slightly weighted dice. Don\'t get caught using them.',
    icon: 'trinket-dice',
    rarity: 'uncommon',
    category: 'trinket',
    value: 25,
    stackable: false,
    effects: [
      {
        type: 'status',
        value: 1,
        description: 'Lucky: +1 to gambling checks'
      }
    ],
    usable: false,
    equippable: true,
    weight: 0.1
  },
  
  // Weapons
  {
    id: createId('Tavern Brawler'),
    name: 'Tavern Brawler',
    description: 'A sturdy oak chair leg. Perfect for settling disputes the old-fashioned way.',
    icon: 'weapon-club',
    rarity: 'common',
    category: 'weapon',
    value: 5,
    stackable: false,
    usable: false,
    equippable: true,
    weight: 2
  },
  
  // Quest items
  {
    id: createId('Mysterious Note'),
    name: 'Mysterious Note',
    description: 'A crumpled note passed to you by a hooded stranger. The handwriting is elegant but hurried.',
    icon: 'quest-note',
    rarity: 'rare',
    category: 'quest',
    value: 0,
    stackable: false,
    usable: true,
    equippable: false,
    weight: 0.1
  },
  
  // Misc
  {
    id: createId('Tavern Deed'),
    name: 'Tavern Deed',
    description: 'An official deed to a small tavern in a faraway village. How it ended up in your possession is a mystery.',
    icon: 'misc-document',
    rarity: 'epic',
    category: 'misc',
    value: 5000,
    stackable: false,
    usable: false,
    equippable: false,
    weight: 0.2
  }
];

// Function to get all available items
export const getAvailableItems = (): Item[] => {
  return tavernItems;
};

// Function to get items by category
export const getItemsByCategory = (category: ItemCategory): Item[] => {
  return tavernItems.filter(item => item.category === category);
};

// Function to get item by ID
export const getItemById = (id: string): Item | undefined => {
  return tavernItems.find(item => item.id === id);
};