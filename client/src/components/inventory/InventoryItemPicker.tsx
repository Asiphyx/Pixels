import React from 'react';
import { useInventoryStore } from '../../lib/inventory/inventoryStore';
import { getAvailableItems } from '../../lib/inventory/sampleItems';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../ui/card';
import { Badge } from '../ui/badge';

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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <span className="mr-1">✨</span> Get Items
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <h3 className="font-medium">Add Items to Inventory</h3>
          
          <div className="flex space-x-2 mb-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => addGold(10)}
            >
              Add 10 Gold
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => addGold(100)}
            >
              Add 100 Gold
            </Button>
          </div>

          <Tabs defaultValue={categories[0]}>
            <TabsList className="w-full">
              {categories.map(category => (
                <TabsTrigger key={category} value={category} className="text-xs capitalize">
                  {categoryEmojis[category]} {category}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {categories.map(category => (
              <TabsContent key={category} value={category} className="max-h-60 overflow-y-auto">
                <div className="grid gap-2">
                  {itemsByCategory[category].map(item => (
                    <Card key={item.id} className="overflow-hidden">
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm flex items-center">
                          <span className="mr-2 text-lg">{categoryEmojis[item.category]}</span>
                          {item.name} 
                          <Badge 
                            variant="outline" 
                            className="ml-2 capitalize"
                            style={{
                              color: 
                                item.rarity === 'common' ? 'gray' :
                                item.rarity === 'uncommon' ? 'green' :
                                item.rarity === 'rare' ? 'blue' :
                                item.rarity === 'epic' ? 'purple' :
                                'goldenrod',
                            }}
                          >
                            {item.rarity}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-xs">{item.description}</CardDescription>
                      </CardHeader>
                      <CardFooter className="p-3 pt-0 flex justify-between">
                        <div className="text-xs">{item.value} gold • {item.weight} wt</div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => addItem(item)}
                        >
                          Add
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default InventoryItemPicker;