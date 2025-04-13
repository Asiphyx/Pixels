import { FC, useEffect, useState } from 'react';
import TavernApp from '@/components/TavernApp';
import { useWebSocketStore } from '@/lib/websocket';

const Tavern: FC = () => {
  const { user, connect } = useWebSocketStore();
  const [loading, setLoading] = useState(true);
  
  // Initial data loading
  useEffect(() => {
    // Fetch rooms data on component mount
    const fetchRooms = async () => {
      try {
        const response = await fetch('/api/rooms');
        if (response.ok) {
          const rooms = await response.json();
          console.log("Fetched rooms:", rooms);
          // If needed, you can store these rooms in local state or global store
        } else {
          console.error("Failed to fetch rooms:", response.status);
        }
      } catch (error) {
        console.error("Error fetching rooms:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRooms();
    
    // Show character selection on first load if user is not logged in
    if (!user) {
      setTimeout(() => {
        const elem = document.getElementById('character-select');
        if (elem) {
          elem.classList.remove('hidden');
          console.log("Showing character selection");
        } else {
          console.warn("Character selection element not found");
        }
      }, 300);
    }
  }, []);
  
  // Effect for updating user status
  useEffect(() => {
    if (user) {
      console.log("User is logged in:", user);
    } else {
      console.log("No user is logged in, showing character selection");
    }
  }, [user]);
  
  return <TavernApp loading={loading} />;
};

export default Tavern;
