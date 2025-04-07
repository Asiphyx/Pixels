import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import fonts
const preloadFonts = () => {
  const link1 = document.createElement('link');
  link1.rel = 'preconnect';
  link1.href = 'https://fonts.googleapis.com';
  document.head.appendChild(link1);
  
  const link2 = document.createElement('link');
  link2.rel = 'preconnect';
  link2.href = 'https://fonts.gstatic.com';
  link2.crossOrigin = '';
  document.head.appendChild(link2);
  
  const link3 = document.createElement('link');
  link3.rel = 'stylesheet';
  link3.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap';
  document.head.appendChild(link3);
  
  // Add title
  const title = document.createElement('title');
  title.textContent = 'Pixel Tavern';
  document.head.appendChild(title);
};

preloadFonts();

// Add CSS variables for the color palette
const addColorStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --wood-brown: #4A3429;
      --rustic-brown: #8B4513;
      --tavern-gold: #FFD700;
      --dark-wood: #2C1810;
      --parchment: #E8D6B3;
      --tavern-red: #8B0000;
    }
    
    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-5px); }
      100% { transform: translateY(0px); }
    }
    
    .float {
      animation: float 3s ease-in-out infinite;
    }
    
    /* Customized scrollbar */
    ::-webkit-scrollbar {
      width: 12px;
    }
    
    ::-webkit-scrollbar-track {
      background: #2C1810;
    }
    
    ::-webkit-scrollbar-thumb {
      background: #8B4513;
      border: 2px solid #2C1810;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: #9B5523;
    }
    
    /* Pixel style */
    .pixel-border {
      box-shadow: 
        0 -4px 0 0px #2C1810,
        0 4px 0 0px #2C1810,
        -4px 0 0 0px #2C1810,
        4px 0 0 0px #2C1810,
        0 0 0 4px #8B4513;
    }
    
    /* Animations */
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    
    .animate-pulse {
      animation: pulse 2s infinite;
    }
    
    /* For crisp pixel art */
    img, svg {
      image-rendering: pixelated;
    }
    
    .bartender-sprite {
      image-rendering: pixelated;
      width: 100px;
      height: 200px;
    }
  `;
  document.head.appendChild(style);
};

addColorStyles();

createRoot(document.getElementById("root")!).render(<App />);
