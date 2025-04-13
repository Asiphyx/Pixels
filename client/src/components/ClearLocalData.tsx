import { FC, useEffect } from 'react';

const ClearLocalData: FC = () => {
  useEffect(() => {
    // Clear all localStorage data related to the tavern
    const keysToRemove = [
      'tavern_username',
      'tavern_selected_avatar',
      'tavern_auto_connect',
      'tavern_auto_login'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log("Local storage data cleared");
  }, []);
  
  return null; // This component doesn't render anything
};

export default ClearLocalData;