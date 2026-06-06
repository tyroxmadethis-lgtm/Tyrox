import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { AudioSynth } from '../services/audioSynth';
import { Track } from '../types';
import { 
  Play, 
  RotateCcw, 
  AlertCircle, 
  Sparkles, 
  Music, 
  Trophy, 
  Volume2, 
  VolumeX,
  Keyboard, 
  Flame, 
  Activity 
} from 'lucide-react';

interface GameNote {
  id: string;
  lane: number; // 0, 1, 2, 3 corresponding to Keys
  y: number;    // falling position in percentage or pixels (0 to 100)
  speed: number;
  hit: boolean;
  missed: boolean;
}

interface PerformanceMetric {
  perfectCount: number;
  goodCount: number;
  missCount: number;
  maxCombo: number;
}

export default function RhythmArcade() {
  const { tracks } = useStore();
  
  // Game States
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('tyrox_arcade_highscore') || '0', 10);
  });
  
  const [lastRating, setLastRating] = useState<'PERFECT' | 'GOOD' | 'MISS' | null>(null);
  const [ratingColor, setRatingColor] = useState<string>('text-[#39FF14]');
  const [metrics, setMetrics] = useState<PerformanceMetric>({
    perfectCount: 0,
    goodCount: 0,
    missCount: 0,
    maxCombo: 0
  });

  const [soundEnabled, setSoundEnabled] = useState(true);

  // References
  const gameLoopRef = useRef<number | null>(null);
  const notesRef = useRef<GameNote[]>([]);
  const [notesState, setNotesState] = useState<GameNote[]>([]);
  const lastSpawnTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // 4 Lanes configuration
  const lanes = [
    { key: 'D', color: 'border-cyan-500/30 text-cyan-400 bg-cyan-950/20 shadow-cyan-500/20 hover:bg-cyan-900/10' },
    { key: 'F', color: 'border-purple-500/30 text-purple-400 bg-purple-950/20 shadow-purple-500/20 hover:bg-purple-900/10' },
    { key: 'J', color: 'border-pink-500/30 text-pink-400 bg-pink-950/20 shadow-pink-500/20 hover:bg-pink-900/10' },
    { key: 'K', color: 'border-emerald-500/30 text-[#39FF14] bg-emerald-950/20 shadow-emerald-500/20 hover:bg-emerald-900/10' },
  ];

  // Active inputs trigger states for visual flash feedback
  const [activeKeys, setActiveKeys] = useState<{ [key: string]: boolean }>({
    'D': false, 'F': false, 'J': false, 'K': false
  });

  // Choose starting beat default on mount
  useEffect(() => {
    if (tracks && tracks.length > 0) {
      setSelectedTrack(tracks[0]);
    }
  }, [tracks]);

  // Handle high score persistence
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('tyrox_arcade_highscore', String(score));
    }
  }, [score, highScore]);

  // Play custom hit sound effect using Web Audio API dynamically
  const triggerHitSound = (isPerfect: boolean) => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      if (isPerfect) {
        // High fidelity techno pluck synth sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
        gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else {
        // Normal snare tap sound approximation
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.12);
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      }
    } catch (e) {
      console.warn("Web Audio dynamic sound synthesis blocked", e);
    }
  };

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyStr = e.key.toUpperCase();
      if (['D', 'F', 'J', 'K'].includes(keyStr)) {
        setActiveKeys(prev => ({ ...prev, [keyStr]: true }));
        if (isPlaying) {
          handleLanePress(['D', 'F', 'J', 'K'].indexOf(keyStr));
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keyStr = e.key.toUpperCase();
      if (['D', 'F', 'J', 'K'].includes(keyStr)) {
        setActiveKeys(prev => ({ ...prev, [keyStr]: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, selectedTrack]);

  // Core Unity Score / Combo Mechanics logic map
  const addPerfect = () => {
    triggerHitSound(true);
    setCombo(prev => {
      const nextCombo = prev + 1;
      setScore(s => s + (100 * nextCombo));
      setMetrics(m => ({
        ...m,
        perfectCount: m.perfectCount + 1,
        maxCombo: Math.max(m.maxCombo, nextCombo)
      }));
      return nextCombo;
    });
    setLastRating('PERFECT');
    setRatingColor('text-[#39FF14] shadow-[#39FF14]/40');
  };

  const addGood = () => {
    triggerHitSound(false);
    setCombo(prev => {
      const nextCombo = prev + 1;
      setScore(s => s + 50);
      setMetrics(m => ({
        ...m,
        goodCount: m.goodCount + 1,
        maxCombo: Math.max(m.maxCombo, nextCombo)
      }));
      return nextCombo;
    });
    setLastRating('GOOD');
    setRatingColor('text-purple-400 shadow-purple-500/40');
  };

  const triggerMiss = () => {
    setCombo(0);
    setLastRating('MISS');
    setRatingColor('text-red-500 shadow-red-500/40');
    setMetrics(m => ({
      ...m,
      missCount: m.missCount + 1
    }));
  };

  // Process a keystroke targeting a specific lane
  const handleLanePress = (laneIdx: number) => {
    // Search for any unhit note falling inside the hit confirmation window (y between 78% and 94%)
    const laneNotes = notesRef.current.filter(n => n.lane === laneIdx && !n.hit && !n.missed);
    if (laneNotes.length === 0) return;

    // Find the note closest to our standard target threshold center (85%)
    let closestNote: GameNote | null = null;
    let closestDist = 999;

    laneNotes.forEach(note => {
      const dist = Math.abs(note.y - 85);
      if (dist < closestDist) {
        closestDist = dist;
        closestNote = note;
      }
    });

    if (closestNote) {
      // Game judgment ranges
      if (closestDist <= 4.2) {
        // Core perfect hit!
        closestNote.hit = true;
        addPerfect();
      } else if (closestDist <= 9.5) {
        // Good hit!
        closestNote.hit = true;
        addGood();
      } else {
        // Punishing early/late hits with basic misses
        closestNote.hit = true; // Mark as resolved to avoid double taps
        triggerMiss();
      }
    }
  };

  // Start the Game sequence
  const startGame = () => {
    if (!selectedTrack) return;
    
    // Stop any existing studio background players
    AudioSynth.stop();
    
    // Clear state
    notesRef.current = [];
    setNotesState([]);
    setScore(0);
    setCombo(0);
    setLastRating(null);
    setMetrics({
      perfectCount: 0,
      goodCount: 0,
      missCount: 0,
      maxCombo: 0
    });
    
    // Set level based on selected track bpm
    const calculatedLevel = Math.max(1, Math.min(5, Math.floor((selectedTrack.bpm - 90) / 20) + 1));
    setLevel(calculatedLevel);

    // Initialise audio synthesizer node based on parameters
    setIsPlaying(true);
    AudioSynth.play(selectedTrack.id, selectedTrack.bpm, selectedTrack.key || 'Am');

    lastSpawnTimeRef.current = Date.now();
    
    // Boot the render/game simulation loop
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    gameLoopRef.current = requestAnimationFrame(runGameLoop);
  };

  // Stop the game sequence
  const stopGame = () => {
    setIsPlaying(false);
    AudioSynth.stop();
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    gameLoopRef.current = null;
    setNotesState([]);
  };

  // Unified RequestAnimationFrame Frame Controller loop
  const runGameLoop = (timestamp: number) => {
    const now = Date.now();
    const bpm = selectedTrack?.bpm || 120;
    
    // Spawn rate interval based precisely on track BMP
    // Higher BMP triggers tighter, faster note structures
    const spawnInterval = (60 / bpm) * 1000 * 0.75; // 3/4 beat divisions
    
    if (now - lastSpawnTimeRef.current > spawnInterval) {
      // Pick a random rhythmic lane or dual lanes
      const laneIdx = Math.floor(Math.random() * 4);
      const isDual = Math.random() > 0.85; // occasional coordinate drops
      
      const newNote: GameNote = {
        id: Math.random().toString(36).substr(2, 9),
        lane: laneIdx,
        y: 0,
        speed: 3.8 + (level * 0.4), // proportional travel speeds modeled on levels
        hit: false,
        missed: false
      };
      
      notesRef.current.push(newNote);

      if (isDual) {
        const altLane = (laneIdx + 2) % 4;
        const secondNote: GameNote = {
          id: Math.random().toString(36).substr(2, 9),
          lane: altLane,
          y: 0,
          speed: 3.8 + (level * 0.4),
          hit: false,
          missed: false
        };
        notesRef.current.push(secondNote);
      }

      lastSpawnTimeRef.current = now;
    }

    // Step 2: Iterate and update all falling elements down toward the trigger zones
    const notesToKeep: GameNote[] = [];
    
    notesRef.current.forEach(note => {
      // Fall down based on travel metrics
      note.y += note.speed;

      // Note surpasses base of viewport check (threshold miss range is > 93%)
      if (note.y > 93 && !note.hit && !note.missed) {
        note.missed = true;
        triggerMiss();
      }

      // Keep them around until completely fallen past 100% boundary
      if (note.y < 100) {
        notesToKeep.push(note);
      }
    });

    notesRef.current = notesToKeep;
    
    // Sync into state for React paint loop
    setNotesState([...notesRef.current]);

    // Check if player clicked pause or song ended
    const audioPlaying = (AudioSynth as any).isPlaying;
    if (audioPlaying) {
      gameLoopRef.current = requestAnimationFrame(runGameLoop);
    } else {
      setIsPlaying(false);
      // alert or notification trigger
    }
  };

  // Safely stop background frames on dismount
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      AudioSynth.stop();
    };
  }, []);

  return (
    <div id="rhythm-arcade-container" className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8 animate-fadeIn">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-neutral-900 pb-5 gap-4">
        <div>
          <span className="px-2.5 py-0.5 text-[8px] font-mono font-black tracking-widest bg-purple-500/10 text-purple-400 rounded border border-purple-500/20 uppercase">
            Interactive Rythmical Studio Mini-Game
          </span>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter mt-1 flex items-center gap-2">
            <Flame className="w-8 h-8 text-[#39FF14] animate-pulse" />
            TYROX ACOUSTIC ARCADE
          </h1>
          <p className="text-xs text-neutral-400 font-mono mt-1 leading-relaxed">
            Directly test your timing alignment syncing with Tyrox's aggressive dark synthesizers & premium sub-bass loops. 
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Audio controller toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-950 text-[10px] font-mono text-neutral-400 hover:text-white transition active:scale-95 cursor-pointer"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[#39FF14]" />
                SOUND FX CHN 1
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-red-500" />
                MUTED FX
              </>
            )}
          </button>

          <div className="bg-neutral-950 border border-neutral-900 rounded-lg py-1 px-4 text-center">
            <span className="block text-[8px] font-mono text-neutral-500 uppercase">Personal Best Record</span>
            <span className="text-sm font-black font-mono text-[#39FF14]">{highScore.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* DASHBOARD GAME SPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: Controls, Instructions & Track Choices */}
        <div className="lg:col-span-4 space-y-5 flex flex-col justify-between">
          <div className="border border-neutral-900 bg-neutral-950/40 rounded-xl p-5 md:p-6 space-y-5 flex-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-60 h-60 bg-purple-600/5 rounded-full blur-[80px] pointer-events-none" />
            
            <h3 className="text-xs font-black uppercase text-neutral-400 tracking-wider flex items-center gap-1.5 border-b border-neutral-900 pb-2.5">
              <Music className="w-4 h-4 text-purple-400" />
              Select Target Composition
            </h3>

            {/* Scrollable Tracks Playlist selector */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {tracks.map(track => {
                const isChosen = selectedTrack?.id === track.id;
                return (
                  <button
                    key={track.id}
                    id={`track-arcade-select-${track.id}`}
                    disabled={isPlaying}
                    onClick={() => setSelectedTrack(track)}
                    className={`w-full text-left p-3 rounded-lg border flex items-center justify-between transition-all duration-150 ${
                      isChosen 
                        ? 'bg-neutral-900/85 border-[#39FF14]/40 shadow-[0_0_10px_rgba(57,255,20,0.08)]' 
                        : 'bg-neutral-950/60 border-neutral-900 hover:border-neutral-800 disabled:opacity-50'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <p className={`text-xs font-bold leading-none ${isChosen ? 'text-[#39FF14]' : 'text-neutral-100'}`}>
                        {track.title}
                      </p>
                      <p className="text-[10px] text-neutral-500 font-mono mt-1">
                        {track.bpm} BPM • Key: {track.key || 'Am'}
                      </p>
                    </div>
                    {isChosen && (
                      <span className="text-[9px] font-mono bg-[#39FF14]/10 text-[#39FF14] px-1.5 py-0.5 rounded font-black border border-[#39FF14]/20 animate-pulse">
                        READY
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Keyboard layout instructions */}
            <div className="border border-neutral-900 bg-black/60 rounded-lg p-3.5 space-y-2">
              <span className="text-[9px] font-black uppercase text-neutral-400 flex items-center gap-1 font-mono">
                <Keyboard className="w-3.5 h-3.5 text-[#39FF14]" />
                Verification Key Mapping
              </span>
              <p className="text-[10px] text-neutral-400 leading-relaxed font-sans">
                Position your left fingers on <b className="text-white">D</b> and <b className="text-white">F</b>, and your right fingers on <b className="text-white">J</b> and <b className="text-white">K</b>. Tap matching lane inputs precisely as notes cross the target hit row at the base.
              </p>
              
              <div className="grid grid-cols-4 gap-1.5 text-center pt-1">
                {['D', 'F', 'J', 'K'].map(k => (
                  <div key={k} className="p-1 px-1.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-black text-neutral-300 font-mono">
                    {k}
                  </div>
                ))}
              </div>
            </div>

            {/* Performance status card if completed */}
            {!isPlaying && metrics.perfectCount + metrics.goodCount + metrics.missCount > 0 && (
              <div className="border border-neutral-900/60 bg-purple-950/10 p-3 rounded-lg space-y-1.5">
                <span className="text-[8px] font-mono font-bold text-purple-400 uppercase tracking-widest block">Last Session Execution Resume</span>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="text-neutral-400">Score: <b className="text-white">{score}</b></div>
                  <div className="text-neutral-400">Perfects: <b className="text-[#39FF14]">{metrics.perfectCount}</b></div>
                  <div className="text-neutral-400">Goods: <b className="text-purple-300">{metrics.goodCount}</b></div>
                  <div className="text-neutral-400">Misses: <b className="text-red-400">{metrics.missCount}</b></div>
                  <div className="text-neutral-400 col-span-2">Max Pulse-Combo: <b className="text-[#39FF14]">{metrics.maxCombo}x</b></div>
                </div>
              </div>
            )}
          </div>

          {/* Action Trigger Drawer */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 flex gap-3">
            {isPlaying ? (
              <button
                id="btn-arcade-stop"
                onClick={stopGame}
                className="w-full py-3 rounded-lg bg-red-600/90 text-white font-mono font-black uppercase text-xs tracking-wider border border-red-500/20 shadow-red-500/10 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                ABORT SESSION
              </button>
            ) : (
              <button
                id="btn-arcade-start"
                disabled={!selectedTrack}
                onClick={startGame}
                className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-mono font-black uppercase text-xs tracking-wider transition duration-150 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(147,51,234,0.3)] disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-white" />
                START ARCADIA SESS
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: HIGH FIDELITY RHYTHM PLAYGROUND SURFACE */}
        <div className="lg:col-span-8 flex flex-col justify-between border border-neutral-900 bg-neutral-950 rounded-2xl md:p-6 p-4 relative min-h-[480px] lg:min-h-[580px] overflow-hidden">
          
          {/* Core HUD Panels overlaying the canvas */}
          <div className="flex items-center justify-between z-10">
            <div className="space-y-0.5">
              <span className="text-[8px] font-mono font-semibold tracking-wider text-neutral-400 block uppercase">Real-Time Performance Feed</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-white font-mono">{score.toLocaleString()}</span>
                {combo > 0 && (
                  <span className="text-xs px-2 py-0.5 font-black font-mono bg-purple-600 text-white rounded-full flex items-center gap-1 animate-bounce">
                    {combo}x combo
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[8px] font-mono text-neutral-500 uppercase block">Active Track Density</span>
              <span className="text-[10px] font-mono font-medium text-purple-400">
                {selectedTrack ? `${selectedTrack.bpm} BPM [LVL ${level}]` : 'Idle'}
              </span>
            </div>
          </div>

          {/* ACTIVE FALLING GAME BOARD CONTAINER */}
          <div className="flex-1 relative border border-neutral-900 border-x-0 my-4 bg-gradient-to-b from-neutral-950 via-neutral-950/90 to-[#0e0c15] rounded-lg overflow-hidden h-[340px] md:h-[420px]">
            
            {/* Visual background beat pulse visualization bar lines */}
            <div className="absolute inset-x-0 top-1/4 border-t border-neutral-900/30 border-dashed pointer-events-none" />
            <div className="absolute inset-x-0 top-2/4 border-t border-neutral-900/30 border-dashed pointer-events-none" />
            <div className="absolute inset-x-0 top-3/4 border-t border-neutral-900/30 border-dashed pointer-events-none" />

            {/* 4 Descending Track Lanes columns */}
            <div className="absolute inset-0 grid grid-cols-4 divide-x divide-neutral-900 pb-16">
              {[0, 1, 2, 3].map(index => {
                const laneKey = lanes[index].key;
                const active = activeKeys[laneKey];
                return (
                  <div 
                    key={index} 
                    className={`relative h-full transition-all duration-100 ${
                      active ? 'bg-gradient-to-t from-[#39FF14]/5 to-transparent' : 'from-transparent'
                    }`}
                  >
                    {/* Falling notes specific to this lane coordinate */}
                    {notesState
                      .filter(note => note.lane === index)
                      .map(note => {
                        if (note.hit) return null; // Hide already processed hits
                        return (
                          <div
                            key={note.id}
                            className={`absolute left-1/2 -translate-x-1/2 w-8 md:w-11 h-4 rounded-full border shadow-lg flex items-center justify-center transition-opacity duration-150 ${
                              index === 0 ? 'bg-cyan-500 border-cyan-400 shadow-cyan-500/40' :
                              index === 1 ? 'bg-purple-500 border-purple-400 shadow-purple-500/40' :
                              index === 2 ? 'bg-pink-500 border-pink-400 shadow-pink-500/40' :
                              'bg-emerald-500 border-[#39FF14] shadow-emerald-500/40'
                            }`}
                            style={{ 
                              top: `${note.y}%`,
                              transform: 'translate(-51%, -50%)',
                              filter: 'drop-shadow(0 0 4px currentColor)'
                            }}
                          >
                            <span className="text-[7px] font-black text-black">VV</span>
                          </div>
                        );
                      })}

                    {/* Laser lane line light indicators when key is actively pressed */}
                    {active && (
                      <div className="absolute inset-x-0 bottom-14 h-40 bg-gradient-to-t from-purple-500/10 to-transparent blur-sm pointer-events-none" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* CRITICAL TARGET DECISION LINE (positioned at y = 85% exactly) */}
            <div className="absolute left-0 right-0 top-[85%] -translate-y-1/2 h-0.5 border-t-2 border-dashed border-[#39FF14]/50 pointer-events-none flex justify-center items-center">
              <span className="bg-[#0e0c15] text-[7px] font-mono text-[#39FF14] px-2 py-0.2 tracking-widest font-black uppercase border border-[#39FF14]/30 rounded-full">
                HIT VERIFICATION ROW
              </span>
            </div>

            {/* Glowing active trigger circles matching the 4 key pads */}
            <div className="absolute inset-x-0 bottom-4 grid grid-cols-4 px-1 pointer-events-none">
              {lanes.map((lane, idx) => {
                const isActive = activeKeys[lane.key];
                return (
                  <div key={idx} className="flex flex-col items-center justify-center">
                    <div 
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center transition-all duration-75 ${
                        lane.color
                      } ${isActive ? 'scale-110 border-[#39FF14] ring-4 ring-[#39FF14]/15 bg-black' : 'scale-100 bg-neutral-950'}`}
                    >
                      <span className="font-mono text-xs font-black uppercase text-inherit">
                        {lane.key}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Instant Floating Hit Judgment text pops directly in core sandbox frame */}
            {lastRating && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="text-center animate-slideUp">
                  <h2 className={`text-4xl font-extrabold tracking-tighter ${ratingColor} text-shadow-glow uppercase filter drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]`}>
                    {lastRating}
                  </h2>
                  {combo > 1 && (
                    <p className="text-[10px] font-mono text-neutral-300 tracking-wider">
                      +{100 * combo} COMB-BOOM
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Simulated Game Not Started overlay frame */}
            {!isPlaying && (
              <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 z-20 space-y-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                  <Activity className="w-6 h-6 text-purple-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase">Arcade Sandbox Standby</h3>
                  <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                    {selectedTrack 
                      ? `Select a track, position your fingers on [D, F, J, K] and launch your session to test alignment coordinates on "${selectedTrack.title}".` 
                      : 'Choose your desired composition to initiate high speed alignment checks.'}
                  </p>
                </div>
                {selectedTrack && (
                  <button 
                    onClick={startGame}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 rounded text-[11px] font-mono font-bold uppercase transition duration-150 active:scale-95 text-white"
                  >
                    LAUNCH SESSION BEAT
                  </button>
                )}
              </div>
            )}
          </div>

          {/* BASE STATUS AND REPUTATION INDICATORS */}
          <div className="bg-neutral-950/40 p-4 rounded-xl border border-neutral-900/60 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#39FF14] animate-pulse" />
              <p className="text-[10px] font-mono text-neutral-400 leading-none">
                ALIGNMENT ENGINE LOG: <span className="text-white">CO-MAPPED WAVE DECAY 4.1.2 ACTIVE</span>
              </p>
            </div>

            <div className="flex gap-2">
              <div className="px-2 py-1 text-[8px] font-mono bg-neutral-900 border border-neutral-800 rounded text-neutral-400">
                LANE_D: <b className="text-cyan-400 font-bold">1/4 DIVISION</b>
              </div>
              <div className="px-2 py-1 text-[8px] font-mono bg-neutral-900 border border-neutral-800 rounded text-neutral-400">
                LANE_F: <b className="text-purple-400 font-bold">2/4 DIVISION</b>
              </div>
              <div className="px-2 py-1 text-[8px] font-mono bg-neutral-900 border border-neutral-800 rounded text-neutral-400">
                LANE_J: <b className="text-pink-400 font-bold">3/4 DIVISION</b>
              </div>
              <div className="px-2 py-1 text-[8px] font-mono bg-neutral-900 border border-neutral-800 rounded text-neutral-400">
                LANE_K: <b className="text-[#39FF14] font-bold">4/4 DIVISION</b>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
