import { FC, useState } from 'react';
import { useWebSocketStore } from '@/lib/websocket';
import { Item, MenuItem } from '@shared/schema';
import { MenuItemIcon } from '@/assets/svgs/menu-items';
import { UserCircle, Trophy, HeartHandshake, ShoppingBag, Coffee, Utensils } from 'lucide-react';
import { getMoodDescription, getMoodColor, getMoodIcon } from '../utils/mood';

// Storage keys for saving user preferences (must match those in CharacterSelection.tsx)
const STORAGE_KEY_USERNAME = 'tavern_username';
const STORAGE_KEY_AVATAR = 'tavern_selected_avatar';
const STORAGE_KEY_AUTO_LOGIN = 'tavern_auto_login';

// Shop tabs enum
enum ShopTab {
  EQUIPMENT = 'equipment',
  CONSUMABLES = 'consumables',
  MENU = 'menu'
}

// Menu categories
enum MenuCategory {
  DRINKS = 'drinks',
  FOOD = 'food',
  SPECIALS = 'specials'
}

// Utility function to format currency (silver/gold)
const formatCurrency = (silver: number): string => {
  if (silver < 100) {
    return `${silver}s`;
  }
  
  const gold = Math.floor(silver / 100);
  const remainingSilver = silver % 100;
  
  if (remainingSilver === 0) {
    return `${gold}g`;
  }
  
  return `${gold}g ${remainingSilver}s`;
};

const getRarityColor = (rarity: string): string => {
  switch (rarity.toLowerCase()) {
    case 'common': return 'text-gray-300';
    case 'uncommon': return 'text-green-400';
    case 'rare': return 'text-blue-400';
    case 'epic': return 'text-purple-400';
    case 'legendary': return 'text-yellow-400';
    default: return 'text-gray-300';
  }
};

const ShopPanel: FC = () => {
  const { 
    showShop, 
    toggleShop, 
    shopItems, 
    buyItem, 
    currency,
    menuItems,
    orderMenuItem
  } = useWebSocketStore();
  
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<ShopTab>(ShopTab.EQUIPMENT);
  const [menuCategory, setMenuCategory] = useState<MenuCategory>(MenuCategory.DRINKS);
  
  if (!showShop) {
    return null;
  }
  
  // Group items by type
  const groupedItems: Record<string, Item[]> = {};
  shopItems.forEach(item => {
    if (!groupedItems[item.type]) {
      groupedItems[item.type] = [];
    }
    groupedItems[item.type].push(item);
  });
  
  // Get available types for equipment
  const itemTypes = Object.keys(groupedItems);
  
  // Filter menu items by category
  const filteredMenuItems = menuItems.filter(item => item.category === menuCategory);
  
  const handleBuy = () => {
    if (selectedItem) {
      buyItem(selectedItem.id, quantity);
      
      // Reset quantity after purchase
      setQuantity(1);
    }
  };
  
  const handleOrderMenuItem = (itemId: number) => {
    orderMenuItem(itemId);
  };
  
  // Check if user can afford the selected item
  const canAfford = selectedItem ? currency.silver >= (selectedItem.value * quantity) : false;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="shop-panel max-w-4xl w-full min-h-[40rem] max-h-[90vh] overflow-hidden
                     bg-[#2C1810] border-8 border-[#8B4513] rounded-lg shadow-2xl relative">
        {/* Close button */}
        <button 
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center
                     bg-[#8B4513] text-[#FFD700] rounded-full hover:bg-[#9B5523] z-10"
          onClick={toggleShop}
        >
          ✕
        </button>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#614119] via-[#8B4513] to-[#614119] p-3 border-b-4 border-[#2C1810] flex justify-between items-center">
          <h2 className="font-['Press_Start_2P'] text-[#FFD700] text-center text-xl flex-grow">TAVERN SHOP</h2>
          <div className="text-[#FFD700] font-['VT323'] text-xl px-4 py-1 bg-[#2C1810] rounded border border-[#8B4513]">
            {formatCurrency(currency.silver)}
          </div>
        </div>
        
        {/* Shop Tabs */}
        <div className="shop-tabs flex border-b border-[#8B4513]">
          <button 
            className={`shop-tab flex-1 py-2 px-4 font-['VT323'] text-xl text-[#E8D6B3] ${
              activeTab === ShopTab.EQUIPMENT 
                ? 'bg-[#8B4513]' 
                : 'bg-[#2C1810] hover:bg-[#3C281A]'
            }`}
            onClick={() => setActiveTab(ShopTab.EQUIPMENT)}
          >
            <div className="flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 mr-1" />
              <span>Equipment</span>
            </div>
          </button>
          <button 
            className={`shop-tab flex-1 py-2 px-4 font-['VT323'] text-xl text-[#E8D6B3] ${
              activeTab === ShopTab.CONSUMABLES 
                ? 'bg-[#8B4513]' 
                : 'bg-[#2C1810] hover:bg-[#3C281A]'
            }`}
            onClick={() => setActiveTab(ShopTab.CONSUMABLES)}
          >
            <div className="flex items-center justify-center">
              <Coffee className="w-4 h-4 mr-1" />
              <span>Consumables</span>
            </div>
          </button>
          <button 
            className={`shop-tab flex-1 py-2 px-4 font-['VT323'] text-xl text-[#E8D6B3] ${
              activeTab === ShopTab.MENU 
                ? 'bg-[#8B4513]' 
                : 'bg-[#2C1810] hover:bg-[#3C281A]'
            }`}
            onClick={() => setActiveTab(ShopTab.MENU)}
          >
            <div className="flex items-center justify-center">
              <Utensils className="w-4 h-4 mr-1" />
              <span>Tavern Menu</span>
            </div>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 max-h-[calc(90vh-16rem)] overflow-y-auto">
          {activeTab === ShopTab.MENU ? (
            <>
              {/* Menu Categories */}
              <div className="categories bg-[#3A2419] rounded-lg p-4 border-2 border-[#8B4513] 
                             shadow-[inset_0_0_10px_rgba(0,0,0,0.6)] flex flex-col">
                <h3 className="font-['VT323'] text-[#FFD700] text-center text-xl mb-3 border-b border-[#8B4513] pb-2">
                  Tavern Menu
                </h3>
                
                <div className="menu-tabs flex mb-3 border-b border-[#614119] pb-2">
                  <button 
                    className={`menu-tab flex-1 py-1 px-3 font-['VT323'] text-lg text-[#E8D6B3] ${
                      menuCategory === MenuCategory.DRINKS 
                        ? 'bg-[#8B4513] rounded-t' 
                        : 'bg-[#2C1810] hover:bg-[#3C281A] rounded-t'
                    }`}
                    onClick={() => setMenuCategory(MenuCategory.DRINKS)}
                  >
                    Drinks
                  </button>
                  <button 
                    className={`menu-tab flex-1 py-1 px-3 font-['VT323'] text-lg text-[#E8D6B3] ${
                      menuCategory === MenuCategory.FOOD 
                        ? 'bg-[#8B4513] rounded-t' 
                        : 'bg-[#2C1810] hover:bg-[#3C281A] rounded-t'
                    }`}
                    onClick={() => setMenuCategory(MenuCategory.FOOD)}
                  >
                    Food
                  </button>
                  <button 
                    className={`menu-tab flex-1 py-1 px-3 font-['VT323'] text-lg text-[#E8D6B3] ${
                      menuCategory === MenuCategory.SPECIALS 
                        ? 'bg-[#8B4513] rounded-t' 
                        : 'bg-[#2C1810] hover:bg-[#3C281A] rounded-t'
                    }`}
                    onClick={() => setMenuCategory(MenuCategory.SPECIALS)}
                  >
                    Specials
                  </button>
                </div>
                
                <div className="menu-items flex-grow overflow-y-auto">
                  {filteredMenuItems.length === 0 ? (
                    <div className="text-center py-8 text-[#E8D6B3] font-['VT323'] text-xl">
                      Nothing on the menu yet. Check back later!
                    </div>
                  ) : (
                    filteredMenuItems.map(item => (
                      <div 
                        key={item.id}
                        className="menu-item mb-4 flex gap-3 p-2 border border-transparent hover:border-[#FFD700] rounded-sm cursor-pointer transition-all hover:scale-[1.03] hover:bg-[rgba(255,215,0,0.1)]"
                        onClick={() => handleOrderMenuItem(item.id)}
                      >
                        <div className="item-icon w-16 h-16 bg-[#2C1810] flex items-center justify-center rounded-sm">
                          <MenuItemIcon 
                            icon={item.icon} 
                            className="w-12 h-12 text-[#FFD700]"
                          />
                        </div>
                        <div className="item-details flex-1">
                          <h3 className="font-['Press_Start_2P'] text-[#FFD700] text-sm">{item.name}</h3>
                          <p className="text-[#E8D6B3] opacity-80 text-xs mt-1 font-['VT323']">{item.description}</p>
                          <div className="item-price mt-2 text-xs text-[#FFD700] font-['VT323']">{item.price} gold coins</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Menu Description */}
              <div className="menu-info bg-[#3A2419] rounded-lg p-4 border-2 border-[#8B4513] 
                           shadow-[inset_0_0_10px_rgba(0,0,0,0.6)] flex flex-col">
                <h3 className="font-['VT323'] text-[#FFD700] text-center text-xl mb-3 border-b border-[#8B4513] pb-2">
                  Tavern Special Menu
                </h3>
                
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="menu-icon text-5xl text-[#8B4513] mb-4">
                    {menuCategory === MenuCategory.DRINKS ? '🍺' : 
                     menuCategory === MenuCategory.FOOD ? '🍖' : '✨'}
                  </div>
                  <h3 className="font-['VT323'] text-[#FFD700] text-xl mb-2">
                    {menuCategory === MenuCategory.DRINKS ? "Fine Tavern Drinks" : 
                     menuCategory === MenuCategory.FOOD ? "Hearty Tavern Food" : 
                     "Today's Specials"}
                  </h3>
                  <p className="text-[#E8D6B3] mb-6">
                    Click on an item to order it from the tavern staff. Special drinks and food may affect your interactions with the bartenders!
                  </p>
                  
                  <div className="fantasy-border p-4 bg-[#2C1810] border-2 border-[#8B4513] rounded relative mt-4">
                    <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#8B4513] rounded-full"></div>
                    <div className="absolute -top-3 -right-3 w-6 h-6 bg-[#8B4513] rounded-full"></div>
                    <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-[#8B4513] rounded-full"></div>
                    <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-[#8B4513] rounded-full"></div>
                    <p className="text-[#E8D6B3] italic font-['VT323'] text-center">
                      "The finest brews and meals in all the realm! Try our famous Dragonfire Ale or the legendary Chimera Steak!"
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Item Categories */}
              <div className="categories bg-[#3A2419] rounded-lg p-4 border-2 border-[#8B4513] 
                             shadow-[inset_0_0_10px_rgba(0,0,0,0.6)] flex flex-col">
                <h3 className="font-['VT323'] text-[#FFD700] text-center text-xl mb-3 border-b border-[#8B4513] pb-2">
                  {activeTab === ShopTab.EQUIPMENT ? "Equipment & Weapons" : "Potions & Scrolls"}
                </h3>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {itemTypes
                    .filter(type => {
                      if (activeTab === ShopTab.EQUIPMENT) {
                        return ['weapon', 'armor', 'accessory'].includes(type.toLowerCase());
                      } else {
                        return ['consumable', 'potion', 'scroll'].includes(type.toLowerCase());
                      }
                    })
                    .map(type => (
                      <button
                        key={type}
                        className="px-3 py-1 bg-[#2C1810] text-[#E8D6B3] capitalize font-['VT323'] 
                                   border border-[#8B4513] rounded hover:bg-[#4A3429]"
                      >
                        {type}
                      </button>
                    ))
                  }
                </div>
                
                <div className="items-grid grid grid-cols-3 gap-2 mt-3 flex-grow overflow-y-auto">
                  {shopItems
                    .filter(item => {
                      if (activeTab === ShopTab.EQUIPMENT) {
                        return ['weapon', 'armor', 'accessory'].includes(item.type.toLowerCase());
                      } else {
                        return ['consumable', 'potion', 'scroll'].includes(item.type.toLowerCase());
                      }
                    })
                    .map(item => (
                      <div 
                        key={item.id}
                        className={`item-slot p-1 rounded border group
                                   ${selectedItem?.id === item.id 
                                     ? 'bg-[#4A3429] border-[#FFD700]' 
                                     : 'bg-[#2C1810] border-[#614119]'}
                                   hover:border-[#9B5523] cursor-pointer transition-colors
                                   flex flex-col items-center justify-center relative`}
                        onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                      >
                        <div className="w-10 h-10 flex items-center justify-center">
                          <span className={`text-lg ${getRarityColor(item.rarity)}`}>
                            {item.icon === 'default_item' ? '⚔️' : item.icon}
                          </span>
                        </div>
                        <div className="text-[#E8D6B3] text-xs mt-1 truncate max-w-full px-1">
                          {item.name}
                        </div>
                        <div className="text-[#FFD700] text-xs">
                          {formatCurrency(item.value)}
                        </div>
                        
                        {/* Quick-view tooltip */}
                        <div className="invisible group-hover:visible absolute left-full ml-2 top-0 z-10
                                        bg-[#1C0E05] text-[#E8D6B3] p-2 rounded shadow-lg border border-[#8B4513] 
                                        text-xs w-40 whitespace-normal">
                          <div className={`font-bold ${getRarityColor(item.rarity)}`}>{item.name}</div>
                          <div className="text-[#A9A9A9] capitalize">{item.type}</div>
                          <div className="mt-1">{item.description}</div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </>
          )}
        
          
          {/* Item Details */}
          <div className="item-details bg-[#3A2419] rounded-lg p-4 border-2 border-[#8B4513] 
                         shadow-[inset_0_0_10px_rgba(0,0,0,0.6)] flex flex-col">
            {selectedItem ? (
              <>
                <h3 className={`font-['VT323'] text-xl mb-2 text-center border-b border-[#8B4513] pb-2 ${getRarityColor(selectedItem.rarity)}`}>
                  {selectedItem.name}
                </h3>
                
                <div className="flex justify-center my-4">
                  <div className="w-16 h-16 bg-[#2C1810] rounded border-2 border-[#8B4513] flex items-center justify-center">
                    <span className={`text-3xl ${getRarityColor(selectedItem.rarity)}`}>
                      {selectedItem.icon === 'default_item' ? '⚔️' : selectedItem.icon}
                    </span>
                  </div>
                </div>
                
                <div className="mt-2">
                  <p className="text-[#A9A9A9] text-sm capitalize">
                    {selectedItem.type} - {selectedItem.rarity}
                  </p>
                  <p className="text-[#E8D6B3] text-sm mt-2 mb-4">
                    {selectedItem.description}
                  </p>
                  
                  {/* Stats */}
                  {Object.keys(selectedItem.stats as Record<string, any>).length > 0 && (
                    <div className="stats-grid grid grid-cols-2 gap-x-4 gap-y-1 mt-4 mb-4 p-2 bg-[#2C1810] rounded">
                      <h4 className="col-span-2 text-[#FFD700] font-['VT323'] mb-1">Item Properties:</h4>
                      {Object.entries(selectedItem.stats as Record<string, any>).map(([stat, value]) => (
                        <div key={stat} className="flex justify-between">
                          <span className="text-[#A9A9A9] text-xs capitalize">{stat}:</span>
                          <span className="text-[#E8D6B3] text-xs">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Purchase section */}
                  <div className="mt-4 p-3 bg-[#2C1810] rounded border border-[#8B4513]">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[#E8D6B3] font-['VT323']">Price:</span>
                      <span className="text-[#FFD700] font-['VT323']">{formatCurrency(selectedItem.value)}</span>
                    </div>
                    
                    {selectedItem.stackable && (
                      <div className="flex items-center mb-3">
                        <span className="text-[#E8D6B3] font-['VT323'] mr-2">Quantity:</span>
                        <div className="flex border border-[#8B4513] rounded overflow-hidden">
                          <button 
                            className="bg-[#4A3429] text-[#E8D6B3] px-2 py-0.5 hover:bg-[#5A4439]"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          >
                            -
                          </button>
                          <span className="bg-[#2C1810] text-[#E8D6B3] px-3 py-0.5 min-w-[40px] text-center">
                            {quantity}
                          </span>
                          <button 
                            className="bg-[#4A3429] text-[#E8D6B3] px-2 py-0.5 hover:bg-[#5A4439]"
                            onClick={() => setQuantity(Math.min(selectedItem.maxStack || 99, quantity + 1))}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[#E8D6B3] font-['VT323']">Total:</span>
                      <span className="text-[#FFD700] font-['VT323']">{formatCurrency(selectedItem.value * quantity)}</span>
                    </div>
                    
                    <button 
                      className={`w-full py-2 font-['Press_Start_2P'] text-sm rounded 
                                ${canAfford 
                                  ? 'bg-gradient-to-b from-[#8B4513] to-[#6B3503] text-[#FFD700] hover:from-[#9B5523] hover:to-[#7B4503]' 
                                  : 'bg-[#4A3429] text-[#A9A9A9] cursor-not-allowed'}
                                border-2 border-[#614119] relative overflow-hidden`}
                      onClick={handleBuy}
                      disabled={!canAfford}
                    >
                      {/* Wood texture overlay */}
                      <div className="absolute inset-0 opacity-20 pointer-events-none"
                          style={{
                            backgroundColor: "#8B4513"
                          }}
                      ></div>
                      
                      <span className="relative z-10">
                        {canAfford ? 'PURCHASE' : 'NOT ENOUGH SILVER'}
                      </span>
                    </button>
                  </div>
                  
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-5xl text-[#8B4513] mb-4">⚔️</div>
                <h3 className="font-['VT323'] text-[#FFD700] text-xl mb-2">Welcome to the Shop!</h3>
                <p className="text-[#E8D6B3]">Select an item from the left to view its details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopPanel;