
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useSpring, animated } from '@react-spring/web';

// Define inventory item interface
interface InventoryItem {
  id: string;
  name: string;
  icon: string;
  type: 'potion' | 'weapon' | 'armor' | 'quest';
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

// Mock data for initial inventory
const initialItems: InventoryItem[] = [
  { id: 'item-1', name: 'Health Potion', icon: '🧪', type: 'potion', rarity: 'common' },
  { id: 'item-2', name: 'Rusty Sword', icon: '🗡️', type: 'weapon', rarity: 'common' },
  { id: 'item-3', name: 'Magic Shield', icon: '🛡️', type: 'armor', rarity: 'uncommon' },
  { id: 'item-4', name: 'Ancient Scroll', icon: '📜', type: 'quest', rarity: 'rare' },
  { id: 'item-5', name: 'Dragon Scale', icon: '🐉', type: 'quest', rarity: 'legendary' },
];

// Get background color based on item rarity
const getRarityColor = (rarity: string): string => {
  switch (rarity) {
    case 'common': return 'bg-gray-700';
    case 'uncommon': return 'bg-green-800';
    case 'rare': return 'bg-blue-800';
    case 'legendary': return 'bg-purple-900';
    default: return 'bg-gray-700';
  }
};

// Individual inventory item component
const InventoryItemComponent: React.FC<{
  item: InventoryItem;
  index: number;
}> = ({ item, index }) => {
  const [hovered, setHovered] = useState(false);
  
  const springProps = useSpring({
    scale: hovered ? 1.05 : 1,
    boxShadow: hovered 
      ? `0 0 10px rgba(255, 215, 0, 0.5)`
      : '0 0 0px transparent',
    config: { tension: 300, friction: 20 }
  });
  
  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <animated.div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...springProps,
            ...(provided.draggableProps.style as any)
          }}
          className={`
            ${getRarityColor(item.rarity)} 
            mb-2 p-3 rounded-md cursor-grab
            ${snapshot.isDragging ? 'shadow-lg opacity-80' : ''}
          `}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div className="flex items-center">
            <span className="text-2xl mr-3">{item.icon}</span>
            <div>
              <p className="font-['VT323'] text-lg text-[#E8D6B3]">{item.name}</p>
              <p className="text-xs text-[#8B4513] capitalize">{item.type} • {item.rarity}</p>
            </div>
          </div>
        </animated.div>
      )}
    </Draggable>
  );
};

interface InventorySystemProps {
  className?: string;
}

const InventorySystem: React.FC<InventorySystemProps> = ({ className }) => {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const newItems = Array.from(items);
    const [movedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, movedItem);
    
    setItems(newItems);
  };
  
  return (
    <div className={`inventory-system ${className || ''}`}>
      <h2 className="font-['Press_Start_2P'] text-lg text-[#FFD700] mb-4">Inventory</h2>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="inventory-items">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="bg-[#2C1810] p-4 rounded-md border-2 border-[#8B4513]"
            >
              {items.map((item, index) => (
                <InventoryItemComponent 
                  key={item.id} 
                  item={item} 
                  index={index} 
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default InventorySystem;
