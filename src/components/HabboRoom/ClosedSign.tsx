import React from 'react';

interface ClosedSignProps {
  nextOpenTime: string;
}

export const ClosedSign: React.FC<ClosedSignProps> = ({ nextOpenTime }) => {
  return (
    <div className="closed-sign-overlay">
      <div className="closed-sign">
        {/* Pixelated border frame */}
        <div className="closed-sign-frame">
          {/* Sign content */}
          <div className="closed-sign-content">
            <div className="closed-sign-icon">
              {/* Pixel lock icon */}
              <svg 
                width="32" 
                height="32" 
                viewBox="0 0 16 16" 
                style={{ imageRendering: 'pixelated' }}
              >
                <rect x="4" y="6" width="8" height="8" fill="#8b6914" />
                <rect x="5" y="7" width="6" height="6" fill="#a67c00" />
                <rect x="5" y="2" width="1" height="5" fill="#666666" />
                <rect x="10" y="2" width="1" height="5" fill="#666666" />
                <rect x="5" y="2" width="6" height="1" fill="#666666" />
                <rect x="7" y="9" width="2" height="2" fill="#2a2a2a" />
              </svg>
            </div>
            <h2 className="closed-sign-title">STÄNGT</h2>
            <p className="closed-sign-text">
              Öppnar på söndag kl 18:00
            </p>
            <p className="closed-sign-subtext">
              {nextOpenTime}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
