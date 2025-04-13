import React, { useState } from 'react';
import { useInventoryStore } from '../../lib/inventory/inventoryStore';
import { getAvailableItems } from '../../lib/inventory/sampleItems';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const categoryEmojis: Record<string, string> = {
  potion: '🧪',
  weapon: '⚔️',
  armor: '🛡️',
  food: '🍖',
  drink: '🍺',
  trinket: '📿',
  quest: '📜',
  misc: '📦'
};

const InventoryItemPicker = () => {
  const { addItem, addGold } = useInventoryStore();
  const availableItems = getAvailableItems();
  
  // Group items by category
  const itemsByCategory = availableItems.reduce<Record<string, typeof availableItems>>((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  const categories = Object.keys(itemsByCategory);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const activeCategory = categories[activeCategoryIndex];
  
  // Navigate to previous category
  const prevCategory = () => {
    setActiveCategoryIndex((current) => 
      current === 0 ? categories.length - 1 : current - 1
    );
  };
  
  // Navigate to next category
  const nextCategory = () => {
    setActiveCategoryIndex((current) => 
      current === categories.length - 1 ? 0 : current + 1
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-[#3A2419] text-[#FFD700] border-2 border-[#8B4513] hover:bg-[#2C1810]"
        >
          <span className="mr-1">✨</span> Get Items
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 border-4 border-[#8B4513] bg-[#2C1810] text-[#E8D6B3] p-0 shadow-xl">
        <div className="space-y-2">
          <div className="bg-[#3A2419] p-3 border-b border-[#8B4513]">
            <h3 className="font-bold text-[#FFD700] text-center">Add Items to Inventory</h3>
          </div>
          
          <div className="px-4 py-2 flex justify-between space-x-2">
            <Button 
              className="flex-1 bg-[#5A4439] hover:bg-[#4A3429] text-[#FFD700] border border-[#8B4513]"
              size="sm" 
              onClick={() => addGold(10)}
            >
              Add 10 Gold
            </Button>
            <Button 
              className="flex-1 bg-[#5A4439] hover:bg-[#4A3429] text-[#FFD700] border border-[#8B4513]"
              size="sm" 
              onClick={() => addGold(100)}
            >
              Add 100 Gold
            </Button>
          </div>
          
          {/* Category slider with arrows */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#3A2419] border-y border-[#8B4513]">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={prevCategory}
              className="h-8 w-8 rounded-full bg-[#5A4439] text-[#FFD700] hover:bg-[#4A3429] hover:text-[#FFD700]"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{categoryEmojis[activeCategory]}</span>
              <span className="capitalize font-bold text-[#FFD700]">{activeCategory}</span>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={nextCategory}
              className="h-8 w-8 rounded-full bg-[#5A4439] text-[#FFD700] hover:bg-[#4A3429] hover:text-[#FFD700]"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Items in the current category */}
          <div className="max-h-60 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-[#2C1810] to-[#3A2419]">
            {itemsByCategory[activeCategory].map(item => (
              <div 
                key={item.id} 
                className="bg-[#3A2419] rounded border border-[#8B4513] p-3 shadow-md overflow-hidden"
                style={{
                  backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiMzYTI0MTkiIG9wYWNpdHk9IjAuOCIvPjxwYXRoIGQ9Ik0wIDAgTDEwIDAgTDEwIDEwIEwwIDEwIFoiIGZpbGw9IiM0YTM0MjkiIG9wYWNpdHk9IjAuMiIvPjxwYXRoIGQ9Ik0yMCAwIEwzMCAwIEwzMCAxMCBMMjAgMTAgWiIgZmlsbD0iIzRhMzQyOSIgb3BhY2l0eT0iMC4yIi8+PHBhdGggZD0iTTEwIDEwIEwyMCAxMCBMMjAgMjAgTDEwIDIwIFoiIGZpbGw9IiM0YTM0MjkiIG9wYWNpdHk9IjAuMiIvPjxwYXRoIGQ9Ik0zMCAxMCBMNDAgMTAgTDQwIDIwIEwzMCAyMCBaIiBmaWxsPSIjNGEzNDI5IiBvcGFjaXR5PSIwLjIiLz48cGF0aCBkPSJNMCAyMCBMMTAgMjAgTDEwIDMwIEwwIDMwIFoiIGZpbGw9IiM0YTM0MjkiIG9wYWNpdHk9IjAuMiIvPjxwYXRoIGQ9Ik0yMCAyMCBMMzAgMjAgTDMwIDMwIEwyMCAzMCBaIiBmaWxsPSIjNGEzNDI5IiBvcGFjaXR5PSIwLjIiLz48cGF0aCBkPSJNMTAgMzAgTDIwIDMwIEwyMCA0MCBMMTAgNDAgWiIgZmlsbD0iIzRhMzQyOSIgb3BhY2l0eT0iMC4yIi8+PHBhdGggZD0iTTMwIDMwIEw0MCAzMCBMNDAgNDAgTDMwIDQwIFoiIGZpbGw9IiM0YTM0MjkiIG9wYWNpdHk9IjAuMiIvPjwvc3ZnPg==')",
                  backgroundRepeat: "repeat",
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <span className="text-xl mr-2">{categoryEmojis[item.category]}</span>
                    <span className="font-bold text-[#E8D6B3]">{item.name}</span>
                  </div>
                  <Badge 
                    className="capitalize"
                    style={{
                      background: 
                        item.rarity === 'common' ? '#6b7280' :
                        item.rarity === 'uncommon' ? '#10b981' :
                        item.rarity === 'rare' ? '#3b82f6' :
                        item.rarity === 'epic' ? '#a78bfa' :
                        '#fbbf24',
                      color: '#fff',
                      border: 'none',
                    }}
                  >
                    {item.rarity}
                  </Badge>
                </div>
                
                <p className="text-sm mb-3 text-[#E8D6B3] opacity-90">{item.description}</p>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-[#FFD700]">{item.value} gold • {item.weight} wt</div>
                  <Button 
                    size="sm"
                    className="bg-[#8B4513] hover:bg-[#9B5523] text-[#FFD700] border-none"
                    onClick={() => addItem(item)}
                  >
                    Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default InventoryItemPicker;