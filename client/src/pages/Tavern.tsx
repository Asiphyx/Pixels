import { FC, useEffect } from 'react';
import TavernApp from '@/components/TavernApp';
import { useWebSocketStore } from '@/lib/websocket';

const Tavern: FC = () => {
  const { user } = useWebSocketStore();
  
  // Show character selection on first load
  useEffect(() => {
    if (!user) {
      setTimeout(() => {
        document.getElementById('character-select')?.classList.remove('hidden');
      }, 100);
    }
  }, [user]);
  
  return <TavernApp />;
};

export default Tavern;
