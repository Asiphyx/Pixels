import React, { useState } from 'react';
import { Button } from '../ui/button';
import InventoryPanel from './InventoryPanel';

interface InventoryButtonProps {
  className?: string;
}

const InventoryButton: React.FC<InventoryButtonProps> = ({ className }) => {
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  const toggleInventory = () => {
    setIsInventoryOpen(!isInventoryOpen);
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        className={`flex items-center ${className}`}
        onClick={toggleInventory}
      >
        <span className="mr-1">📦</span> Inventory
      </Button>
      
      {isInventoryOpen && (
        <InventoryPanel
          isOpen={isInventoryOpen}
          onClose={() => setIsInventoryOpen(false)}
        />
      )}
    </>
  );
};

export default InventoryButton;