import React from 'react';
import { Shard } from '../types';

interface BearProps {
  emotion: 'happy' | 'nervous' | 'cracked' | 'shattered' | 'healed';
  scale?: number;
  highlightShardId?: number | null;
  shards?: Shard[]; 
  fixedPartIds?: number[]; // IDs of parts that have been repaired
}

export const Bear: React.FC<BearProps> = ({ 
  emotion, 
  scale = 1, 
  highlightShardId, 
  shards,
  fixedPartIds = []
}) => {
  const isCracked = emotion === 'cracked';
  const isHealed = emotion === 'healed';
  const isRepairing = emotion === 'shattered'; // During repair phase

  // Helper to determine if a part should be drawn fully (repaired) or as a ghost (guide)
  const shouldShowPart = (id: number) => {
    // If we are not repairing (normal state), show everything
    if (!isRepairing && !isHealed) return true;
    // If healed, show everything
    if (isHealed) return true;
    // During repair, only show if fixed
    return fixedPartIds.includes(id);
  };

  const isGhost = (id: number) => {
    return isRepairing && !fixedPartIds.includes(id);
  };

  const getStyle = (id: number) => {
    if (isGhost(id)) {
        return { 
            fill: 'rgba(255, 255, 255, 0.05)', 
            stroke: highlightShardId === id ? '#FFD700' : 'rgba(255, 255, 255, 0.1)',
            strokeWidth: highlightShardId === id ? 2 : 1,
            strokeDasharray: '4 4'
        };
    }
    // Healed bear is slightly lighter/cleaner
    return { fill: isHealed ? '#E8B486' : '#D99F70', stroke: 'none' };
  };

  return (
    <svg 
      width={200 * scale} 
      height={240 * scale} 
      viewBox="0 0 200 240" 
      className={`transition-all duration-1000 ${emotion === 'nervous' ? 'animate-pulse' : ''}`}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <g transform="translate(100, 120)">
        
        {/* --- Body Parts (Mapped to IDs in constants.ts) --- */}

        {/* ID 1: Left Ear (-60, -70) */}
        {(shouldShowPart(1) || isGhost(1)) && (
            <circle cx="-60" cy="-70" r="25" {...getStyle(1)} />
        )}

        {/* ID 2: Right Ear (60, -70) */}
        {(shouldShowPart(2) || isGhost(2)) && (
            <circle cx="60" cy="-70" r="25" {...getStyle(2)} />
        )}

        {/* ID 4: Body (Torso) */}
        {(shouldShowPart(4) || isGhost(4)) && (
             <path d="M-50 40 Q-60 100 -30 110 L30 110 Q60 100 50 40 Z" {...getStyle(4)} />
        )}

        {/* ID 5: Left Hand (-60, 30) approximated */}
        {(shouldShowPart(5) || isGhost(5)) && (
             <ellipse cx="-50" cy="40" rx="15" ry="15" transform={isHealed ? "rotate(-30 -50 40) translate(0, -5)" : "rotate(-20 -50 40)"} {...getStyle(5)} />
        )}

        {/* ID 6: Right Hand (60, 30) approximated */}
        {(shouldShowPart(6) || isGhost(6)) && (
             <ellipse cx="50" cy="40" rx="15" ry="15" transform={isHealed ? "rotate(30 50 40) translate(0, -5)" : "rotate(20 50 40)"} {...getStyle(6)} />
        )}

        {/* ID 3: Face/Head (0, -20) - Draw last to be on top */}
        {(shouldShowPart(3) || isGhost(3)) && (
            <g>
                <circle cx="0" cy="-20" r="70" {...getStyle(3)} />
                {/* Details only show when head is fully fixed */}
                {shouldShowPart(3) && (
                    <>
                        <circle cx="0" cy="-20" r="70" fill={isHealed ? '#F5D0A9' : '#E8B486'} /> {/* Face mask area */}
                        <ellipse cx="0" cy="-10" rx="25" ry="18" fill="#FFF8E7" opacity="0.8" />
                        <ellipse cx="0" cy="-16" rx="10" ry="6" fill="#4A3426" />
                        
                        {/* Eyes */}
                        {emotion === 'happy' || isHealed ? (
                        <>
                            {/* Healed eyes are happy arcs or big shiny eyes */}
                            {isHealed ? (
                                <>
                                    <path d="M-35 -30 Q-25 -40 -15 -30" stroke="#4A3426" strokeWidth="4" strokeLinecap="round" fill="none" />
                                    <path d="M15 -30 Q25 -40 35 -30" stroke="#4A3426" strokeWidth="4" strokeLinecap="round" fill="none" />
                                </>
                            ) : (
                                <>
                                    <circle cx="-25" cy="-30" r="6" fill="#4A3426" />
                                    <circle cx="25" cy="-30" r="6" fill="#4A3426" />
                                </>
                            )}
                        </>
                        ) : (
                        <>
                            <path d="M-30 -30 L-20 -30" stroke="#4A3426" strokeWidth="3" strokeLinecap="round" />
                            <path d="M20 -30 L30 -30" stroke="#4A3426" strokeWidth="3" strokeLinecap="round" />
                        </>
                        )}

                        {/* Mouth */}
                        {emotion === 'happy' || isHealed ? (
                            <path d="M-10 0 Q0 10 10 0" stroke="#4A3426" strokeWidth="3" fill="none" />
                        ) : (
                            <path d="M-5 5 Q0 0 5 5" stroke="#4A3426" strokeWidth="2" fill="none" />
                        )}

                        {/* Blush */}
                        <circle cx="-40" cy="-10" r="8" fill="#FF7F7F" opacity="0.4" />
                        <circle cx="40" cy="-10" r="8" fill="#FF7F7F" opacity="0.4" />
                    </>
                )}
            </g>
        )}

        {/* Cracks Overlay (Intro) */}
        {isCracked && (
            <g stroke="#5c4033" strokeWidth="2" fill="none" opacity="0.7">
                <path d="M0 -80 L-10 -40 L5 -20" />
                <path d="M40 -50 L20 -20" />
                <path d="M-50 50 L-20 70" />
            </g>
        )}

        {/* Kintsugi Gold Repair Overlay (Ending) */}
        {isHealed && (
            <g stroke="#FCD34D" strokeWidth="3" fill="none" className="kintsugi-line filter drop-shadow-md">
                <path d="M-60 -70 L-30 -40" strokeLinecap="round" /> {/* Ear to face */}
                <path d="M60 -70 L30 -40" strokeLinecap="round" />
                <path d="M-50 40 L-20 0" strokeLinecap="round" /> {/* Body connections */}
                <path d="M50 40 L20 0" strokeLinecap="round" />
                
                {/* Extra decorative sparkles on the bear itself */}
                <circle cx="-45" cy="-55" r="2" fill="white" className="animate-ping" style={{animationDuration: '3s'}} />
                <circle cx="45" cy="20" r="2" fill="white" className="animate-ping" style={{animationDuration: '2.5s', animationDelay: '1s'}} />
            </g>
        )}
      </g>
    </svg>
  );
};