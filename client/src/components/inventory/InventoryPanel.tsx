import React, { useState } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { useInventoryStore } from '../../lib/inventory/inventoryStore';
import InventorySlot from './InventorySlot';
import { Item } from '../../lib/inventory/types';
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

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg w-4/5 max-w-4xl h-4/5 flex flex-col overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="text-xl font-bold">Inventory</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="text-yellow-500 mr-1">⚱️</span>
              <span>{inventory.gold} gold</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-500 mr-1">⚖️</span>
              <span>{inventory.currentWeight}/{inventory.maxWeight} weight</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="backpack" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="justify-start px-4 pt-2">
            <TabsTrigger 
              value="backpack" 
              onClick={() => setActiveTab('backpack')}
            >
              Backpack
            </TabsTrigger>
            <TabsTrigger 
              value="equipment" 
              onClick={() => setActiveTab('equipment')}
            >
              Equipment
            </TabsTrigger>
            <TabsTrigger 
              value="quests" 
              onClick={() => setActiveTab('quests')}
            >
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
                      <div className="text-gray-500 italic w-full text-center p-4">
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
                        className="h-16 w-16 border-2 border-dashed border-gray-300 rounded"
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
                  <div className="relative w-64 h-80 border-2 border-gray-300 rounded-lg mt-4">
                    {/* Character silhouette */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                      <svg className="w-52 h-52" viewBox="0 0 24 24" fill="currentColor">
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
                
                <div className="border-l pl-4">
                  <h3 className="font-medium mb-2">Accessories</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Neck</p>
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
                      <p className="text-xs text-gray-500 mb-1">Hands</p>
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
                      <p className="text-xs text-gray-500 mb-1">Waist</p>
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
                      <p className="text-xs text-gray-500 mb-1">Legs</p>
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
                      <p className="text-xs text-gray-500 mb-1">Ring 1</p>
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
                      <p className="text-xs text-gray-500 mb-1">Ring 2</p>
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
                      <p className="text-xs text-gray-500 mb-1">Trinket 1</p>
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
                      <p className="text-xs text-gray-500 mb-1">Trinket 2</p>
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
                      <div className="text-gray-500 italic w-full text-center p-4">
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
          <DialogContent>
            {selectedItem && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <span className="mr-2">
                      {selectedItem.icon.startsWith('http') 
                        ? <img src={selectedItem.icon} alt={selectedItem.name} className="h-6 w-6 object-contain" /> 
                        : categoryIcons[selectedItem.category as keyof typeof categoryIcons]}
                    </span>
                    {selectedItem.name}
                  </DialogTitle>
                  <DialogDescription>
                    <span className="capitalize">{selectedItem.rarity} {selectedItem.category}</span>
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm mb-4">{selectedItem.description}</p>
                  
                  {selectedItem.effects && selectedItem.effects.length > 0 && (
                    <>
                      <Separator className="my-2" />
                      <h4 className="font-semibold text-sm mb-1">Effects:</h4>
                      <ul className="text-sm pl-5 list-disc space-y-1">
                        {selectedItem.effects.map((effect, idx) => (
                          <li key={idx}>{effect.description}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  
                  <Separator className="my-2" />
                  <div className="grid grid-cols-2 text-sm">
                    <div>
                      <p><span className="font-medium">Value:</span> {selectedItem.value} gold</p>
                      <p><span className="font-medium">Weight:</span> {selectedItem.weight} units</p>
                    </div>
                    <div>
                      <p><span className="font-medium">Stackable:</span> {selectedItem.stackable ? 'Yes' : 'No'}</p>
                      {selectedItem.stackable && selectedItem.quantity && (
                        <p><span className="font-medium">Quantity:</span> {selectedItem.quantity}</p>
                      )}
                      <p><span className="font-medium">Usable:</span> {selectedItem.usable ? 'Yes' : 'No'}</p>
                      <p><span className="font-medium">Equippable:</span> {selectedItem.equippable ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
                <DialogFooter className="flex justify-between">
                  <Button variant="destructive" onClick={handleDropItem}>
                    Drop
                  </Button>
                  <div className="space-x-2">
                    {selectedItem.usable && (
                      <Button onClick={handleUseItem}>
                        Use
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setShowItemDetails(false)}>
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