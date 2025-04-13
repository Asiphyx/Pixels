import { db } from './db';
import { items, type InsertItem } from '@shared/schema';

/**
 * Create initial items for the game
 */
export async function createInitialItems() {
  // Check if items already exist
  const existingItems = await db.select().from(items);
  
  if (existingItems.length > 0) {
    console.log('[items] Initial items already exist, skipping creation');
    return;
  }
  
  console.log('[items] Creating initial items...');
  
  // Create weapons
  const weapons: InsertItem[] = [
    {
      name: 'Rusty Sword',
      description: 'A basic sword with some rust on the blade. Better than nothing.',
      type: 'weapon',
      rarity: 'common',
      value: 10,
      weight: 5,
      stackable: false,
      icon: 'weapon_sword',
      stats: JSON.stringify({
        damage: 3,
        requirements: {
          level: 1
        }
      })
    },
    {
      name: 'Hunter\'s Bow',
      description: 'A simple wooden bow used for hunting small game.',
      type: 'weapon',
      rarity: 'common',
      value: 20,
      weight: 3,
      stackable: false,
      icon: 'weapon_bow',
      stats: JSON.stringify({
        damage: 4,
        requirements: {
          level: 1,
          dexterity: 2
        }
      })
    },
    {
      name: 'Fine Steel Dagger',
      description: 'A well-balanced dagger with a sharp edge.',
      type: 'weapon',
      rarity: 'uncommon',
      value: 35,
      weight: 2,
      stackable: false,
      icon: 'weapon_dagger',
      stats: JSON.stringify({
        damage: 5,
        requirements: {
          level: 2
        }
      })
    },
    {
      name: 'Wizard\'s Staff',
      description: 'A wooden staff topped with a glowing crystal.',
      type: 'weapon',
      rarity: 'uncommon',
      value: 60,
      weight: 4,
      stackable: false,
      icon: 'weapon_staff',
      stats: JSON.stringify({
        damage: 6,
        requirements: {
          level: 3,
          intelligence: 5
        }
      })
    }
  ];
  
  // Create armor
  const armor: InsertItem[] = [
    {
      name: 'Leather Vest',
      description: 'Simple leather protection for your torso.',
      type: 'armor',
      rarity: 'common',
      value: 15,
      weight: 4,
      stackable: false,
      icon: 'armor_chest',
      stats: JSON.stringify({
        defense: 2,
        requirements: {
          level: 1
        }
      })
    },
    {
      name: 'Sturdy Boots',
      description: 'Durable boots for long journeys.',
      type: 'armor',
      rarity: 'common',
      value: 8,
      weight: 2,
      stackable: false,
      icon: 'armor_feet',
      stats: JSON.stringify({
        defense: 1,
        requirements: {
          level: 1
        }
      })
    },
    {
      name: 'Reinforced Helmet',
      description: 'A metal helmet with good protection.',
      type: 'armor',
      rarity: 'uncommon',
      value: 30,
      weight: 3,
      stackable: false,
      icon: 'armor_head',
      stats: JSON.stringify({
        defense: 3,
        requirements: {
          level: 2
        }
      })
    },
    {
      name: 'Enchanted Gloves',
      description: 'Gloves with minor magical enhancements.',
      type: 'armor',
      rarity: 'rare',
      value: 45,
      weight: 1,
      stackable: false,
      icon: 'armor_hands',
      stats: JSON.stringify({
        defense: 2,
        intelligence: 1,
        requirements: {
          level: 3
        }
      })
    }
  ];
  
  // Create consumables
  const consumables: InsertItem[] = [
    {
      name: 'Health Potion',
      description: 'Restores 20 health points when consumed.',
      type: 'consumable',
      rarity: 'common',
      value: 5,
      weight: 1,
      stackable: true,
      maxStack: 10,
      icon: 'potion_red',
      stats: JSON.stringify({
        effects: ['heal_20'],
      })
    },
    {
      name: 'Mana Potion',
      description: 'Restores 20 mana points when consumed.',
      type: 'consumable',
      rarity: 'common',
      value: 5,
      weight: 1,
      stackable: true,
      maxStack: 10,
      icon: 'potion_blue',
      stats: JSON.stringify({
        effects: ['mana_20'],
      })
    },
    {
      name: 'Antidote',
      description: 'Cures poison status effects.',
      type: 'consumable',
      rarity: 'uncommon',
      value: 15,
      weight: 1,
      stackable: true,
      maxStack: 5,
      icon: 'potion_green',
      stats: JSON.stringify({
        effects: ['cure_poison'],
      })
    },
    {
      name: 'Strength Elixir',
      description: 'Temporarily increases strength for 5 minutes.',
      type: 'consumable',
      rarity: 'rare',
      value: 50,
      weight: 1,
      stackable: true,
      maxStack: 3,
      icon: 'potion_orange',
      stats: JSON.stringify({
        effects: ['strength_boost_5'],
      })
    }
  ];
  
  // Create accessories
  const accessories: InsertItem[] = [
    {
      name: 'Lucky Charm',
      description: 'A small trinket that brings good fortune.',
      type: 'accessory',
      rarity: 'uncommon',
      value: 25,
      weight: 1,
      stackable: false,
      icon: 'accessory_trinket',
      stats: JSON.stringify({
        effects: ['luck_boost'],
      })
    },
    {
      name: 'Adventurer\'s Ring',
      description: 'A simple ring worn by many adventurers.',
      type: 'accessory',
      rarity: 'common',
      value: 20,
      weight: 1,
      stackable: false,
      icon: 'accessory_ring',
      stats: JSON.stringify({
        health: 5,
      })
    },
    {
      name: 'Amulet of Protection',
      description: 'Provides magical protection to the wearer.',
      type: 'accessory',
      rarity: 'rare',
      value: 75,
      weight: 1,
      stackable: false,
      icon: 'accessory_amulet',
      stats: JSON.stringify({
        defense: 3,
        effects: ['magic_resist'],
      })
    }
  ];
  
  // Create quest items
  const questItems: InsertItem[] = [
    {
      name: 'Mysterious Key',
      description: 'A strange key of unknown origin. Might open something important.',
      type: 'quest',
      rarity: 'uncommon',
      value: 0, // Quest items typically have no sell value
      weight: 1,
      stackable: false,
      icon: 'quest_key',
      stats: JSON.stringify({})
    },
    {
      name: 'Sealed Letter',
      description: 'A letter sealed with wax bearing an unknown insignia.',
      type: 'quest',
      rarity: 'common',
      value: 0,
      weight: 1,
      stackable: false,
      icon: 'quest_letter',
      stats: JSON.stringify({})
    }
  ];
  
  // Combine all items
  const allItems = [...weapons, ...armor, ...consumables, ...accessories, ...questItems];
  
  // Insert into database
  try {
    for (const item of allItems) {
      await db.insert(items).values(item);
    }
    console.log(`[items] Created ${allItems.length} initial items`);
  } catch (error) {
    console.error('[items] Error creating initial items:', error);
  }
}