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
  common: 'border-gray-400 bg-gray-100',
  uncommon: 'border-green-400 bg-green-50',
  rare: 'border-blue-400 bg-blue-50',
  epic: 'border-purple-400 bg-purple-50',
  legendary: 'border-amber-400 bg-amber-50'
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
            className="h-16 w-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 bg-gray-50"
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
                <div className="text-xs font-medium truncate max-w-full px-1">
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
            <TooltipContent className="w-64 p-0 border-2" side="right">
              <div className={`p-2 ${rarityClasses[item.rarity]} rounded`}>
                <h4 className="font-bold text-sm">{item.name}</h4>
                <p className="text-xs text-gray-600 capitalize">{item.rarity} {item.category}</p>
                <p className="text-xs mt-1">{item.description}</p>
                
                {item.effects && item.effects.length > 0 && (
                  <div className="mt-2">
                    <h5 className="text-xs font-bold">Effects:</h5>
                    <ul className="text-xs pl-2">
                      {item.effects.map((effect, idx) => (
                        <li key={idx} className="text-gray-700">{effect.description}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="flex justify-between text-xs mt-2">
                  <span>Value: {item.value} gold</span>
                  <span>Weight: {item.weight}</span>
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