import React from 'react';
import { Item } from '../../lib/inventory/types';
import { Draggable } from 'react-beautiful-dnd';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Badge } from '../ui/badge';

interface InventorySlotProps {
  item: Item | null;
  index: number;
  slotId: string;
  onClick?: (item: Item) => void;
}

// Map rarity to CSS classes
const rarityClasses = {
  common: 'border-[#8B7359] bg-[#3A2419]',
  uncommon: 'border-[#10b981] bg-[#3A2419]',
  rare: 'border-[#3b82f6] bg-[#3A2419]',
  epic: 'border-[#a78bfa] bg-[#3A2419]',
  legendary: 'border-[#fbbf24] bg-[#3A2419]'
};

// Map category to icon placeholder (you could replace these with actual SVG icons)
const categoryIcons = {
  potion: '🧪',
  weapon: '⚔️',
  armor: '🛡️',
  food: '🍖',
  drink: '🍺',
  trinket: '📿',
  quest: '📜',
  misc: '📦'
};

const InventorySlot: React.FC<InventorySlotProps> = ({ item, index, slotId, onClick }) => {
  if (!item) {
    // Empty slot
    return (
      <Draggable draggableId={slotId} index={index} isDragDisabled={true}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className="h-16 w-16 border-2 border-dashed border-[#8B4513] rounded flex items-center justify-center text-[#8B7359] bg-[#2C1810]"
          >
            <span className="text-xs">Empty</span>
          </div>
        )}
      </Draggable>
    );
  }

  // Filled slot
  return (
    <Draggable draggableId={slotId} index={index}>
      {(provided, snapshot) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className={`h-16 w-16 border-2 ${rarityClasses[item.rarity]} rounded flex flex-col items-center justify-center relative cursor-pointer transform transition-transform ${snapshot.isDragging ? 'scale-105 shadow-lg z-10' : ''}`}
                onClick={() => onClick && onClick(item)}
              >
                <div className="text-2xl">
                  {item.icon.startsWith('http') 
                    ? <img src={item.icon} alt={item.name} className="h-8 w-8 object-contain" /> 
                    : categoryIcons[item.category as keyof typeof categoryIcons]}
                </div>
                <div className="text-xs font-medium truncate max-w-full px-1 text-[#E8D6B3]">
                  {item.name}
                </div>
                
                {/* Quantity badge for stackable items */}
                {item.stackable && item.quantity && item.quantity > 1 && (
                  <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs">
                    {item.quantity}
                  </Badge>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent className="w-64 p-0 border-2 border-[#8B4513]" side="right">
              <div className={`p-3 ${rarityClasses[item.rarity]} rounded`} 
                style={{
                  backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiMzYTI0MTkiIG9wYWNpdHk9IjAuOCIvPjxwYXRoIGQ9Ik0wIDAgTDEwIDAgTDEwIDEwIEwwIDEwIFoiIGZpbGw9IiM0YTM0MjkiIG9wYWNpdHk9IjAuMiIvPjxwYXRoIGQ9Ik0yMCAwIEwzMCAwIEwzMCAxMCBMMjAgMTAgWiIgZmlsbD0iIzRhMzQyOSIgb3BhY2l0eT0iMC4yIi8+PHBhdGggZD0iTTEwIDEwIEwyMCAxMCBMMjAgMjAgTDEwIDIwIFoiIGZpbGw9IiM0YTM0MjkiIG9wYWNpdHk9IjAuMiIvPjxwYXRoIGQ9Ik0zMCAxMCBMNDAgMTAgTDQwIDIwIEwzMCAyMCBaIiBmaWxsPSIjNGEzNDI5IiBvcGFjaXR5PSIwLjIiLz48cGF0aCBkPSJNMCAyMCBMMTAgMjAgTDEwIDMwIEwwIDMwIFoiIGZpbGw9IiM0YTM0MjkiIG9wYWNpdHk9IjAuMiIvPjxwYXRoIGQ9Ik0yMCAyMCBMMzAgMjAgTDMwIDMwIEwyMCAzMCBaIiBmaWxsPSIjNGEzNDI5IiBvcGFjaXR5PSIwLjIiLz48cGF0aCBkPSJNMTAgMzAgTDIwIDMwIEwyMCA0MCBMMTAgNDAgWiIgZmlsbD0iIzRhMzQyOSIgb3BhY2l0eT0iMC4yIi8+PHBhdGggZD0iTTMwIDMwIEw0MCAzMCBMNDAgNDAgTDMwIDQwIFoiIGZpbGw9IiM0YTM0MjkiIG9wYWNpdHk9IjAuMiIvPjwvc3ZnPg==')",
                  backgroundRepeat: "repeat",
                }}
              >
                <div className="bg-[#3A2419] p-2 rounded border border-[#8B4513] shadow-inner mb-2">
                  <h4 className="font-bold text-sm text-[#FFD700]">{item.name}</h4>
                  <p className="text-xs text-[#E8D6B3] capitalize">{item.rarity} {item.category}</p>
                </div>
                
                <p className="text-xs mt-1 text-[#E8D6B3]">{item.description}</p>
                
                {item.effects && item.effects.length > 0 && (
                  <div className="mt-2 border-t border-[#8B4513] pt-2">
                    <h5 className="text-xs font-bold text-[#FFD700]">Effects:</h5>
                    <ul className="text-xs pl-2">
                      {item.effects.map((effect, idx) => (
                        <li key={idx} className="text-[#E8D6B3]">{effect.description}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="flex justify-between text-xs mt-2 pt-2 border-t border-[#8B4513]">
                  <span className="text-[#FFD700]">Value: {item.value} gold</span>
                  <span className="text-[#E8D6B3]">Weight: {item.weight}</span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </Draggable>
  );
};

export default InventorySlot;