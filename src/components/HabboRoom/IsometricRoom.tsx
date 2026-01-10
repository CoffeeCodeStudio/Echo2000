import React from 'react';

interface IsometricRoomProps {
  children: React.ReactNode;
}

export const IsometricRoom: React.FC<IsometricRoomProps> = ({ children }) => {
  return (
    <div className="isometric-room-container">
      <svg 
        viewBox="0 0 400 300" 
        className="w-full h-full max-w-[600px] max-h-[450px]"
        style={{ imageRendering: 'pixelated' }}
      >
        {/* Back wall - left side */}
        <polygon 
          points="50,50 200,120 200,220 50,150" 
          fill="#5588bb"
          stroke="#4477aa"
          strokeWidth="2"
        />
        {/* Wall pattern - left */}
        <line x1="80" y1="60" x2="80" y2="140" stroke="#6699cc" strokeWidth="1" />
        <line x1="110" y1="70" x2="110" y2="155" stroke="#6699cc" strokeWidth="1" />
        <line x1="140" y1="82" x2="140" y2="170" stroke="#6699cc" strokeWidth="1" />
        <line x1="170" y1="95" x2="170" y2="185" stroke="#6699cc" strokeWidth="1" />
        
        {/* Back wall - right side */}
        <polygon 
          points="200,120 350,50 350,150 200,220" 
          fill="#4477aa"
          stroke="#3366aa"
          strokeWidth="2"
        />
        {/* Wall pattern - right */}
        <line x1="230" y1="105" x2="230" y2="195" stroke="#5588bb" strokeWidth="1" />
        <line x1="260" y1="92" x2="260" y2="180" stroke="#5588bb" strokeWidth="1" />
        <line x1="290" y1="78" x2="290" y2="165" stroke="#5588bb" strokeWidth="1" />
        <line x1="320" y1="64" x2="320" y2="152" stroke="#5588bb" strokeWidth="1" />
        
        {/* Window on left wall */}
        <rect x="100" y="80" width="40" height="50" fill="#87ceeb" stroke="#334455" strokeWidth="2" />
        <line x1="120" y1="80" x2="120" y2="130" stroke="#334455" strokeWidth="2" />
        <line x1="100" y1="105" x2="140" y2="105" stroke="#334455" strokeWidth="2" />
        
        {/* Floor - isometric wooden planks */}
        <polygon 
          points="50,150 200,220 350,150 200,280" 
          fill="#8b6914"
          stroke="#6b4904"
          strokeWidth="2"
        />
        
        {/* Floor wood grain pattern */}
        <line x1="80" y1="160" x2="200" y2="230" stroke="#7a5a12" strokeWidth="1" />
        <line x1="110" y1="155" x2="200" y2="210" stroke="#7a5a12" strokeWidth="1" />
        <line x1="140" y1="152" x2="200" y2="190" stroke="#7a5a12" strokeWidth="1" />
        <line x1="170" y1="150" x2="200" y2="170" stroke="#7a5a12" strokeWidth="1" />
        
        <line x1="230" y1="165" x2="200" y2="230" stroke="#9a7924" strokeWidth="1" />
        <line x1="260" y1="158" x2="200" y2="215" stroke="#9a7924" strokeWidth="1" />
        <line x1="290" y1="153" x2="200" y2="195" stroke="#9a7924" strokeWidth="1" />
        <line x1="320" y1="151" x2="200" y2="175" stroke="#9a7924" strokeWidth="1" />
        
        {/* Floor shadow/depth lines */}
        <line x1="200" y1="220" x2="200" y2="280" stroke="#5a4004" strokeWidth="2" />
        
        {/* Pixel plant in corner */}
        <rect x="70" y="125" width="16" height="20" fill="#8b4513" />
        <rect x="74" y="105" width="8" height="22" fill="#228b22" />
        <rect x="68" y="108" width="6" height="12" fill="#2e8b2e" />
        <rect x="82" y="110" width="6" height="10" fill="#32cd32" />
        
        {/* Small rug in center */}
        <ellipse cx="200" cy="240" rx="40" ry="15" fill="#8b2252" opacity="0.8" />
        <ellipse cx="200" cy="240" rx="30" ry="10" fill="#cd5c5c" opacity="0.9" />
      </svg>
      
      {/* Avatar and UI overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto relative" style={{ marginTop: '60px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};
