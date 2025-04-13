import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Item, 
  Inventory, 
  Equipment, 
  Container, 
  EquipmentSlot,
  InventoryState
} from './types';

interface InventoryStore extends InventoryState {
  // Add item to inventory
  addItem: (item: Item) => void;
  
  // Remove item from inventory
  removeItem: (itemId: string) => void;
  
  // Update an existing item
  updateItem: (item: Item) => void;
  
  // Equip an item to a specific slot
  equipItem: (itemId: string, slot: EquipmentSlot) => void;
  
  // Unequip an item from a slot
  unequipItem: (slot: EquipmentSlot) => void;
  
  // Use an item (for consumables)
  useItem: (itemId: string) => void;
  
  // Add gold to inventory
  addGold: (amount: number) => void;
  
  // Remove gold from inventory
  removeGold: (amount: number) => void;
  
  // Set active container
  setActiveContainer: (containerId: string | null) => void;
  
  // Create a new container
  createContainer: (name: string, slots: number) => Container;
  
  // Calculate current weight
  calculateWeight: () => number;
}

// Initial state for equipment slots
const initialEquipment: Equipment = {
  slots: {
    head: null,
    neck: null,
    chest: null,
    hands: null,
    waist: null,
    legs: null,
    feet: null,
    mainHand: null,
    offHand: null,
    ring1: null,
    ring2: null,
    trinket1: null,
    trinket2: null
  }
};

// Initial inventory state
const initialInventory: Inventory = {
  gold: 0,
  maxWeight: 50, // Default max weight
  currentWeight: 0,
  items: {}
};

// Create the store with persistence
export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      // Initial state
      inventory: initialInventory,
      equipment: initialEquipment,
      containers: {},
      activeContainerId: null,

      // Add item to inventory
      addItem: (item: Item) => set((state) => {
        // Check if item is stackable and already exists
        if (item.stackable && state.inventory.items[item.id]) {
          const existingItem = state.inventory.items[item.id];
          const newQuantity = (existingItem.quantity || 1) + (item.quantity || 1);
          
          return {
            inventory: {
              ...state.inventory,
              items: {
                ...state.inventory.items,
                [item.id]: {
                  ...existingItem,
                  quantity: newQuantity
                }
              },
              currentWeight: state.inventory.currentWeight + (item.weight * (item.quantity || 1))
            }
          };
        }
        
        // Otherwise add as a new item
        return {
          inventory: {
            ...state.inventory,
            items: {
              ...state.inventory.items,
              [item.id]: item
            },
            currentWeight: state.inventory.currentWeight + (item.weight * (item.quantity || 1))
          }
        };
      }),

      // Remove item from inventory
      removeItem: (itemId: string) => set((state) => {
        const { [itemId]: removedItem, ...remainingItems } = state.inventory.items;
        
        if (!removedItem) return state;
        
        return {
          inventory: {
            ...state.inventory,
            items: remainingItems,
            currentWeight: state.inventory.currentWeight - (removedItem.weight * (removedItem.quantity || 1))
          }
        };
      }),

      // Update an existing item
      updateItem: (item: Item) => set((state) => {
        if (!state.inventory.items[item.id]) return state;
        
        const oldItem = state.inventory.items[item.id];
        const weightDifference = (item.weight * (item.quantity || 1)) - (oldItem.weight * (oldItem.quantity || 1));
        
        return {
          inventory: {
            ...state.inventory,
            items: {
              ...state.inventory.items,
              [item.id]: item
            },
            currentWeight: state.inventory.currentWeight + weightDifference
          }
        };
      }),

      // Equip an item to a specific slot
      equipItem: (itemId: string, slot: EquipmentSlot) => set((state) => {
        const item = state.inventory.items[itemId];
        if (!item || !item.equippable) return state;
        
        // Unequip current item in the slot if any
        const currentItem = state.equipment.slots[slot];
        let newInventoryItems = { ...state.inventory.items };
        
        if (currentItem) {
          newInventoryItems[currentItem.id] = {
            ...currentItem,
            equipped: false
          };
        }
        
        // Remove the equipped item from inventory
        const { [itemId]: _, ...remainingItems } = newInventoryItems;
        
        return {
          inventory: {
            ...state.inventory,
            items: remainingItems,
            currentWeight: state.inventory.currentWeight - item.weight
          },
          equipment: {
            ...state.equipment,
            slots: {
              ...state.equipment.slots,
              [slot]: { ...item, equipped: true }
            }
          }
        };
      }),

      // Unequip an item from a slot
      unequipItem: (slot: EquipmentSlot) => set((state) => {
        const item = state.equipment.slots[slot];
        if (!item) return state;
        
        // Add item back to inventory without equipped flag
        const { equipped, ...unequippedItem } = item;
        
        return {
          inventory: {
            ...state.inventory,
            items: {
              ...state.inventory.items,
              [item.id]: unequippedItem
            },
            currentWeight: state.inventory.currentWeight + item.weight
          },
          equipment: {
            ...state.equipment,
            slots: {
              ...state.equipment.slots,
              [slot]: null
            }
          }
        };
      }),

      // Use an item (for consumables)
      useItem: (itemId: string) => set((state) => {
        const item = state.inventory.items[itemId];
        if (!item || !item.usable) return state;
        
        // If stackable and quantity > 1, reduce quantity
        if (item.stackable && item.quantity && item.quantity > 1) {
          return {
            inventory: {
              ...state.inventory,
              items: {
                ...state.inventory.items,
                [itemId]: {
                  ...item,
                  quantity: item.quantity - 1
                }
              },
              currentWeight: state.inventory.currentWeight - item.weight
            }
          };
        }
        
        // Otherwise remove the item
        const { [itemId]: _, ...remainingItems } = state.inventory.items;
        
        return {
          inventory: {
            ...state.inventory,
            items: remainingItems,
            currentWeight: state.inventory.currentWeight - item.weight
          }
        };
      }),

      // Add gold to inventory
      addGold: (amount: number) => set((state) => ({
        inventory: {
          ...state.inventory,
          gold: state.inventory.gold + amount
        }
      })),

      // Remove gold from inventory
      removeGold: (amount: number) => set((state) => ({
        inventory: {
          ...state.inventory,
          gold: Math.max(0, state.inventory.gold - amount)
        }
      })),

      // Set active container
      setActiveContainer: (containerId: string | null) => set({
        activeContainerId: containerId
      }),

      // Create a new container
      createContainer: (name: string, slots: number) => {
        const newContainer: Container = {
          id: `container-${Date.now()}`,
          name,
          slots,
          items: {}
        };
        
        set((state) => ({
          containers: {
            ...state.containers,
            [newContainer.id]: newContainer
          }
        }));
        
        return newContainer;
      },

      // Calculate current weight
      calculateWeight: () => {
        const state = get();
        const inventoryWeight = Object.values(state.inventory.items).reduce(
          (total, item) => total + (item.weight * (item.quantity || 1)), 
          0
        );
        
        // Update stored weight
        set((state) => ({
          inventory: {
            ...state.inventory,
            currentWeight: inventoryWeight
          }
        }));
        
        return inventoryWeight;
      }
    }),
    {
      name: 'tavern-inventory-storage', // Name for localStorage
    }
  )
);