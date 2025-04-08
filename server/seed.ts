import { db } from './db';
import { 
  users, 
  rooms, 
  bartenders, 
  menuItems, 
  type InsertBartender, 
  type InsertRoom, 
  type InsertMenuItem 
} from '@shared/schema';
import { eq } from 'drizzle-orm';
import { log } from './vite';

/**
 * Seeds the database with default data if it's empty
 */
export async function seedDatabase() {
  log('Checking if database needs seeding...', 'database');
  
  // First check if we have any bartenders - if yes, we'll assume the DB is already seeded
  const existingBartenders = await db.select().from(bartenders);
  
  if (existingBartenders.length > 0) {
    log('Database already seeded, skipping', 'database');
    return;
  }
  
  log('Seeding database with initial data...', 'database');
  
  try {
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
    
    // Create default rooms - one for each gem
    const defaultRooms: InsertRoom[] = [
      { name: "The Rose Garden", description: "A warm and inviting space with Amethyst's sweet service." },
      { name: "The Ocean View", description: "A thoughtful atmosphere where Sapphire offers clever insights." },
      { name: "The Dragon's Den", description: "An exciting corner where Ruby shares thrilling tales." }
    ];
    
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
    
    // Insert the data
    await db.insert(bartenders).values(defaultBartenders);
    await db.insert(rooms).values(defaultRooms);
    await db.insert(menuItems).values([...defaultDrinks, ...defaultFood, ...defaultSpecials]);
    
    log('Database seeded successfully', 'database');
  } catch (error) {
    log(`Error seeding database: ${error}`, 'database');
    console.error('Database seeding error:', error);
  }
}