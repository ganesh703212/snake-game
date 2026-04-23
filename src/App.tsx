import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Volume2, VolumeX, Gamepad2, Music } from 'lucide-react';
import { motion } from 'motion/react';

// --- GAME CONSTANTS ---
const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const INITIAL_SPEED = 150;

// --- DUMMY MUSIC TRACKS ---
const TRACKS = [
  { id: 1, title: 'NEON_DRIVE.wav // AI_GEN', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'CYBER_CITY_NIGHTS.wav // AI_GEN', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3, title: 'DATA_STREAM_XYZ.wav // AI_GEN', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];

export default function App() {
  // --- STATE: MUSIC PLAYER ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- STATE: SNAKE GAME ---
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameRunning, setIsGameRunning] = useState(false);
  
  // Refs for game loop consistency without triggering re-renders
  const directionRef = useRef(direction);
  const snakeRef = useRef(snake);
  const isGameRunningRef = useRef(isGameRunning);

  // Sync refs
  useEffect(() => { directionRef.current = direction; }, [direction]);
  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { isGameRunningRef.current = isGameRunning; }, [isGameRunning]);

  // --- AUDIO LOGIC ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = TRACKS[currentTrackIndex].url;
      if (isPlayingMusic) {
        audioRef.current.play().catch(() => setIsPlayingMusic(false));
      }
    }
  }, [currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlayingMusic) {
        audioRef.current.play().catch(() => setIsPlayingMusic(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlayingMusic]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = () => setIsPlayingMusic(!isPlayingMusic);
  const nextTrack = () => setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  const prevTrack = () => setCurrentTrackIndex((prev) => (prev === 0 ? TRACKS.length - 1 : prev - 1));

  // --- GAME LOGIC ---
  const generateFood = useCallback((currentSnake: {x: number, y: number}[]) => {
    let newFood;
    let isOccupied = true;
    while (isOccupied) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // eslint-disable-next-line no-loop-func
      isOccupied = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
    }
    return newFood as {x: number, y: number};
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setIsGameOver(false);
    setFood(generateFood(INITIAL_SNAKE));
    setIsGameRunning(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent taking over if typing in an input (not that we have any, but good practice)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const currentDir = directionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDir.y !== 1) setDirection({ x: 0, y: -1 });
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDir.y !== -1) setDirection({ x: 0, y: 1 });
          e.preventDefault();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDir.x !== 1) setDirection({ x: -1, y: 0 });
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDir.x !== -1) setDirection({ x: 1, y: 0 });
          e.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let gameInterval: number;

    if (isGameRunning && !isGameOver) {
      gameInterval = window.setInterval(() => {
        const head = snakeRef.current[0];
        const currentDir = directionRef.current;
        const newHead = { x: head.x + currentDir.x, y: head.y + currentDir.y };

        // Collision Check: Walls
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          setIsGameOver(true);
          setIsGameRunning(false);
          return;
        }

        // Collision Check: Self
        if (snakeRef.current.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setIsGameOver(true);
          setIsGameRunning(false);
          return;
        }

        const newSnake = [newHead, ...snakeRef.current];

        // Eat Food
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop(); // Remove tail if not eating
        }

        setSnake(newSnake);
      }, Math.max(50, INITIAL_SPEED - Math.floor(score / 50) * 10)); // Speed increases slightly
    }

    return () => clearInterval(gameInterval);
  }, [isGameRunning, isGameOver, food, score, generateFood]);

  return (
    <div className="flex flex-col h-screen overflow-hidden selection:bg-[var(--color-magenta-neon)] selection:text-white relative">
      {/* --- BACKGROUND NEON FLIGHT / AMBIENT --- */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-900/10 blur-[100px] rounded-full mix-blend-screen" />
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-fuchsia-900/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <audio 
        ref={audioRef} 
        onEnded={nextTrack} 
        className="hidden" 
      />

      <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-white/10 glass-panel shrink-0 z-10 relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-400 to-[#ff00e5] animate-pulse"></div>
          <h1 className="text-sm sm:text-xl font-bold tracking-tighter uppercase neon-text-cyan flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 hidden sm:block" />
            SNAKE.exe
          </h1>
        </div>
        <div className="flex gap-4 sm:gap-8 items-center">
            <div className="text-right uppercase tracking-widest">
                <p className="text-[10px] text-white/40">Current Score</p>
                <p className="text-xl sm:text-2xl font-mono neon-text-magenta">{score.toString().padStart(5, '0')}</p>
            </div>
            <div className="text-right uppercase tracking-widest border-l border-white/10 pl-4 sm:pl-8">
                <p className="text-[10px] text-white/40">Speed</p>
                <p className="text-xl sm:text-2xl font-mono text-white/80">LVL {(Math.floor(score / 50) + 1).toString().padStart(2, '0')}</p>
            </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row p-4 sm:p-6 gap-6 min-h-0 z-10 relative">
        
        {/* Left Sidebar */}
        <aside className="hidden xl:flex w-64 flex-col gap-4">
            <div className="glass-panel p-5 rounded-xl flex-1 flex flex-col items-center justify-center text-center">
                <Gamepad2 className="w-12 h-12 text-[var(--color-cyan-neon)] mb-4 opacity-50" />
                <h3 className="text-xs uppercase tracking-widest neon-text-cyan font-bold mb-4">Controls</h3>
                <kbd className="px-3 py-2 bg-white/5 border border-white/10 rounded text-xs mb-2">W A S D</kbd>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">to Move Snake</p>
            </div>
        </aside>

        {/* Center Viewport */}
        <section className="flex-1 flex flex-col items-center justify-center relative">
            <div className="neon-border-cyan rounded-lg overflow-hidden relative shadow-[0_0_30px_rgba(0,242,255,0.1)]" style={{ width: 440, height: 440, maxWidth: '100%', maxHeight: '100vw' }}>
                <div 
                  className="grid bg-[#000000cc] w-full h-full relative"
                  style={{
                      gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                      gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`
                  }}
                >
                    {snake.map((segment, index) => {
                      return (
                        <div
                          key={index}
                          className={`snake-node ${index === 0 ? 'z-10 shadow-[0_0_15px_rgba(255,255,255,0.8)] opacity-100 bg-white' : ''}`}
                          style={{ gridColumn: segment.x + 1, gridRow: segment.y + 1 }}
                        />
                      )
                    })}
                    <div
                      className="food-node animate-pulse"
                      style={{ gridColumn: food.x + 1, gridRow: food.y + 1 }}
                    />
                </div>
                
                {!isGameRunning && !isGameOver && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px] z-20">
                    <button
                      onClick={resetGame}
                      className="px-6 py-3 border border-[var(--color-magenta-neon)] neon-text-magenta font-bold uppercase tracking-widest hover:bg-[var(--color-magenta-neon)] hover:text-black hover:shadow-[0_0_25px_var(--color-magenta-neon)] transition-all shadow-[0_0_15px_rgba(255,0,229,0.3)]"
                    >
                      Start System
                    </button>
                  </div>
                )}

                {isGameOver && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center backdrop-blur-[4px] z-20">
                    <h2 className="text-3xl font-bold text-red-500 mb-2 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">SYSTEM FAILURE</h2>
                    <p className="neon-text-cyan opacity-80 mb-6 uppercase tracking-widest text-sm">Vital processes terminated</p>
                    <div className="text-lg mb-6">
                      Final Score: <span className="text-white font-bold">{score}</span>
                    </div>
                    <button
                      onClick={resetGame}
                      className="flex items-center gap-2 px-6 py-3 border border-[var(--color-cyan-neon)] neon-text-cyan font-bold uppercase tracking-widest hover:bg-[var(--color-cyan-neon)] hover:text-black hover:shadow-[0_0_25px_var(--color-cyan-neon)] transition-all shadow-[0_0_15px_rgba(0,242,255,0.3)]"
                    >
                      <RotateCcw className="w-5 h-5" />
                      Reboot
                    </button>
                  </div>
                )}
            </div>
            
            <div className="mt-6 flex xl:hidden gap-4">
                <kbd className="px-3 py-2 bg-white/5 border border-white/10 rounded text-xs">W A S D</kbd>
                <span className="text-xs text-white/30 self-center">to Move Snake</span>
            </div>
        </section>

        {/* Right Sidebar */}
        <aside className="w-full lg:w-72 flex flex-col gap-4 overflow-y-auto">
            <div className="glass-panel p-5 rounded-xl flex-1 flex flex-col">
                <h3 className="text-xs uppercase tracking-widest neon-text-magenta font-bold mb-4 flex items-center gap-2">
                    <Music className="w-4 h-4" /> Next Tracks
                </h3>
                <div className="space-y-3 flex-1 flex flex-col justify-center lg:block">
                    {TRACKS.map((track, idx) => (
                      <div 
                        key={track.id}
                        onClick={() => {
                          setCurrentTrackIndex(idx);
                          if (!isPlayingMusic) setIsPlayingMusic(true);
                        }}
                        className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                          idx === currentTrackIndex 
                            ? 'bg-[var(--color-cyan-neon)]/10 border border-[var(--color-cyan-neon)]/30'
                            : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                         <div className="w-10 h-10 bg-black/40 rounded flex items-center justify-center shrink-0">
                             {idx === currentTrackIndex && isPlayingMusic ? (
                                <span className="text-[var(--color-cyan-neon)]">▶</span>
                             ) : (
                               <span className={idx === currentTrackIndex ? "neon-text-cyan" : "text-white/20"}>
                                 {idx + 1}
                               </span>
                             )}
                         </div>
                         <div className="overflow-hidden">
                             <p className={`text-sm font-bold truncate ${idx === currentTrackIndex ? 'neon-text-cyan' : 'text-white/60 font-medium'}`}>{track.title}</p>
                             <p className={`text-[10px] truncate ${idx === currentTrackIndex ? 'text-[var(--color-cyan-neon)]' : 'text-white/30'}`}>AI Synthesizer</p>
                         </div>
                      </div>
                    ))}
                </div>
            </div>
        </aside>
      </main>

      <footer className="h-24 glass-panel border-t border-white/10 px-4 sm:px-10 flex items-center gap-4 sm:gap-12 shrink-0 justify-between z-10 relative">
          <div className="flex items-center gap-4 w-40 sm:w-64 shrink-0">
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-tr from-cyan-900 to-[#ff00e5]/40 rounded-lg flex items-center justify-center text-xl sm:text-2xl">
                  💿
              </div>
              <div className="overflow-hidden hidden sm:block">
                  <p className="font-bold text-white truncate">{TRACKS[currentTrackIndex].title}</p>
                  <p className="text-xs text-[var(--color-cyan-neon)] truncate">Playing: Audio Deck</p>
              </div>
          </div>

          <div className="flex-1 max-w-xl flex flex-col items-center gap-2">
              <div className="flex items-center gap-8">
                  <button onClick={prevTrack} className="text-white/40 hover:text-white transition-colors">
                     <SkipBack className="w-5 h-5 fill-current" />
                  </button>
                  <button 
                    onClick={togglePlay} 
                    className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
                  >
                     {isPlayingMusic ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                  </button>
                  <button onClick={nextTrack} className="text-white/40 hover:text-white transition-colors">
                     <SkipForward className="w-5 h-5 fill-current" />
                  </button>
              </div>
              <div className="w-full flex items-center gap-3">
                  <span className="text-[10px] font-mono text-white/30">SIM</span>
                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden relative">
                      {isPlayingMusic ? (
                        <motion.div 
                          className="music-bar-progress h-full absolute left-0" 
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
                        />
                      ) : (
                        <div className="music-bar-progress h-full w-[0%]" />
                      )}
                  </div>
                  <span className="text-[10px] font-mono text-white/30">TIME</span>
              </div>
          </div>

          <div className="w-24 sm:w-64 flex items-center justify-end gap-2 sm:gap-4 shrink-0">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="text-white/40 hover:text-white transition-colors"
                title="Toggle Mute"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <div className="w-12 sm:w-24 h-1 bg-white/10 rounded-full overflow-hidden relative hidden sm:block">
                  <div className={`h-full bg-white/60 rounded-full transition-all ${isMuted ? 'w-0' : 'w-3/4'}`}></div>
              </div>
          </div>
      </footer>
    </div>
  );
}
