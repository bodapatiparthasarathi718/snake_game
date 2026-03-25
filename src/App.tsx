/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Terminal, Volume2, AlertTriangle } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const INITIAL_FOOD = { x: 5, y: 5 };
const GAME_SPEED = 120;

const AUDIO_TRACKS = [
  { id: '0x01', title: 'NEURAL_SYNTH_V1.WAV', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: '0x02', title: 'VOID_LOOP_ERR.OGG', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: '0x03', title: 'SYSTEM_CRASH.FLAC', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];

export default function App() {
  // Game State
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState(INITIAL_FOOD);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [logs, setLogs] = useState<string[]>(['SYSTEM BOOT...', 'AWAITING INPUT...']);
  
  const directionRef = useRef(direction);
  const gameBoardRef = useRef<HTMLDivElement>(null);

  // Audio State
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev.slice(-4), `> ${msg}`]);
  }, []);

  // Audio Controls
  const toggleAudio = () => {
    if (audioPlaying) {
      audioRef.current?.pause();
      addLog('AUDIO.SYS PAUSED');
    } else {
      audioRef.current?.play().catch(() => addLog('ERR: AUDIO_PLAY_BLOCKED'));
      addLog('AUDIO.SYS ENGAGED');
    }
    setAudioPlaying(!audioPlaying);
  };

  const nextTrack = () => {
    setCurrentTrack((prev) => (prev + 1) % AUDIO_TRACKS.length);
    addLog('TRACK_SEEK: FORWARD');
  };

  const prevTrack = () => {
    setCurrentTrack((prev) => (prev - 1 + AUDIO_TRACKS.length) % AUDIO_TRACKS.length);
    addLog('TRACK_SEEK: REVERSE');
  };

  useEffect(() => {
    if (audioPlaying && audioRef.current) {
      audioRef.current.play().catch(() => setAudioPlaying(false));
    }
  }, [currentTrack]);

  // Game Logic
  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setFood({
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    });
    setGameOver(false);
    setScore(0);
    setIsPlaying(true);
    addLog('NEURO-LINK ESTABLISHED');
    gameBoardRef.current?.focus();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver) return;
      
      // Prevent default scrolling for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      const { x, y } = directionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (y === 0) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (y === 0) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (x === 0) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (x === 0) setDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameOver]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const newHead = { 
          x: head.x + direction.x, 
          y: head.y + direction.y 
        };

        // Update ref for next keydown check
        directionRef.current = direction;

        // Wall Collision
        if (
          newHead.x < 0 || 
          newHead.x >= GRID_SIZE || 
          newHead.y < 0 || 
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          setIsPlaying(false);
          addLog('FATAL: WALL_COLLISION');
          return prevSnake;
        }

        // Self Collision
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          setIsPlaying(false);
          addLog('FATAL: SELF_INTERSECTION');
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Food Collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 16); // Hex-like score increments
          addLog(`DATA_PACKET_ACQUIRED: +16`);
          setFood({
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
          });
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const intervalId = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(intervalId);
  }, [direction, isPlaying, gameOver, food, addLog]);

  // Random glitch logs
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.8) {
        const hex = Math.floor(Math.random() * 0xffffff).toString(16).toUpperCase().padStart(6, '0');
        addLog(`MEM_DUMP: 0x${hex}`);
      }
    }, 3000);
    return () => clearInterval(glitchInterval);
  }, [addLog]);

  return (
    <div className="min-h-screen bg-black text-[#0ff] font-mono scanlines relative flex flex-col items-center justify-center p-4 overflow-hidden selection:bg-[#f0f] selection:text-black">
      
      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef} 
        src={AUDIO_TRACKS[currentTrack].url} 
        onEnded={nextTrack}
        loop={false}
      />

      {/* Header */}
      <header className="w-full max-w-4xl flex justify-between items-end border-b-2 border-[#f0f] pb-2 mb-6 tear">
        <div>
          <h1 className="text-4xl md:text-6xl font-bold glitch tracking-tighter">NEURO-SNAKE</h1>
          <p className="text-[#f0f] text-sm md:text-base tracking-widest uppercase">v2.0.4 // Unauthorized Access</p>
        </div>
        <div className="text-right hidden md:block">
          <div className="text-2xl text-[#fff] glitch">SCORE: 0x{score.toString(16).toUpperCase().padStart(4, '0')}</div>
          <div className="text-xs text-[#0ff] opacity-70">DEC: {score}</div>
        </div>
      </header>

      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8 items-start z-10">
        
        {/* Left Panel: Game Board */}
        <div className="flex-1 w-full flex flex-col items-center">
          <div className="md:hidden w-full flex justify-between items-center mb-4 border border-[#0ff] p-2 bg-[#050505]">
             <span className="text-[#f0f]">SCORE:</span>
             <span className="text-xl glitch">0x{score.toString(16).toUpperCase().padStart(4, '0')}</span>
          </div>

          <div 
            ref={gameBoardRef}
            tabIndex={0}
            className="relative bg-[#050505] border-2 border-[#0ff] shadow-[0_0_20px_rgba(0,255,255,0.2)] outline-none focus:border-[#f0f] focus:shadow-[0_0_20px_rgba(255,0,255,0.4)] transition-colors duration-300"
            style={{ 
              width: '100%', 
              maxWidth: '400px', 
              aspectRatio: '1/1',
              display: 'grid',
              gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`
            }}
          >
            {/* Grid Cells */}
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
              const x = i % GRID_SIZE;
              const y = Math.floor(i / GRID_SIZE);
              const isSnake = snake.some(segment => segment.x === x && segment.y === y);
              const isHead = snake[0].x === x && snake[0].y === y;
              const isFood = food.x === x && food.y === y;

              return (
                <div 
                  key={i} 
                  className={`
                    border-[0.5px] border-[#0ff]/10
                    ${isHead ? 'bg-[#fff] shadow-[0_0_10px_#fff] z-10' : ''}
                    ${isSnake && !isHead ? 'bg-[#0ff] shadow-[0_0_5px_#0ff]' : ''}
                    ${isFood ? 'bg-[#f0f] shadow-[0_0_8px_#f0f] animate-pulse' : ''}
                  `}
                />
              );
            })}

            {/* Overlays */}
            {!isPlaying && !gameOver && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm">
                <button 
                  onClick={resetGame}
                  className="px-6 py-3 border-2 border-[#0ff] text-[#0ff] hover:bg-[#0ff] hover:text-black text-xl uppercase tracking-widest transition-all shadow-[0_0_15px_#0ff] hover:shadow-[0_0_25px_#0ff]"
                >
                  INIT_SEQUENCE
                </button>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center backdrop-blur-md border-4 border-[#f0f] crt-flicker">
                <AlertTriangle className="w-16 h-16 text-[#f0f] mb-4 animate-bounce" />
                <h2 className="text-4xl font-bold text-[#f0f] glitch mb-2">SYSTEM FAILURE</h2>
                <p className="text-xl text-white mb-6">FINAL SCORE: 0x{score.toString(16).toUpperCase()}</p>
                <button 
                  onClick={resetGame}
                  className="px-6 py-3 border-2 border-[#f0f] text-[#f0f] hover:bg-[#f0f] hover:text-black text-xl uppercase tracking-widest transition-all shadow-[0_0_15px_#f0f]"
                >
                  REBOOT_SYS
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 text-xs text-[#0ff]/60 text-center uppercase tracking-widest">
            Click grid to focus. Use W/A/S/D or Arrows to navigate.
          </div>
        </div>

        {/* Right Panel: Audio & Logs */}
        <div className="w-full md:w-80 flex flex-col gap-6">
          
          {/* Audio Player */}
          <div className="border border-[#f0f] bg-[#050505] p-4 shadow-[0_0_15px_rgba(255,0,255,0.15)]">
            <div className="flex items-center gap-2 mb-4 border-b border-[#f0f]/30 pb-2">
              <Volume2 className="w-5 h-5 text-[#f0f]" />
              <h3 className="text-lg text-[#f0f] tracking-widest">AUDIO.SYS</h3>
            </div>
            
            <div className="mb-6">
              <div className="text-xs text-[#0ff]/70 mb-1">CURRENT_TRACK:</div>
              <div className="text-lg truncate glitch text-white">
                {AUDIO_TRACKS[currentTrack].title}
              </div>
              <div className="text-xs text-[#f0f] mt-1">
                STATUS: {audioPlaying ? 'PLAYING [||||||||]' : 'PAUSED [........]'}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button onClick={prevTrack} className="p-2 border border-[#0ff] hover:bg-[#0ff] hover:text-black transition-colors">
                <SkipBack className="w-5 h-5" />
              </button>
              <button onClick={toggleAudio} className="p-3 border-2 border-[#f0f] text-[#f0f] hover:bg-[#f0f] hover:text-black transition-colors shadow-[0_0_10px_#f0f]">
                {audioPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
              </button>
              <button onClick={nextTrack} className="p-2 border border-[#0ff] hover:bg-[#0ff] hover:text-black transition-colors">
                <SkipForward className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Terminal Logs */}
          <div className="border border-[#0ff] bg-[#050505] p-4 h-48 flex flex-col shadow-[0_0_15px_rgba(0,255,255,0.1)]">
            <div className="flex items-center gap-2 mb-2 border-b border-[#0ff]/30 pb-2">
              <Terminal className="w-4 h-4 text-[#0ff]" />
              <h3 className="text-sm tracking-widest">TERMINAL_OUT</h3>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col justify-end text-sm">
              {logs.map((log, i) => (
                <div key={i} className="animate-pulse opacity-80">{log}</div>
              ))}
              <div className="animate-pulse text-[#f0f]">_</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
