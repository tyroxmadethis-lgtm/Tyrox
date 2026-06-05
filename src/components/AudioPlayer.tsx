/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { AudioSynth } from '../services/audioSynth';
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, 
  ShoppingCart, Sliders, Music, Disc, RefreshCw, Check,
  Mail
} from 'lucide-react';

interface AudioPlayerProps {
  onOpenLicenseModal: (track: any) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ onOpenLicenseModal }) => {
  const {
    currentTrack,
    isPlaying,
    volume,
    progress,
    duration,
    playbackTime,
    playbackDurationStr,
    togglePlay,
    setVolume,
    seekPlayer,
    nextTrack,
    prevTrack,
  } = useStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [hoverProgressPercent, setHoverProgressPercent] = useState<number | null>(null);
  const waveformContainerRef = useRef<HTMLDivElement | null>(null);

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribedNewsletter, setSubscribedNewsletter] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes('@')) {
      alert("Please enter a valid email address.");
      return;
    }

    // Persist email in local storage list
    const existing = JSON.parse(localStorage.getItem('vv_newsletter_subscribers') || '[]');
    if (!existing.includes(newsletterEmail)) {
      existing.push(newsletterEmail);
      localStorage.setItem('vv_newsletter_subscribers', JSON.stringify(existing));
    }

    setSubscribedNewsletter(true);
    alert(`Thank you! Email "${newsletterEmail}" is successfully added to our mailing list.`);
    setNewsletterEmail('');
    setTimeout(() => {
      setSubscribedNewsletter(false);
    }, 4000);
  };

  // Generate a premium organic pseudo-waveform based on track variables
  const barCount = 100;
  const getWaveformHeights = (trackId: string): number[] => {
    const heights: number[] = [];
    let seed = 0;
    for (let i = 0; i < trackId.length; i++) {
      seed += trackId.charCodeAt(i);
    }
    for (let i = 0; i < barCount; i++) {
      // Harmonic combination of sines to look like a real audio snapshot
      const waveVal = Math.abs(
        Math.sin(i * 0.12) * 0.4 + 
        Math.sin(i * 0.05 + seed) * 0.35 + 
        Math.cos(i * 0.28) * 0.15 + 
        0.1
      );
      // Give it standard shape envelope (fade in, fade out)
      const envelope = Math.sin((i / barCount) * Math.PI);
      const finalVal = Math.max(12, Math.round(waveVal * envelope * 88));
      heights.push(finalVal);
    }
    return heights;
  };

  const currentWaveformHeights = currentTrack ? getWaveformHeights(currentTrack.id) : [];

  // Live frequency visualizer
  useEffect(() => {
    let active = true;

    const drawVisuals = () => {
      if (!active) return;
      animationRef.current = requestAnimationFrame(drawVisuals);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const analyser = AudioSynth.getAnalyser();
      if (!analyser || !isPlaying) {
        // Draw idle passive ambient wave on the side
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(0, 255, 204, 0.18)'; // transparent neon green
        ctx.beginPath();
        const sliceWidth = width / 40;
        let x = 0;
        for (let i = 0; i < 40; i++) {
          const y = (height / 2) + Math.sin(i * 0.35 + Date.now() * 0.003) * 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();
        return;
      }

      // Read live analytical frequency data
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      // Draw high-density mini visualizer
      const barWidth = (width / bufferLength) * 1.6;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height * 0.85;

        // Color mapped to violet to purple
        ctx.fillStyle = `rgba(168, 85, 247, ${0.4 + (i / bufferLength) * 0.5})`;
        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
        
        x += barWidth;
      }
    };

    drawVisuals();

    return () => {
      active = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  if (!currentTrack) {
    return (
      <div id="audio-player-idle" className="fixed bottom-0 left-0 right-0 h-22 bg-[#050608]/95 border-t border-neutral-900 px-6 flex items-center justify-between text-neutral-500 text-xs backdrop-blur-md z-40 select-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neutral-900 rounded-md flex items-center justify-center border border-neutral-850">
            <Music size={14} className="text-neutral-700" />
          </div>
          <div>
            <p className="font-sans font-bold text-neutral-400 uppercase tracking-wider text-[10px]">No Track Loaded</p>
            <p className="font-mono text-[9px] text-[#555]">Select a premium beat to activate the stream player</p>
          </div>
        </div>

        {/* Mailing list in idle player too */}
        <div className="hidden sm:flex items-center gap-3">
          <form onSubmit={handleNewsletterSubmit} className="flex items-center gap-2 bg-[#090a12]/80 border border-neutral-850 px-3 py-1.5 rounded-lg">
            <Mail size={13} className="text-purple-400" />
            <input
              type="email"
              required
              placeholder="Join Mailing List"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              className="bg-transparent text-[10px] text-neutral-200 outline-none w-36 md:w-48 font-mono placeholder:text-neutral-600"
            />
            <button
              type="submit"
              className="px-2 py-0.5 bg-purple-600 hover:bg-purple-500 font-sans font-bold text-[9px] uppercase tracking-wider text-white rounded transition active:scale-95 cursor-pointer"
            >
              Subscribe
            </button>
          </form>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={togglePlay} className="p-3 bg-neutral-900 text-neutral-500 hover:text-white rounded-full border border-neutral-850 transition">
            <Play size={15} />
          </button>
        </div>
      </div>
    );
  }

  const handleMuteToggle = () => {
    if (isMuted) {
      setVolume(prevVolume);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = waveformContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
    seekPlayer(clickRatio * duration);
  };

  const handleWaveformMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = waveformContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, hoverX / rect.width));
    setHoverProgressPercent(ratio * 100);
  };

  const handleWaveformMouseLeave = () => {
    setHoverProgressPercent(null);
  };

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div id="audio-player-active" className="fixed bottom-0 left-0 right-0 bg-[#050608]/95 border-t border-neutral-900/40 p-3 md:p-4 flex flex-col gap-3 shadow-[0_-20px_40px_rgba(0,0,0,0.85)] z-40 select-none backdrop-blur-xl">
      
      {/* 1. MASTER PERSISTENT WAVEFORM PROGRESS TIMELINE */}
      <div className="w-full flex items-center gap-4">
        {/* Playback time readout - left */}
        <span className="font-mono text-[10px] text-purple-400 font-bold w-10 text-right shrink-0">{playbackTime}</span>
        
        {/* WAVEFORM GRID BOX */}
        <div 
          ref={waveformContainerRef}
          onClick={handleWaveformClick}
          onMouseMove={handleWaveformMouseMove}
          onMouseLeave={handleWaveformMouseLeave}
          className="flex-1 h-12 flex items-end justify-between gap-[2.5px] cursor-pointer relative group px-1"
        >
          {currentWaveformHeights.map((barHeight, idx) => {
            const barPercent = (idx / barCount) * 100;
            // Determine if this bar of the waveform is played, hovered, or unplayed
            const isPlayed = barPercent <= progressPercent;
            const isHovered = hoverProgressPercent !== null && barPercent <= hoverProgressPercent;
            
            let colorClass = 'bg-[#15161e]'; // Default unplayed color
            if (isPlayed) {
              colorClass = 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]';
            } else if (isHovered) {
              colorClass = 'bg-purple-500/40';
            }

            return (
              <div 
                key={idx}
                style={{ height: `${barHeight}%` }}
                className={`w-[4.2px] rounded-full transition-all duration-150 ${colorClass}`}
              />
            );
          })}

          {/* Hover timing tool tip popup overlay */}
          {hoverProgressPercent !== null && duration > 0 && (
            <div 
              style={{ left: `${hoverProgressPercent}%` }}
              className="absolute -top-7 transform -translate-x-1/2 bg-neutral-950 border border-neutral-800 text-[8px] font-mono text-neutral-300 px-2 py-0.5 rounded shadow pointer-events-none"
            >
              {Math.floor(((hoverProgressPercent / 100) * duration) / 60)}:
              {String(Math.floor(((hoverProgressPercent / 100) * duration) % 60)).padStart(2, '0')}
            </div>
          )}
        </div>

        {/* Master duration readout - right */}
        <span className="font-mono text-[10px] text-neutral-400 w-10 shrink-0">{playbackDurationStr}</span>
      </div>

      {/* PERSISTENT MAILING LIST SIGNUP ROW WITHIN PLAYER */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-1.5 px-3 py-1.5 bg-[#08090d] border border-neutral-900/60 rounded-lg text-xs font-mono animate-fadeIn">
        <div className="flex items-center gap-1.5 text-neutral-400">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
          <span className="uppercase font-bold text-[10px] tracking-wider text-neutral-300">Join Mailing List</span>
          <span className="text-neutral-500 hidden lg:inline">// Get free files & producer deals instantly</span>
        </div>
        <form onSubmit={handleNewsletterSubmit} className="flex items-center gap-2 bg-[#040406] border border-neutral-850 px-2 py-0.5 rounded w-full md:w-auto max-w-sm shrink-0">
          <input
            type="email"
            required
            placeholder="artist@example.com"
            value={newsletterEmail}
            onChange={(e) => setNewsletterEmail(e.target.value)}
            className="bg-transparent text-[10px] text-neutral-200 outline-none w-full md:w-44 font-mono px-1 py-0.5 placeholder:text-neutral-600"
          />
          <button
            type="submit"
            className="px-2.5 py-0.5 bg-purple-600 hover:bg-purple-500 font-sans font-bold text-[9px] uppercase tracking-wider text-white rounded transition active:scale-95 cursor-pointer shrink-0"
          >
            {subscribedNewsletter ? "Joined!" : "SUBSCRIBE"}
          </button>
        </form>
      </div>

      {/* 2. AUDIO PLAYER CONTROLS & META GRID BOX */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 w-full border-t border-neutral-900/40 pt-3">
        
        {/* Track Title / Metadata Thumbnail - Left */}
        <div className="flex items-center gap-3 w-full md:w-1/3 min-w-[200px]">
          <div className="relative overflow-hidden w-11 h-11 rounded-lg border border-neutral-800 flex-shrink-0 bg-neutral-950">
            <img 
              src={currentTrack.imageUrl} 
              alt={currentTrack.title} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/60 to-transparent pointer-events-none" />
          </div>
          <div className="truncate pr-4 leading-tight">
            <div className="flex items-center gap-2">
              <h4 className="font-sans font-black text-xs text-white uppercase tracking-tight truncate">
                {currentTrack.title}
              </h4>
            </div>
            <div className="flex items-center gap-1.5 mt-1 font-mono text-[10px]">
              <span className="text-neutral-500 font-bold truncate uppercase">{currentTrack.bpm} BPM</span>
            </div>
          </div>
        </div>

        {/* Central Transport Controls Bar - Center */}
        <div className="flex items-center gap-5 justify-center w-full md:w-1/3 shrink-0">
          <button 
            onClick={prevTrack} 
            className="text-neutral-500 hover:text-white transition duration-150 cursor-pointer p-1"
            title="Previous Track"
          >
            <SkipBack size={15} />
          </button>

          <button 
            onClick={togglePlay} 
            className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full transition transform active:scale-95 shadow-[0_4px_16px_rgba(168,85,247,0.18)] cursor-pointer"
            title={isPlaying ? "Pause Preview" : "Play Preview"}
          >
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
          </button>

          <button 
            onClick={nextTrack} 
            className="text-neutral-500 hover:text-white transition duration-150 cursor-pointer p-1"
            title="Next Track"
          >
            <SkipForward size={15} />
          </button>
        </div>

        {/* Live FFT visualizer, Volume Control and Buy - Right */}
        <div className="flex items-center justify-end gap-5 w-full md:w-1/3">
          
          {/* Audio FFT canvas stream drawing */}
          <div className="hidden lg:block w-32 h-6 relative shrink-0 border-r border-neutral-900/40 pr-3">
            <canvas 
              ref={canvasRef} 
              width={128} 
              height={24} 
              className="w-full h-full opacity-90"
              title="FFT Audio Signal Spectrum"
            />
          </div>

          {/* Volume slider control */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button 
              onClick={handleMuteToggle}
              className="text-neutral-400 hover:text-white transition cursor-pointer p-1"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} />}
            </button>
            <input 
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => {
                const nv = parseFloat(e.target.value);
                setVolume(nv);
                setIsMuted(nv === 0);
              }}
              className="w-14 accent-purple-500 cursor-pointer bg-neutral-900 rounded-lg h-1 scale-y-100"
            />
          </div>

          {/* Direct Buy prompt from persistent bar */}
          <button 
            onClick={() => onOpenLicenseModal(currentTrack)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-black text-[10px] rounded shadow-md shadow-purple-500/10 transition active:scale-95 cursor-pointer leading-tight uppercase tracking-wider"
          >
            BUY ${(currentTrack.price !== undefined ? currentTrack.price : currentTrack.prices?.mp3 || 29.99).toFixed(2)}
          </button>
        </div>

      </div>
    </div>
  );
};
