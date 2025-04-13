import { FC, useState } from 'react';
import { useWebSocketStore } from '@/lib/websocket';
import { Item, UserInventory, EquipmentSlot } from '@shared/schema';
import { PatronAvatar } from '@/assets/svgs/tavern-patrons';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

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

interface InventoryPanelProps {
  onClose: () => void;
}

const InventoryPanel: FC<InventoryPanelProps> = ({ onClose }) => {
  const { 
    inventory, 
    equippedItems, 
    currency, 
    showInventory, 
    equipItem,
    unequipItem,
    sellItem,
    user
  } = useWebSocketStore();
  
  const [selectedItem, setSelectedItem] = useState<(UserInventory & { item: Item }) | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | null>(null);
  
  if (!showInventory) {
    return null;
  }
  
  // Group inventory by type
  const groupedInventory: Record<string, (UserInventory & { item: Item })[]> = {};
  inventory.forEach(item => {
    if (!groupedInventory[item.item.type]) {
      groupedInventory[item.item.type] = [];
    }
    groupedInventory[item.item.type].push(item);
  });
  
  const handleEquip = () => {
    if (selectedItem && selectedSlot) {
      equipItem(selectedItem.itemId, selectedSlot);
      setSelectedItem(null);
      setSelectedSlot(null);
    }
  };
  
  const handleUnequip = (itemId: number) => {
    unequipItem(itemId);
  };
  
  const handleSell = () => {
    if (selectedItem) {
      const quantity = selectedItem.quantity > 1 ? 1 : selectedItem.quantity;
      sellItem(selectedItem.itemId, quantity);
      setSelectedItem(null);
    }
  };
  
  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    
    // Dropped outside of a droppable area
    if (!destination) return;
    
    // Same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;
    
    // Handle equipment drag and drop
    if (destination.droppableId.startsWith('equipment-')) {
      const slotId = destination.droppableId.replace('equipment-', '') as EquipmentSlot;
      const itemId = parseInt(result.draggableId.split('-')[1]);
      const item = inventory.find(item => item.itemId === itemId);
      
      if (item && !equippedItems[slotId]) {
        equipItem(itemId, slotId);
      }
    }
    
    // Handle unequip (drag from equipment to inventory)
    if (source.droppableId.startsWith('equipment-') && destination.droppableId === 'inventory') {
      const itemId = parseInt(result.draggableId.split('-')[1]);
      unequipItem(itemId);
    }
  };
  
  const handleSlotSelect = (slot: EquipmentSlot) => {
    setSelectedSlot(slot === selectedSlot ? null : slot);
  };
  
  // Equipment slots configuration
  const equipmentSlots = [
    { id: 'head', label: 'Head', className: 'col-start-3 col-end-4 row-start-1' },
    { id: 'neck', label: 'Neck', className: 'col-start-3 col-end-4 row-start-2' },
    { id: 'chest', label: 'Chest', className: 'col-start-3 col-end-4 row-start-3' },
    { id: 'hands', label: 'Hands', className: 'col-start-2 col-end-3 row-start-3' },
    { id: 'waist', label: 'Waist', className: 'col-start-3 col-end-4 row-start-4' },
    { id: 'legs', label: 'Legs', className: 'col-start-3 col-end-4 row-start-5' },
    { id: 'feet', label: 'Feet', className: 'col-start-3 col-end-4 row-start-6' },
    { id: 'mainHand', label: 'Main Hand', className: 'col-start-1 col-end-2 row-start-3' },
    { id: 'offHand', label: 'Off Hand', className: 'col-start-5 col-end-6 row-start-3' },
    { id: 'ring1', label: 'Ring 1', className: 'col-start-2 col-end-3 row-start-5' },
    { id: 'ring2', label: 'Ring 2', className: 'col-start-4 col-end-5 row-start-5' },
    { id: 'trinket', label: 'Trinket', className: 'col-start-4 col-end-5 row-start-2' },
  ];
  
  // Custom CSS patterns for cobblestone and wood
  const cobblestonePattern = {
    backgroundImage: `
      radial-gradient(circle at 50% 50%, #5A4A3A 0%, #4A3A2A 25%, #3A2A1A 50%, #2A1A0A 100%),
      radial-gradient(circle at 25% 25%, #5A4A3A 0%, #4A3A2A 20%, transparent 21%),
      radial-gradient(circle at 75% 75%, #5A4A3A 0%, #4A3A2A 20%, transparent 21%),
      radial-gradient(circle at 25% 75%, #5A4A3A 0%, #4A3A2A 20%, transparent 21%),
      radial-gradient(circle at 75% 25%, #5A4A3A 0%, #4A3A2A 20%, transparent 21%)
    `,
    backgroundSize: '20px 20px, 40px 40px, 40px 40px, 40px 40px, 40px 40px',
    backgroundPosition: '0 0, 0 0, 0 0, 0 0, 0 0'
  };
  
  const woodPattern = {
    backgroundImage: `
      repeating-linear-gradient(90deg, 
        #8B4513 0px, #A05723 4px, #8B4513 8px, #7B3503 12px, #8B4513 16px)
    `,
    backgroundSize: '100px 100%'
  };
  
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <div className="inventory-panel max-w-4xl w-full min-h-[40rem] max-h-[90vh] overflow-hidden
                     bg-[#2C1810] rounded-lg shadow-2xl relative"
             style={{
               borderWidth: '12px',
               borderStyle: 'solid',
               borderImageSource: 'linear-gradient(45deg, #A05723, #8B4513, #6B2503)',
               borderImageSlice: '1'
             }}>
        {/* Close button */}
        <button 
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center
                     bg-[#8B4513] text-[#FFD700] rounded-full hover:bg-[#9B5523] z-10"
          onClick={onClose}
        >
          ✕
        </button>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#614119] via-[#8B4513] to-[#614119] p-3 border-b-4 border-[#2C1810]">
          <h2 className="font-['Press_Start_2P'] text-[#FFD700] text-center text-xl">CHARACTER INVENTORY</h2>
        </div>
        
        {/* Player Info */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-[#3A2419] border-b-4 border-[#2C1810]">
          <div className="flex items-center">
            <div className="rounded-full bg-[#2C1810] p-2 mr-3 border-2 border-[#8B4513]">
              {user && <PatronAvatar name={user.avatar} size={48} />}
            </div>
            <div>
              <div className="font-['VT323'] text-[#E8D6B3] text-xl">
                {user?.username || 'Adventurer'}
              </div>
              <div className="font-['VT323'] text-[#A9A9A9] text-sm">
                Level {user?.level || 1}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col justify-center items-center">
            <div className="text-[#FFD700] font-['VT323'] text-xl">
              {formatCurrency(currency.silver)}
            </div>
            <div className="text-[#A9A9A9] font-['VT323'] text-sm">
              Currency
            </div>
          </div>
          
          <div className="flex flex-col justify-center items-center">
            <div className="text-[#E8D6B3] font-['VT323'] text-xl">
              {inventory.reduce((total, item) => total + item.quantity, 0)} / 50
            </div>
            <div className="text-[#A9A9A9] font-['VT323'] text-sm">
              Inventory Slots
            </div>
          </div>
        </div>
        
        {/* Main Inventory Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 max-h-[calc(90vh-12rem)] overflow-y-auto">
          {/* Character Equipment */}
          <div className="equipment rounded-lg p-4 border-2 border-[#8B4513] 
                         shadow-[inset_0_0_10px_rgba(0,0,0,0.6)]"
               style={cobblestonePattern}>
            <h3 className="font-['Press_Start_2P'] text-[#FFD700] text-center text-xl mb-4 border-b-2 border-[#8B4513] pb-2 drop-shadow-lg"
                style={{textShadow: '2px 2px 0 #000'}}>
              Equipment
            </h3>
            
            <div className="grid grid-cols-5 grid-rows-6 gap-2 relative">
              {/* Character silhouette background */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-full flex items-center justify-center opacity-20">
                  {user && <PatronAvatar name={user.avatar} size={220} />}
                </div>
              </div>
              
              {/* Equipment slots */}
              {equipmentSlots.map(slot => {
                const equippedItem = equippedItems[slot.id as EquipmentSlot];
                const isSelected = selectedSlot === slot.id;
                
                return (
                  <Droppable key={slot.id} droppableId={`equipment-${slot.id}`}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`${slot.className} flex flex-col items-center`}
                      >
                        <div 
                          className={`equipment-slot w-12 h-12 rounded border-2 
                                    ${equippedItem 
                                      ? 'bg-[#1C0E05] border-[#A05723]' 
                                      : 'bg-[#2C1810] border-[#614119]'}
                                    ${isSelected ? 'ring-2 ring-[#FFD700]' : ''}
                                    ${snapshot.isDraggingOver ? 'border-[#FFD700] ring-2 ring-[#FFD700]' : ''}
                                    flex items-center justify-center cursor-pointer
                                    hover:border-[#9B5523] transition-colors`}
                          onClick={() => !equippedItem && handleSlotSelect(slot.id as EquipmentSlot)}
                          style={equippedItem ? {
                            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.6)'
                          } : {}}
                        >
                          {equippedItem ? (
                            <Draggable 
                              draggableId={`equip-${equippedItem.itemId}`}
                              index={0}
                            >
                              {(provided, snapshot) => (
                                <div 
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`relative group w-10 h-10 flex items-center justify-center
                                            ${snapshot.isDragging ? 'opacity-70' : ''}`}
                                >
                                  <span className={`text-lg ${getRarityColor(equippedItem.item.rarity)}`}>
                                    {equippedItem.item.icon === 'default_item' ? '⚔️' : equippedItem.item.icon}
                                  </span>
                                  
                                  {/* Tooltip */}
                                  <div className="tooltip-content invisible group-hover:visible absolute left-1/2 transform -translate-x-1/2 top-full mt-1 z-30
                                                  bg-[#1C0E05] text-[#E8D6B3] p-2 rounded shadow-lg border border-[#8B4513] text-xs whitespace-nowrap">
                                    <div className={`font-bold ${getRarityColor(equippedItem.item.rarity)}`}>{equippedItem.item.name}</div>
                                    <button 
                                      className="mt-1 px-2 py-1 text-xs bg-[#3A2419] hover:bg-[#4A3429] rounded text-[#E8D6B3]"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUnequip(equippedItem.itemId);
                                      }}
                                    >
                                      Unequip
                                    </button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ) : (
                            <span className="text-[#E8D6B3] text-xs drop-shadow-md">{slot.label}</span>
                          )}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </div>
          </div>
          
          {/* Item List */}
          <div className="item-list rounded-lg p-4 border-2 border-[#8B4513] 
                         shadow-[inset_0_0_10px_rgba(0,0,0,0.6)] flex flex-col"
               style={woodPattern}>
            <h3 className="font-['Press_Start_2P'] text-[#FFD700] text-center text-xl border-b-2 border-[#8B4513] pb-2 drop-shadow-lg"
                style={{textShadow: '2px 2px 0 #000'}}>
              Inventory
            </h3>
            
            <div className="tabs flex border-b-2 border-[#8B4513] mt-2 bg-[#3A2419] bg-opacity-70 rounded-t">
              {Object.keys(groupedInventory).map(type => (
                <button 
                  key={type}
                  className="px-3 py-1 font-['VT323'] text-[#E8D6B3] hover:bg-[#4A3429] capitalize"
                  onClick={() => {}}
                >
                  {type}
                </button>
              ))}
            </div>
            
            <Droppable droppableId="inventory" direction="horizontal">
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps} 
                  className="items-grid grid grid-cols-4 gap-2 mt-3 flex-grow overflow-y-auto p-2 bg-[#1C0E05] bg-opacity-60 rounded"
                >
                  {Object.values(groupedInventory).flat().map((item, index) => (
                    <Draggable 
                      key={item.id}
                      draggableId={`item-${item.itemId}`}
                      index={index}
                      isDragDisabled={!!item.equipped}
                    >
                      {(provided, snapshot) => (
                        <div 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`item-slot relative p-1 rounded border-2
                                    ${selectedItem?.id === item.id 
                                      ? 'bg-[#4A3429] border-[#FFD700]' 
                                      : 'bg-[#2C1810] border-[#614119]'}
                                    ${snapshot.isDragging ? 'border-[#FFD700] opacity-70' : ''}
                                    hover:border-[#9B5523] cursor-pointer transition-colors
                                    flex flex-col items-center justify-center`}
                          onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                          style={{
                            boxShadow: 'inset 0 0 5px rgba(0,0,0,0.4)'
                          }}
                        >
                          <div className="w-10 h-10 flex items-center justify-center">
                            <span className={`text-lg ${getRarityColor(item.item.rarity)}`}>
                              {item.item.icon === 'default_item' ? '⚔️' : item.item.icon}
                            </span>
                          </div>
                          <div className="text-[#E8D6B3] text-xs mt-1 truncate max-w-full px-1">
                            {item.item.name}
                          </div>
                          {item.quantity > 1 && (
                            <div className="absolute top-0 right-0 bg-[#8B4513] text-[#E8D6B3] rounded-bl text-xs px-1">
                              {item.quantity}
                            </div>
                          )}
                          {item.equipped && (
                            <div className="absolute top-0 left-0 bg-[#FFD700] text-[#2C1810] rounded-br text-xs px-1">
                              E
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>
        
        {/* Selected Item Details */}
        {selectedItem && (
          <div className="p-4 bg-[#3A2419] border-t-4 border-[#2C1810] flex justify-between">
            <div className="item-details flex-grow">
              <h4 className={`font-['VT323'] text-lg ${getRarityColor(selectedItem.item.rarity)}`}>
                {selectedItem.item.name}
              </h4>
              <p className="text-[#A9A9A9] text-sm capitalize">
                {selectedItem.item.type} - {selectedItem.item.rarity}
              </p>
              <p className="text-[#E8D6B3] text-sm mt-1">
                {selectedItem.item.description}
              </p>
              
              {/* Display item stats if any */}
              {Object.keys(selectedItem.item.stats as Record<string, any>).length > 0 && (
                <div className="stats-grid grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                  {Object.entries(selectedItem.item.stats as Record<string, any>).map(([stat, value]) => (
                    <div key={stat} className="flex justify-between">
                      <span className="text-[#A9A9A9] text-xs capitalize">{stat}:</span>
                      <span className="text-[#E8D6B3] text-xs">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="item-actions flex flex-col space-y-2 ml-4">
              {/* Action buttons */}
              {selectedItem.item.type !== 'consumable' && !selectedItem.equipped && selectedSlot && (
                <button 
                  className="bg-[#8B4513] text-[#FFD700] px-4 py-1 rounded font-['VT323'] hover:bg-[#9B5523]"
                  onClick={handleEquip}
                >
                  Equip
                </button>
              )}
              
              <button 
                className="bg-[#8B4513] text-[#FFD700] px-4 py-1 rounded font-['VT323'] hover:bg-[#9B5523]"
                onClick={handleSell}
              >
                Sell ({Math.floor(selectedItem.item.value * 0.5)}s)
              </button>
              
              {selectedItem.item.type === 'consumable' && (
                <button 
                  className="bg-[#8B4513] text-[#FFD700] px-4 py-1 rounded font-['VT323'] hover:bg-[#9B5523]"
                >
                  Use
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </DragDropContext>
  );
};

export default InventoryPanel;