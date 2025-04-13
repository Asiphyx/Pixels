import React, { useState } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { useInventoryStore } from '../../lib/inventory/inventoryStore';
import InventorySlot from './InventorySlot';
import { Item } from '../../lib/inventory/types';

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
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '../ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

interface InventoryPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const InventoryPanel: React.FC<InventoryPanelProps> = ({ isOpen = true, onClose }) => {
  const [activeTab, setActiveTab] = useState('backpack');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showItemDetails, setShowItemDetails] = useState(false);
  
  // Get inventory state and actions from store
  const { 
    inventory, 
    equipment,
    addItem,
    removeItem,
    useItem,
    equipItem,
    unequipItem,
    addGold,
    removeGold,
  } = useInventoryStore();

  // Handle item drag and drop
  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    
    // Dropped outside a droppable area
    if (!destination) return;
    
    // Same position, no change
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;
    
    // Handle drag between inventory and equipment tabs
    if (source.droppableId === 'inventory' && destination.droppableId.startsWith('equipment-')) {
      // Get slot name from destination ID (format: equipment-slotName)
      const slotName = destination.droppableId.split('-')[1] as any;
      
      // Get item ID from source index
      const itemKeys = Object.keys(inventory.items);
      if (itemKeys.length <= source.index) return;
      
      const itemId = itemKeys[source.index];
      const item = inventory.items[itemId];
      
      // Check if item can be equipped in this slot (simplified check)
      if (item.equippable) {
        equipItem(itemId, slotName);
      }
    }
    // Handle drag from equipment to inventory
    else if (source.droppableId.startsWith('equipment-') && destination.droppableId === 'inventory') {
      const slotName = source.droppableId.split('-')[1] as any;
      unequipItem(slotName);
    }
    // Handle inventory reordering (not implemented for simplicity)
  };

  // Handle item click to show details
  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
    setShowItemDetails(true);
  };

  // Handle item use
  const handleUseItem = () => {
    if (selectedItem) {
      useItem(selectedItem.id);
      setShowItemDetails(false);
    }
  };

  // Convert inventory items to array for rendering
  const inventoryItems = Object.values(inventory.items);
  
  // Group items by category for the UI
  const itemsByCategory = inventoryItems.reduce<Record<string, Item[]>>((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  // Handle item drop to ground (remove)
  const handleDropItem = () => {
    if (selectedItem) {
      removeItem(selectedItem.id);
      setShowItemDetails(false);
    }
  };

  if (!isOpen) return null;

  // Stone block pattern for background
  const stonePattern = `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiMyYzE4MTAiLz48cGF0aCBkPSJNMCAwIEwzMCAwIEwzMCAzMCBMMCAzMCBaIiBmaWxsPSIjM2EyNDE5IiBzdHJva2U9IiM0NTJlMWYiIHN0cm9rZS13aWR0aD0iMSIvPjxwYXRoIGQ9Ik0zMCAwIEw2MCAwIEw2MCAzMCBMMzAgMzAgWiIgZmlsbD0iIzJjMTgxMCIgc3Ryb2tlPSIjNDUyZTFmIiBzdHJva2Utd2lkdGg9IjEiLz48cGF0aCBkPSJNMCAzMCBMMzAgMzAgTDMwIDYwIEwwIDYwIFoiIGZpbGw9IiMyYzE4MTAiIHN0cm9rZT0iIzQ1MmUxZiIgc3Ryb2tlLXdpZHRoPSIxIi8+PHBhdGggZD0iTTMwIDMwIEw2MCAzMCBMNjAgNjAgTDMwIDYwIFoiIGZpbGw9IiMzYTI0MTkiIHN0cm9rZT0iIzQ1MmUxZiIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')`;
  
  // Wood grain pattern for header
  const woodPattern = `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMDAgMjAiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAiIGZpbGw9IiM4YjQ1MTMiLz48cGF0aCBkPSJNMCAwIEMyMCAwLCA0MCAxMCwgNjAgNSBDODAgMCwgMTAwIDEwLCAxMjAgMTUgQzE0MCAyMCwgMTYwIDEwLCAxODAgNSBDMjAwIDAsIDIyMCAxMCwgMjQwIDE1IEMyNjAgMjAsIDI4MCAxMCwgMzAwIDUgQzMyMCAwLCAzNDAgMTAsIDM2MCAxNSBDMzgwIDIwLCA0MDAgMTAsIDQyMCA1IEwgNDIwIDIwIEwgMCAyMCBaIiBmaWxsPSIjOGI0NTEzIiBzdHJva2U9IiM3YTM1MDMiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjUiLz48L3N2Zz4=')`;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div 
        className="rounded-lg shadow-2xl w-4/5 max-w-4xl h-4/5 flex flex-col overflow-hidden border-4 border-[#8B4513]"
        style={{ 
          backgroundImage: stonePattern,
          backgroundRepeat: 'repeat',
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.8), inset 0 0 10px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div 
          className="p-4 flex justify-between items-center border-b-4 border-[#8B4513]"
          style={{ 
            backgroundImage: woodPattern,
            backgroundRepeat: 'repeat-x',
            backgroundColor: '#8B4513'
          }}
        >
          <h2 className="text-xl font-bold text-[#FFD700] font-['Press_Start_2P'] tracking-wider">INVENTORY</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-[#3A2419] px-3 py-1 rounded border border-[#8B4513]">
              <span className="text-[#FFD700] mr-1">⚱️</span>
              <span className="text-[#FFD700] font-bold">{inventory.gold} gold</span>
            </div>
            <div className="flex items-center bg-[#3A2419] px-3 py-1 rounded border border-[#8B4513]">
              <span className="text-[#E8D6B3] mr-1">⚖️</span>
              <span className="text-[#E8D6B3]">{inventory.currentWeight}/{inventory.maxWeight} weight</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClose}
              className="bg-[#3A2419] text-[#FFD700] border-2 border-[#8B4513] hover:bg-[#2C1810]"
            >
              Close
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="backpack" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="justify-start px-4 pt-2 bg-[#5A4439] border-b-2 border-[#8B4513]">
            <TabsTrigger 
              value="backpack" 
              onClick={() => setActiveTab('backpack')}
              className="data-[state=active]:bg-[#8B4513] data-[state=active]:text-[#FFD700] data-[state=active]:border-[#4A3429] text-[#E8D6B3] data-[state=active]:font-bold"
            >
              <span className="mr-2">🎒</span>
              Backpack
            </TabsTrigger>
            <TabsTrigger 
              value="equipment" 
              onClick={() => setActiveTab('equipment')}
              className="data-[state=active]:bg-[#8B4513] data-[state=active]:text-[#FFD700] data-[state=active]:border-[#4A3429] text-[#E8D6B3] data-[state=active]:font-bold"
            >
              <span className="mr-2">⚔️</span>
              Equipment
            </TabsTrigger>
            <TabsTrigger 
              value="quests" 
              onClick={() => setActiveTab('quests')}
              className="data-[state=active]:bg-[#8B4513] data-[state=active]:text-[#FFD700] data-[state=active]:border-[#4A3429] text-[#E8D6B3] data-[state=active]:font-bold"
            >
              <span className="mr-2">📜</span>
              Quest Items
            </TabsTrigger>
          </TabsList>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            {/* Backpack Tab */}
            <TabsContent value="backpack" className="flex-1 overflow-auto p-4">
              <Droppable droppableId="inventory" direction="horizontal">
                {(provided) => (
                  <div 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex flex-wrap gap-2"
                  >
                    {inventoryItems.length === 0 ? (
                      <div className="text-[#8B7359] italic w-full text-center p-4 bg-[#2C1810] rounded border border-[#8B4513]">
                        Your inventory is empty.
                      </div>
                    ) : (
                      inventoryItems.map((item, index) => (
                        <InventorySlot 
                          key={item.id}
                          item={item}
                          index={index}
                          slotId={`inventory-${item.id}`}
                          onClick={handleItemClick}
                        />
                      ))
                    )}
                    {provided.placeholder}
                    
                    {/* Empty slots */}
                    {Array.from({ length: Math.max(0, 24 - inventoryItems.length) }).map((_, i) => (
                      <div 
                        key={`empty-${i}`}
                        className="h-16 w-16 border-2 border-dashed border-[#8B4513] rounded bg-[#2C1810]"
                      />
                    ))}
                  </div>
                )}
              </Droppable>
            </TabsContent>
            
            {/* Equipment Tab */}
            <TabsContent value="equipment" className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-3 gap-4 h-full">
                <div className="col-span-2 flex justify-center">
                  <div 
                    className="relative w-64 h-80 border-2 border-[#8B4513] rounded-lg mt-4 bg-[#2C1810]"
                    style={{
                        backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiMzYTI0MTkiIG9wYWNpdHk9IjAuOCIvPjxwYXRoIGQ9Ik0wIDAgTDEwIDAgTDEwIDEwIEwwIDEwIFoiIGZpbGw9IiM0YTM0MjkiIG9wYWNpdHk9IjAuMiIvPjxwYXRoIGQ9Ik0yMCAwIEwzMCAwIEwzMCAxMCBMMjAgMTAgWiIgZmlsbD0iIzRhMzQyOSIgb3BhY2l0eT0iMC4yIi8+PHBhdGggZD0iTTEwIDEwIEwyMCAxMCBMMjAgMjAgTDEwIDIwIFoiIGZpbGw9IiM0YTM0MjkiIG9wYWNpdHk9IjAuMiIvPjxwYXRoIGQ9Ik0zMCAxMCBMNDAgMTAgTDQwIDIwIEwzMCAyMCBaIiBmaWxsPSIjNGEzNDI5IiBvcGFjaXR5PSIwLjIiLz48cGF0aCBkPSJNMCAyMCBMMTAgMjAgTDEwIDMwIEwwIDMwIFoiIGZpbGw9IiM0YTM0MjkiIG9wYWNpdHk9IjAuMiIvPjxwYXRoIGQ9Ik0yMCAyMCBMMzAgMjAgTDMwIDMwIEwyMCAzMCBaIiBmaWxsPSIjNGEzNDI5IiBvcGFjaXR5PSIwLjIiLz48cGF0aCBkPSJNMTAgMzAgTDIwIDMwIEwyMCA0MCBMMTAgNDAgWiIgZmlsbD0iIzRhMzQyOSIgb3BhY2l0eT0iMC4yIi8+PHBhdGggZD0iTTMwIDMwIEw0MCAzMCBMNDAgNDAgTDMwIDQwIFoiIGZpbGw9IiM0YTM0MjkiIG9wYWNpdHk9IjAuMiIvPjwvc3ZnPg==')",
                        backgroundRepeat: "repeat",
                    }}
                  >
                    {/* Character silhouette */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                      <svg className="w-52 h-52" viewBox="0 0 24 24" fill="#E8D6B3">
                        <path d="M12 2C9.79 2 8 3.79 8 6s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 12c-4.41 0-8 3.59-8 8h16c0-4.41-3.59-8-8-8z" />
                      </svg>
                    </div>
                    
                    {/* Equipment slots */}
                    <Droppable droppableId="equipment-head">
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="absolute left-1/2 top-2 transform -translate-x-1/2"
                        >
                          <InventorySlot
                            item={equipment.slots.head}
                            index={0}
                            slotId={`equipment-head-slot`}
                            onClick={handleItemClick}
                          />
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                    
                    <Droppable droppableId="equipment-chest">
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="absolute left-1/2 top-24 transform -translate-x-1/2"
                        >
                          <InventorySlot
                            item={equipment.slots.chest}
                            index={0}
                            slotId={`equipment-chest-slot`}
                            onClick={handleItemClick}
                          />
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                    
                    <div className="flex justify-between absolute left-1/2 top-40 transform -translate-x-1/2 w-40">
                      <Droppable droppableId="equipment-mainHand">
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                          >
                            <InventorySlot
                              item={equipment.slots.mainHand}
                              index={0}
                              slotId={`equipment-mainHand-slot`}
                              onClick={handleItemClick}
                            />
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                      
                      <Droppable droppableId="equipment-offHand">
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                          >
                            <InventorySlot
                              item={equipment.slots.offHand}
                              index={0}
                              slotId={`equipment-offHand-slot`}
                              onClick={handleItemClick}
                            />
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                    
                    <Droppable droppableId="equipment-feet">
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="absolute left-1/2 bottom-2 transform -translate-x-1/2"
                        >
                          <InventorySlot
                            item={equipment.slots.feet}
                            index={0}
                            slotId={`equipment-feet-slot`}
                            onClick={handleItemClick}
                          />
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                </div>
                
                <div className="border-l border-[#8B4513] pl-4">
                  <h3 className="font-bold text-[#FFD700] mb-2">Accessories</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-[#E8D6B3] mb-1">Neck</p>
                      <Droppable droppableId="equipment-neck">
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                          >
                            <InventorySlot
                              item={equipment.slots.neck}
                              index={0}
                              slotId={`equipment-neck-slot`}
                              onClick={handleItemClick}
                            />
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                    
                    <div>
                      <p className="text-xs text-[#E8D6B3] mb-1">Hands</p>
                      <Droppable droppableId="equipment-hands">
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                          >
                            <InventorySlot
                              item={equipment.slots.hands}
                              index={0}
                              slotId={`equipment-hands-slot`}
                              onClick={handleItemClick}
                            />
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                    
                    <div>
                      <p className="text-xs text-[#E8D6B3] mb-1">Waist</p>
                      <Droppable droppableId="equipment-waist">
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                          >
                            <InventorySlot
                              item={equipment.slots.waist}
                              index={0}
                              slotId={`equipment-waist-slot`}
                              onClick={handleItemClick}
                            />
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                    
                    <div>
                      <p className="text-xs text-[#E8D6B3] mb-1">Legs</p>
                      <Droppable droppableId="equipment-legs">
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                          >
                            <InventorySlot
                              item={equipment.slots.legs}
                              index={0}
                              slotId={`equipment-legs-slot`}
                              onClick={handleItemClick}
                            />
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                    
                    <div>
                      <p className="text-xs text-[#E8D6B3] mb-1">Ring 1</p>
                      <Droppable droppableId="equipment-ring1">
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                          >
                            <InventorySlot
                              item={equipment.slots.ring1}
                              index={0}
                              slotId={`equipment-ring1-slot`}
                              onClick={handleItemClick}
                            />
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                    
                    <div>
                      <p className="text-xs text-[#E8D6B3] mb-1">Ring 2</p>
                      <Droppable droppableId="equipment-ring2">
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                          >
                            <InventorySlot
                              item={equipment.slots.ring2}
                              index={0}
                              slotId={`equipment-ring2-slot`}
                              onClick={handleItemClick}
                            />
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                    
                    <div>
                      <p className="text-xs text-[#E8D6B3] mb-1">Trinket 1</p>
                      <Droppable droppableId="equipment-trinket1">
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                          >
                            <InventorySlot
                              item={equipment.slots.trinket1}
                              index={0}
                              slotId={`equipment-trinket1-slot`}
                              onClick={handleItemClick}
                            />
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                    
                    <div>
                      <p className="text-xs text-[#E8D6B3] mb-1">Trinket 2</p>
                      <Droppable droppableId="equipment-trinket2">
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                          >
                            <InventorySlot
                              item={equipment.slots.trinket2}
                              index={0}
                              slotId={`equipment-trinket2-slot`}
                              onClick={handleItemClick}
                            />
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Quest Items Tab */}
            <TabsContent value="quests" className="flex-1 overflow-auto p-4">
              <Droppable droppableId="quest-items" direction="horizontal">
                {(provided) => (
                  <div 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex flex-wrap gap-2"
                  >
                    {inventoryItems.filter(i => i.category === 'quest').length === 0 ? (
                      <div className="text-[#8B7359] italic w-full text-center p-4 bg-[#2C1810] rounded border border-[#8B4513]">
                        You don't have any quest items.
                      </div>
                    ) : (
                      inventoryItems
                        .filter(i => i.category === 'quest')
                        .map((item, index) => (
                          <InventorySlot 
                            key={item.id}
                            item={item}
                            index={index}
                            slotId={`quest-${item.id}`}
                            onClick={handleItemClick}
                          />
                        ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </TabsContent>
          </DragDropContext>
        </Tabs>
        
        {/* Item details dialog */}
        <Dialog open={showItemDetails} onOpenChange={setShowItemDetails}>
          <DialogContent className="border-4 border-[#8B4513] bg-[#2C1810] text-[#E8D6B3]" style={{
            backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiMzYTI0MTkiIG9wYWNpdHk9IjAuOCIvPjxwYXRoIGQ9Ik0wIDAgTDEwIDAgTDEwIDEwIEwwIDEwIFoiIGZpbGw9IiM0YTM0MjkiIG9wYWNpdHk9IjAuMiIvPjxwYXRoIGQ9Ik0yMCAwIEwzMCAwIEwzMCAxMCBMMjAgMTAgWiIgZmlsbD0iIzRhMzQyOSIgb3BhY2l0eT0iMC4yIi8+PHBhdGggZD0iTTEwIDEwIEwyMCAxMCBMMjAgMjAgTDEwIDIwIFoiIGZpbGw9IiM0YTM0MjkiIG9wYWNpdHk9IjAuMiIvPjxwYXRoIGQ9Ik0zMCAxMCBMNDAgMTAgTDQwIDIwIEwzMCAyMCBaIiBmaWxsPSIjNGEzNDI5IiBvcGFjaXR5PSIwLjIiLz48cGF0aCBkPSJNMCAyMCBMMTAgMjAgTDEwIDMwIEwwIDMwIFoiIGZpbGw9IiM0YTM0MjkiIG9wYWNpdHk9IjAuMiIvPjxwYXRoIGQ9Ik0yMCAyMCBMMzAgMjAgTDMwIDMwIEwyMCAzMCBaIiBmaWxsPSIjNGEzNDI5IiBvcGFjaXR5PSIwLjIiLz48cGF0aCBkPSJNMTAgMzAgTDIwIDMwIEwyMCA0MCBMMTAgNDAgWiIgZmlsbD0iIzRhMzQyOSIgb3BhY2l0eT0iMC4yIi8+PHBhdGggZD0iTTMwIDMwIEw0MCAzMCBMNDAgNDAgTDMwIDQwIFoiIGZpbGw9IiM0YTM0MjkiIG9wYWNpdHk9IjAuMiIvPjwvc3ZnPg==')",
            backgroundRepeat: "repeat",
          }}>
            {selectedItem && (
              <>
                <DialogHeader className="bg-[#3A2419] p-3 rounded border border-[#8B4513] shadow-inner">
                  <DialogTitle className="flex items-center text-[#FFD700]">
                    <span className="mr-2 text-2xl">
                      {selectedItem.icon.startsWith('http') 
                        ? <img src={selectedItem.icon} alt={selectedItem.name} className="h-6 w-6 object-contain" /> 
                        : categoryIcons[selectedItem.category as keyof typeof categoryIcons]}
                    </span>
                    {selectedItem.name}
                  </DialogTitle>
                  <DialogDescription className="text-[#E8D6B3]">
                    <span className="capitalize">{selectedItem.rarity} {selectedItem.category}</span>
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="bg-[#3A2419] p-3 rounded border border-[#8B4513] mb-4">
                    <p className="text-sm text-[#E8D6B3]">{selectedItem.description}</p>
                  </div>
                  
                  {selectedItem.effects && selectedItem.effects.length > 0 && (
                    <>
                      <Separator className="my-2 bg-[#8B4513]" />
                      <h4 className="font-semibold text-sm mb-1 text-[#FFD700]">Effects:</h4>
                      <ul className="text-sm pl-5 list-disc space-y-1 text-[#E8D6B3]">
                        {selectedItem.effects.map((effect, idx) => (
                          <li key={idx}>{effect.description}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  
                  <Separator className="my-2 bg-[#8B4513]" />
                  <div className="grid grid-cols-2 text-sm bg-[#3A2419] p-3 rounded border border-[#8B4513]">
                    <div>
                      <p className="mb-1"><span className="font-medium text-[#FFD700]">Value:</span> <span className="text-[#FFD700]">{selectedItem.value} gold</span></p>
                      <p><span className="font-medium text-[#E8D6B3]">Weight:</span> <span className="text-[#E8D6B3]">{selectedItem.weight} units</span></p>
                    </div>
                    <div>
                      <p className="mb-1"><span className="font-medium text-[#E8D6B3]">Stackable:</span> <span className="text-[#E8D6B3]">{selectedItem.stackable ? 'Yes' : 'No'}</span></p>
                      {selectedItem.stackable && selectedItem.quantity && (
                        <p className="mb-1"><span className="font-medium text-[#E8D6B3]">Quantity:</span> <span className="text-[#E8D6B3]">{selectedItem.quantity}</span></p>
                      )}
                      <p className="mb-1"><span className="font-medium text-[#E8D6B3]">Usable:</span> <span className="text-[#E8D6B3]">{selectedItem.usable ? 'Yes' : 'No'}</span></p>
                      <p><span className="font-medium text-[#E8D6B3]">Equippable:</span> <span className="text-[#E8D6B3]">{selectedItem.equippable ? 'Yes' : 'No'}</span></p>
                    </div>
                  </div>
                </div>
                <DialogFooter className="flex justify-between">
                  <Button 
                    variant="destructive" 
                    onClick={handleDropItem}
                    className="bg-[#8B0000] hover:bg-[#A00000] border border-[#8B4513]"
                  >
                    Drop
                  </Button>
                  <div className="space-x-2">
                    {selectedItem.usable && (
                      <Button 
                        onClick={handleUseItem}
                        className="bg-[#8B4513] hover:bg-[#9B5523] text-[#FFD700] border-none"
                      >
                        Use
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      onClick={() => setShowItemDetails(false)}
                      className="border-[#8B4513] text-[#E8D6B3] hover:bg-[#3A2419] hover:text-[#FFD700]"
                    >
                      Close
                    </Button>
                  </div>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default InventoryPanel;