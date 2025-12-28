import React, { useState, useEffect, useRef } from 'react';
import { GameState, DialogueNode, Shard, Point, Firefly } from './types';
import { STORY_TEXTS, BEAR_SHARDS_DATA, INTERACTIVE_MESSAGES } from './constants';
import { Bear } from './components/Bear';
import { Button } from './components/Button';
import { Sparkles, RefreshCcw, Heart, Sun } from 'lucide-react';

// --- Helper Components ---

const TypewriterText: React.FC<{ text: string; speed?: number; onComplete?: () => void }> = ({ 
  text, 
  speed = 40,
  onComplete 
}) => {
  const [displayed, setDisplayed] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  
  useEffect(() => {
    setDisplayed('');
    setIsComplete(false);
    let i = 0;
    
    if (intervalRef.current) window.clearInterval(intervalRef.current);

    intervalRef.current = window.setInterval(() => {
      if (i < text.length) {
        const char = text.charAt(i);
        setDisplayed((prev) => prev + char);
        i++;
      } else {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        setIsComplete(true);
        onCompleteRef.current?.();
      }
    }, speed);
    
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [text, speed]);

  const handleSkip = () => {
    if (!isComplete) {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      setDisplayed(text);
      setIsComplete(true);
      onCompleteRef.current?.();
    }
  };

  return (
    <div 
      className="relative cursor-pointer select-none" 
      onClick={handleSkip}
      title="点击跳过打字"
    >
      <p className="leading-relaxed inline text-lg drop-shadow-md">
        {displayed}
      </p>
      {!isComplete && (
        <span className="inline-block w-[2px] h-[1em] ml-1 bg-amber-800/60 animate-pulse align-middle" />
      )}
    </div>
  );
};

const FloatingText: React.FC<{ id: number; x: number; y: number; text: string; color?: string; onRemove: (id: number) => void }> = ({ id, x, y, text, color = "text-amber-200", onRemove }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(id);
        }, 2000);
        return () => clearTimeout(timer);
    }, [id, onRemove]);

    return (
        <div 
            className={`absolute pointer-events-none ${color} font-bold text-shadow animate-float-up z-50 whitespace-nowrap`}
            style={{ left: x, top: y, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
        >
            {text}
        </div>
    );
};

// Particles for the ending interaction
interface Particle {
    id: number;
    x: number;
    y: number;
    text?: string;
    icon?: 'heart' | 'sparkle';
}

// --- Main App ---

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.INTRO);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [showNextBtn, setShowNextBtn] = useState(false);
  
  // Party State
  const [awkwardLevel, setAwkwardLevel] = useState(0);
  const [partyStep, setPartyStep] = useState(0);

  // Collection State
  const [shards, setShards] = useState<Shard[]>([]);
  const [collectedShards, setCollectedShards] = useState<Shard[]>([]); 
  const [flashlightPos, setFlashlightPos] = useState<Point>({ x: 0, y: 0 });
  const [lightRadius, setLightRadius] = useState(120); 
  const [fireflies, setFireflies] = useState<Firefly[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<{id: number, x: number, y: number, text: string, color?: string}[]>([]);

  // Repair State
  const [draggedShardId, setDraggedShardId] = useState<number | null>(null);
  const [isRepairComplete, setIsRepairComplete] = useState(false);
  const bearRef = useRef<HTMLDivElement>(null);

  // Ending State
  const [endingParticles, setEndingParticles] = useState<Particle[]>([]);
  const [endingStep, setEndingStep] = useState(0); // 0: transition, 1: text loop, 2: final card

  // --- Logic for different phases ---

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setFlashlightPos({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    }
  }, []);

  const addFloatingText = (x: number, y: number, text: string, color?: string) => {
      setFloatingTexts(prev => [...prev, { id: Date.now(), x, y, text, color }]);
  };

  const removeFloatingText = (id: number) => {
      setFloatingTexts(prev => prev.filter(ft => ft.id !== id));
  };

  // 1. INTRO
  const handleIntroNext = () => {
    if (!showNextBtn) return;
    if (currentTextIndex < STORY_TEXTS.intro.length - 1) {
      setCurrentTextIndex(prev => prev + 1);
      setShowNextBtn(false);
    } else {
      setGameState(GameState.PARTY);
    }
  };

  // 2. PARTY logic...
  const partyDialogues = [
    {
      text: "大家都低着头看手机，空气凝固得让人难受。我必须做点什么...",
      options: [
        { text: "清清嗓子，讲个关于保安的笑话", action: 'crack' },
        { text: "保持沉默，假装也在看手机", action: 'silence' }
      ]
    },
    {
      text: "“嘿，其实我是小区保安，我最爱吃小熊饼干。”",
      response: "只有几道冰冷的目光扫过，然后大家又低下了头。",
      options: [
        { text: "尴尬地笑笑，解释是开玩笑", action: 'crack_more' },
        { text: "讲那个关于“碎掉”的故事", action: 'shatter_ready' }
      ]
    },
    {
      text: "“我也许是一块小熊饼干...我不小心摔了下来...晚安，我睡(碎)了。”",
      response: "有人嗤笑了一声：“你有病吧？”",
      options: [
        { text: "......", action: 'shatter' }
      ]
    }
  ];

  const handlePartyOption = (action: string) => {
    if (action === 'silence') {
        setAwkwardLevel(30);
        setPartyStep(1);
    } else if (action === 'crack') {
        setAwkwardLevel(40);
        setPartyStep(1);
    } else if (action === 'crack_more') {
        setAwkwardLevel(70);
        setPartyStep(2);
    } else if (action === 'shatter_ready') {
        setAwkwardLevel(80);
        setPartyStep(2);
    } else if (action === 'shatter') {
        setAwkwardLevel(100);
        setTimeout(() => setGameState(GameState.SHATTER), 1500);
    }
  };

  // 3. SHATTER...
  useEffect(() => {
    if (gameState === GameState.SHATTER) {
      const timer = setTimeout(() => {
        const newShards = BEAR_SHARDS_DATA.map(s => ({
          ...s,
          x: Math.random() * (window.innerWidth - 100) + 50,
          y: Math.random() * (window.innerHeight - 200) + 100,
          rotation: Math.random() * 360,
          isLocked: false
        }));
        setShards(newShards);
        
        const msgs = ["没关系的", "抱抱你", "我在听", "不怪你", "休息一下", "你很棒", "我们都在"];
        const newFireflies = Array.from({ length: 8 }).map((_, i) => ({
            id: i,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            message: msgs[i % msgs.length]
        }));
        setFireflies(newFireflies);
        setLightRadius(120);

        setGameState(GameState.DARKNESS);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  // 4. DARKNESS...
  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); 
    let clientX, clientY;
    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }
    setFlashlightPos({ x: clientX, y: clientY });
  };

  useEffect(() => {
    if (gameState !== GameState.DARKNESS) return;
    const interval = setInterval(() => {
        setFireflies(prev => prev.map(f => {
            let nx = f.x + f.vx;
            let ny = f.y + f.vy;
            if (nx < 0 || nx > window.innerWidth) f.vx *= -1;
            if (ny < 0 || ny > window.innerHeight) f.vy *= -1;
            return { ...f, x: nx, y: ny };
        }));
    }, 30);
    return () => clearInterval(interval);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== GameState.DARKNESS) return;
    setFireflies(prev => {
        const next = [...prev];
        let changed = false;
        next.forEach((f, idx) => {
            const dist = Math.sqrt(Math.pow(flashlightPos.x - f.x, 2) + Math.pow(flashlightPos.y - f.y, 2));
            if (dist < 40) { 
                next[idx] = { ...f, x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight };
                setLightRadius(r => Math.min(r + 20, 300));
                addFloatingText(flashlightPos.x, flashlightPos.y - 40, f.message, "text-yellow-200");
                changed = true;
            }
        });
        return changed ? next : prev;
    });
  }, [flashlightPos, gameState]);

  const collectShard = (shard: Shard) => {
    if (collectedShards.find(s => s.id === shard.id)) return;
    addFloatingText(shard.x, shard.y, "找到了!", "text-amber-200");
    setCollectedShards(prev => {
        const next = [...prev, shard];
        if (next.length === BEAR_SHARDS_DATA.length) {
            setTimeout(() => setGameState(GameState.REPAIR), 1500);
        }
        return next;
    });
    setShards(prev => prev.filter(s => s.id !== shard.id));
  };

  // 5. REPAIR...
  const [activeDragPos, setActiveDragPos] = useState<Point | null>(null);

  const onInventoryTouchStart = (e: React.TouchEvent | React.MouseEvent, shardId: number) => {
    e.preventDefault(); 
    e.stopPropagation();
    setDraggedShardId(shardId);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setActiveDragPos({ x: clientX, y: clientY });
  };

  const onGlobalMove = (e: React.TouchEvent | React.MouseEvent) => {
    if ((gameState !== GameState.REPAIR && gameState !== GameState.DARKNESS)) return;
    if (gameState === GameState.REPAIR && draggedShardId === null) return;
    
    let clientX, clientY;
    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }

    if (gameState === GameState.REPAIR && draggedShardId !== null) {
        setActiveDragPos({ x: clientX, y: clientY });
    }
  };

  const onGlobalEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (draggedShardId !== null && bearRef.current) {
        const bearRect = bearRef.current.getBoundingClientRect();
        let clientX, clientY;
        if ('changedTouches' in e) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        const hitMargin = 60; 
        if (
            clientX >= bearRect.left - hitMargin && 
            clientX <= bearRect.right + hitMargin && 
            clientY >= bearRect.top - hitMargin && 
            clientY <= bearRect.bottom + hitMargin
        ) {
            const shard = collectedShards.find(s => s.id === draggedShardId);
            if (shard) {
                setCollectedShards(prev => prev.map(s => s.id === shard.id ? { ...s, isLocked: true } : s));
                const feedbackX = bearRect.left + bearRect.width / 2;
                const feedbackY = bearRect.top + bearRect.height / 2;
                addFloatingText(feedbackX, feedbackY - 50, "✨ " + shard.affirmation, "text-amber-300");
            }
        }
    }
    setDraggedShardId(null);
    setActiveDragPos(null);
  };

  // Check win condition
  useEffect(() => {
    if (gameState === GameState.REPAIR) {
      const allLocked = collectedShards.length > 0 && collectedShards.every(s => s.isLocked);
      if (allLocked && !isRepairComplete) {
        setIsRepairComplete(true);
        setTimeout(() => {
            setGameState(GameState.ENDING);
            setEndingStep(0);
        }, 2000);
      }
    }
  }, [collectedShards, gameState, isRepairComplete]);


  // 6. ENDING INTERACTION
  const handleEndingClick = (e: React.MouseEvent | React.TouchEvent) => {
    let clientX, clientY;
    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }

    // Spawn particle
    const msg = INTERACTIVE_MESSAGES[Math.floor(Math.random() * INTERACTIVE_MESSAGES.length)];
    const newParticle: Particle = {
        id: Date.now(),
        x: clientX,
        y: clientY,
        text: msg,
        icon: Math.random() > 0.5 ? 'heart' : 'sparkle'
    };
    setEndingParticles(prev => [...prev, newParticle]);

    // Cleanup particle
    setTimeout(() => {
        setEndingParticles(prev => prev.filter(p => p.id !== newParticle.id));
    }, 2000);
  };


  // --- RENDERERS ---

  if (gameState === GameState.INTRO) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-amber-50 text-amber-900 transition-colors duration-1000">
        <div className="max-w-md w-full text-center space-y-8">
          <Bear emotion="happy" scale={0.8} />
          <div className="h-32 flex items-center justify-center px-4">
             <div className="font-serif text-xl italic text-amber-800/80">
               <TypewriterText 
                 text={STORY_TEXTS.intro[currentTextIndex]} 
                 key={currentTextIndex}
                 onComplete={() => setShowNextBtn(true)}
               />
             </div>
          </div>
          <div className="h-12">
            {showNextBtn && (
                <Button onClick={handleIntroNext} className="animate-fade-in">
                  继续
                </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === GameState.PARTY) {
    const dialogue = partyDialogues[partyStep];
    const opacity = awkwardLevel / 100;
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center p-6 bg-amber-50 overflow-hidden transition-all duration-1000">
        <div 
            className="absolute inset-0 bg-slate-900 pointer-events-none transition-opacity duration-1000" 
            style={{ opacity: opacity }}
        />
        <div className="relative z-10 max-w-lg w-full bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-amber-100">
          <div className="flex justify-center mb-6">
             <Bear emotion={awkwardLevel > 50 ? 'cracked' : 'nervous'} />
          </div>
          <div className="space-y-6 text-center">
            {partyStep > 0 && dialogue.response && (
                <p className="text-slate-500 italic mb-4">{dialogue.response}</p>
            )}
            <h2 className="text-xl font-bold text-amber-900 mb-6">
                {dialogue.text}
            </h2>
            <div className="grid gap-3">
              {dialogue.options?.map((opt, idx) => (
                <Button 
                    key={idx} 
                    variant="secondary"
                    onClick={() => handlePartyOption(opt.action || '')}
                    className="w-full text-sm py-4"
                >
                  {opt.text}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === GameState.SHATTER) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="relative animate-ping">
             <div className="text-6xl text-white font-serif">晚安...</div>
        </div>
      </div>
    );
  }

  if (gameState === GameState.DARKNESS) {
    return (
      <div 
        className="min-h-screen bg-slate-950 relative overflow-hidden cursor-none touch-none select-none"
        onMouseMove={handleMouseMove}
        onTouchMove={handleMouseMove}
      >
        <div 
            className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-300 bg-slate-950"
            style={{
                maskImage: `radial-gradient(circle ${lightRadius}px at ${flashlightPos.x}px ${flashlightPos.y}px, transparent 0%, black 100%)`,
                WebkitMaskImage: `radial-gradient(circle ${lightRadius}px at ${flashlightPos.x}px ${flashlightPos.y}px, transparent 0%, black 100%)`
            }}
        >
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
        </div>

        <div 
            className="absolute pointer-events-none z-50 mix-blend-plus-lighter"
            style={{ 
                left: flashlightPos.x, 
                top: flashlightPos.y,
                transform: 'translate(-50%, -50%)' 
            }}
        >
             <div className="relative flex items-center justify-center">
                 <div className="w-4 h-4 bg-amber-100 rounded-full shadow-[0_0_40px_20px_rgba(251,191,36,0.4)]" />
                 <div className="absolute w-12 h-12 border border-amber-200/20 rounded-full animate-[spin_4s_linear_infinite]" />
                 <Sparkles className="absolute text-amber-100 w-6 h-6 animate-pulse" />
             </div>
        </div>

        <div className="absolute top-8 left-0 w-full text-center z-30 pointer-events-none px-4">
            <p className="text-amber-100/80 text-lg font-serif mb-2">在这片迷雾中找回自己...</p>
            <p className="text-amber-100/40 text-sm">寻找发光的碎片 | 触碰游荡的光点来获得力量</p>
        </div>

        {fireflies.map(f => (
            <div 
                key={f.id}
                className="absolute z-10 w-2 h-2 bg-yellow-300 rounded-full blur-[1px] animate-pulse transition-transform duration-1000"
                style={{ left: f.x, top: f.y }}
            />
        ))}

        {shards.map((shard) => (
            <div
                key={shard.id}
                className="absolute w-16 h-16 flex items-center justify-center cursor-pointer z-10 animate-bounce text-amber-200"
                style={{ 
                    left: shard.x, 
                    top: shard.y, 
                }}
                onClick={() => collectShard(shard)}
                onTouchStart={() => collectShard(shard)}
            >
                <div className="relative group">
                    <Sparkles size={40} className="filter drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs whitespace-nowrap text-amber-100">
                        点击收集
                    </div>
                </div>
            </div>
        ))}

        {floatingTexts.map(ft => (
            <FloatingText key={ft.id} x={ft.x} y={ft.y} text={ft.text} color={ft.color} onRemove={removeFloatingText} />
        ))}
      </div>
    );
  }

  if (gameState === GameState.REPAIR) {
    const lockedShards = collectedShards.filter(s => s.isLocked);
    const lockedIds = lockedShards.map(s => s.id);
    const inventoryShards = collectedShards.filter(s => !s.isLocked);
    
    const activeShard = collectedShards.find(s => s.id === draggedShardId);
    
    const bearScale = 1.2;

    return (
      <div 
        className="min-h-screen bg-amber-950 flex flex-col overflow-hidden touch-none select-none transition-colors duration-2000"
        onMouseMove={onGlobalMove}
        onMouseUp={onGlobalEnd}
        onTouchMove={onGlobalMove}
        onTouchEnd={onGlobalEnd}
        style={{
             backgroundColor: isRepairComplete ? '#451a03' : undefined
        }}
      >
        <div className="flex-1 relative flex flex-col items-center justify-center">
            <div className="text-amber-100/60 mb-8 text-center pointer-events-none transition-opacity duration-500" style={{ opacity: isRepairComplete ? 0 : 1}}>
                <h2 className="text-2xl font-serif mb-2">重塑自我</h2>
                <p className="text-sm">拖动下方的【文字碎片】到小熊身上</p>
            </div>

            <div 
                ref={bearRef}
                className="relative w-[300px] h-[360px] flex items-center justify-center transition-all duration-300 select-none"
            >
                 {isRepairComplete && (
                     <div className="absolute inset-0 z-0 animate-pulse bg-amber-500/30 blur-3xl rounded-full scale-150 transition-all duration-1000" />
                 )}

                 {/* The Bear Body that gets rebuilt */}
                 <Bear 
                    emotion={isRepairComplete ? "healed" : "shattered"} 
                    scale={bearScale} 
                    shards={BEAR_SHARDS_DATA.map(d => ({...d, x:0, y:0, rotation:0, isLocked:false})) as Shard[]}
                    fixedPartIds={lockedIds}
                    highlightShardId={draggedShardId} 
                 />
            </div>
            
            {isRepairComplete && (
                 <div className="absolute bottom-32 text-2xl text-amber-100 font-serif font-bold animate-pulse text-shadow-lg">
                     正在愈合...
                 </div>
            )}
            
            {floatingTexts.map(ft => (
                <FloatingText key={ft.id} x={ft.x} y={ft.y} text={ft.text} color={ft.color} onRemove={removeFloatingText} />
            ))}
        </div>

        {/* Inventory Dock - Fades out on complete */}
        <div 
            className="h-32 bg-amber-900/40 backdrop-blur-md border-t border-amber-800/50 flex items-center justify-center gap-4 px-4 overflow-x-auto z-30 touch-auto transition-all duration-1000"
            style={{ transform: isRepairComplete ? 'translateY(100%)' : 'translateY(0)', opacity: isRepairComplete ? 0 : 1 }}
        >
            {inventoryShards.map(shard => (
                <div
                    key={shard.id}
                    className="relative group cursor-grab active:cursor-grabbing flex flex-col items-center justify-center p-2 transition-transform hover:-translate-y-2 shrink-0 select-none"
                    onMouseDown={(e) => onInventoryTouchStart(e, shard.id)}
                    onTouchStart={(e) => onInventoryTouchStart(e, shard.id)}
                >
                    <div className="w-16 h-16 relative pointer-events-none flex items-center justify-center">
                        <svg width="60" height="60" viewBox="-40 -40 80 80" className="overflow-visible filter drop-shadow-lg">
                            <path d={shard.path} fill="#C68E5D" stroke="#4A3426" strokeWidth={1} />
                        </svg>
                    </div>
                    <span className="mt-2 text-xs text-amber-200 font-bold bg-black/20 px-2 py-1 rounded-full pointer-events-none">
                        {shard.affirmation}
                    </span>
                </div>
            ))}
        </div>

        {activeDragPos && activeShard && (
            <div 
                className="fixed pointer-events-none z-50 flex flex-col items-center justify-center"
                style={{ 
                    left: activeDragPos.x, 
                    top: activeDragPos.y, 
                    transform: 'translate(-50%, -50%)',
                }}
            >
                <div className="absolute bottom-full mb-2 text-amber-100 font-bold text-lg text-shadow-lg whitespace-nowrap bg-amber-900/80 px-3 py-1 rounded-lg">
                    {activeShard.affirmation}
                </div>
                <div className="opacity-90 drop-shadow-2xl">
                     <svg width={activeShard.width * bearScale} height={activeShard.height * bearScale} viewBox={`-${activeShard.width/2} -${activeShard.height/2} ${activeShard.width} ${activeShard.height}`} className="overflow-visible">
                         <path d={activeShard.path} fill="#E8B486" stroke="#FFD700" strokeWidth={2} />
                     </svg>
                </div>
            </div>
        )}
      </div>
    );
  }

  if (gameState === GameState.ENDING) {
    // Determine which line to show based on text index, but here we can show them sequentially or all at once?
    // Let's use the Typewriter effect for lines sequentially.
    
    const isSunrise = endingStep >= 0;

    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center transition-all duration-[3000ms] select-none overflow-hidden relative"
        style={{
            background: 'linear-gradient(to bottom, #fef3c7 0%, #fed7aa 100%)' // Dawn colors
        }}
        onClick={handleEndingClick}
      >
        {/* Ambient Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
             {[...Array(20)].map((_, i) => (
                 <div 
                    key={i}
                    className="absolute bg-white/40 rounded-full animate-float-up"
                    style={{
                        width: Math.random() * 10 + 2 + 'px',
                        height: Math.random() * 10 + 2 + 'px',
                        left: Math.random() * 100 + '%',
                        top: Math.random() * 100 + '%',
                        animationDuration: Math.random() * 5 + 5 + 's',
                        animationDelay: Math.random() * 2 + 's'
                    }}
                 />
             ))}
        </div>

        <div className="max-w-md w-full text-center space-y-8 z-10 relative">
           {/* Sun Halo */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-300/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

           <div className="relative group cursor-pointer transition-transform duration-300 active:scale-95">
                <div className="absolute inset-0 bg-white/40 blur-3xl rounded-full scale-75 group-hover:scale-90 transition-transform"></div>
                <Bear emotion="healed" scale={1.2} />
                <div className="absolute -bottom-8 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity text-amber-800/60 text-sm font-bold">
                    (点击摸摸头)
                </div>
           </div>
           
           <div className="space-y-4 font-serif text-lg leading-relaxed text-amber-900/80 min-h-[240px] flex flex-col justify-center bg-white/30 p-6 rounded-2xl backdrop-blur-sm shadow-xl mx-4 border border-white/50">
                {currentTextIndex < STORY_TEXTS.ending.length ? (
                    <TypewriterText 
                        key={currentTextIndex}
                        text={STORY_TEXTS.ending[currentTextIndex]}
                        speed={50}
                        onComplete={() => {
                            setTimeout(() => {
                                if (currentTextIndex < STORY_TEXTS.ending.length - 1) {
                                    setCurrentTextIndex(prev => prev + 1);
                                } else {
                                    setEndingStep(2); // Show restart button
                                }
                            }, 2000); // Wait 2s before next line
                        }}
                    />
                ) : (
                    <div className="flex flex-col items-center gap-4 animate-fade-in">
                        <p className="text-xl font-bold text-amber-800">晚安，小熊饼干。</p>
                        <Heart className="text-red-400 fill-red-400 animate-bounce" />
                    </div>
                )}
           </div>

           {endingStep === 2 && (
               <div className="animate-fade-in pt-4">
                    <Button 
                        variant="ghost" 
                        onClick={(e) => {
                            e.stopPropagation();
                            setGameState(GameState.INTRO);
                            setCurrentTextIndex(0);
                            setCollectedShards([]);
                            setShards([]);
                            setAwkwardLevel(0);
                            setPartyStep(0);
                            setLightRadius(120);
                            setFireflies([]);
                            setIsRepairComplete(false);
                            setEndingStep(0);
                        }}
                        className="flex items-center gap-2 mx-auto text-amber-800/50 hover:text-amber-800 bg-white/20 hover:bg-white/40"
                    >
                        <RefreshCcw size={16} /> 再来一次
                    </Button>
               </div>
           )}
        </div>

        {/* Interaction Particles */}
        {endingParticles.map(p => (
            <div 
                key={p.id}
                className="absolute pointer-events-none animate-float-up-fade flex flex-col items-center"
                style={{ left: p.x, top: p.y }}
            >
                {p.icon === 'heart' ? (
                    <Heart size={24} className="text-red-400 fill-red-400 mb-1" />
                ) : (
                    <Sparkles size={24} className="text-yellow-400 fill-yellow-400 mb-1" />
                )}
                <span className="text-amber-800 font-bold text-sm bg-white/80 px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                    {p.text}
                </span>
            </div>
        ))}

        <style>{`
            @keyframes float-up-fade {
                0% { transform: translateY(0) scale(0.5); opacity: 0; }
                20% { transform: translateY(-20px) scale(1.1); opacity: 1; }
                100% { transform: translateY(-100px) scale(1); opacity: 0; }
            }
            .animate-float-up-fade {
                animation: float-up-fade 2s ease-out forwards;
            }
        `}</style>
      </div>
    );
  }

  return null;
}