import type { User, Bartender, UserInventory, Mood } from './models.ts';

type IUserActionHandler = (userId: number, data: any) => Promise<User>;
type IBartenderActionHandler = (userId: number, bartenderId: number, data: any) => Promise<Bartender>;
type IInventoryActionHandler = (userId: number, data: any) => Promise<UserInventory[]>;

// Define action types using Enums for better type safety
enum UserActionTypes {
  UpdateGold = 'updateGold',
  UpdateLevel = 'updateLevel'
}

enum BartenderActionTypes {
  UpdateLevel = 'updateLevel'
}

enum InventoryActionTypes {
  AddItem = 'addItem',
  RemoveItem = 'removeItem'
}

// Define handler interfaces
interface IMCP {
  handleUserAction(userId: number, action: string, data?: any): Promise<User>;
  handleBartenderAction(userId: number, bartenderId: number, action: string, data?: any): Promise<Bartender>;
  handleInventoryAction(userId: number, action: string, data?: any): Promise<UserInventory[]>;
}

// Refactored MCP implementation
export class MCP implements IMCP {
  private userActionHandlers: Record<UserActionTypes, IUserActionHandler>;
  private bartenderActionHandlers: Record<BartenderActionTypes, IBartenderActionHandler>;
  private inventoryActionHandlers: Record<InventoryActionTypes, IInventoryActionHandler>;

  constructor() {
    this.userActionHandlers = {
      [UserActionTypes.UpdateGold]: this.handleUpdateGold.bind(this),
      [UserActionTypes.UpdateLevel]: this.handleUpdateLevel.bind(this)
    };

    this.bartenderActionHandlers = {
      [BartenderActionTypes.UpdateLevel]: this.handleBartenderUpdateLevel.bind(this)
    };

    this.inventoryActionHandlers = {
      [InventoryActionTypes.AddItem]: this.handleAddItem.bind(this),
      [InventoryActionTypes.RemoveItem]: this.handleRemoveItem.bind(this)
    };
  }

  private initializeDefaultData() {
    // ... existing initialization code ...
  }

  private async handleUpdateGold(userId: number, data: any): Promise<User> {
    // ... existing update gold logic ...
    return { id: userId, gold: data.newGold } as User;
  }

  private async handleUpdateLevel(userId: number, data: any): Promise<User> {
    // ... existing update level logic ...
    return { id: userId, level: data.newLevel } as User;
  }

  private async handleBartenderUpdateLevel(userId: number, bartenderId: number, data: any): Promise<Bartender> {
    // ... existing bartender update level logic ...
    return { id: bartenderId, level: data.newLevel } as Bartender;
  }

  private async handleAddItem(userId: number, data: any): Promise<UserInventory[]> {
    // ... existing add item logic ...
    return [{ id: 1, userId, item: data.item }] as UserInventory[];
  }

  private async handleRemoveItem(userId: number, data: any): Promise<UserInventory[]> {
    // ... existing remove item logic ...
    return [] as UserInventory[];
  }

  async handleUserAction(userId: number, action: string, data?: any): Promise<User> {
    const actionType = UserActionTypes[action as keyof typeof UserActionTypes];
    
    if (!actionType) {
      throw new Error(`Invalid user action: ${action}`);
    }

    const handler = this.userActionHandlers[actionType];
    if (!handler) {
      throw new Error(`No handler found for user action: ${action}`);
    }

    return handler(userId, data);
  }

  async handleBartenderAction(userId: number, bartenderId: number, action: string, data?: any): Promise<Bartender> {
    const actionType = BartenderActionTypes[action as keyof typeof BartenderActionTypes];
    
    if (!actionType) {
      throw new Error(`Invalid bartender action: ${action}`);
    }

    const handler = this.bartenderActionHandlers[actionType];
    if (!handler) {
      throw new Error(`No handler found for bartender action: ${action}`);
    }

    return handler(userId, bartenderId, data);
  }

  async handleInventoryAction(userId: number, action: string, data?: any): Promise<UserInventory[]> {
    const actionType = InventoryActionTypes[action as keyof typeof InventoryActionTypes];
    
    if (!actionType) {
      throw new Error(`Invalid inventory action: ${action}`);
    }

    const handler = this.inventoryActionHandlers[actionType];
    if (!handler) {
      throw new Error(`No handler found for inventory action: ${action}`);
    }

    return handler(userId, data);
  }
}