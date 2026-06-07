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

      if (!isPlaying) {
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

      const analyser = AudioSynth.getAnalyser();
      if (!analyser) return;

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
      <div id="broadcastDeck" className="broadcast-deck opacity-80">
        <audio id="nativeAudioEngine" crossOrigin="anonymous" preload="auto" style={{ display: 'none' }} />
        
        <div className="now-playing-panel">
          <div className="w-[55px] h-[55px] bg-neutral-900 rounded-sm flex items-center justify-center border border-neutral-850">
            <Music size={16} className="text-neutral-700" />
          </div>
          <div className="deck-text-group">
            <span id="deckTrackTitle" className="text-neutral-550 font-sans font-bold text-xs uppercase">No Beat Loaded</span>
            <span id="deckProducerName" className="text-[10px] text-neutral-600 font-mono uppercase tracking-wider">Select a beat to stream</span>
          </div>
        </div>

        {/* Persistent Newsletter row when player is unactivated */}
        <div className="hidden lg:flex items-center gap-3 bg-[#08090d] border border-neutral-900/60 rounded px-3 py-1 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7] animate-pulse" />
          <form onSubmit={handleNewsletterSubmit} className="flex items-center gap-2">
            <input
              type="email"
              required
              placeholder="Join Mailing List"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              className="bg-transparent text-[10px] text-neutral-300 outline-none w-36 font-mono font-bold"
            />
            <button
              type="submit"
              className="px-2 py-0.5 bg-[#a855f7] hover:bg-[#c084fc] font-sans font-bold text-[9px] uppercase text-white rounded transition cursor-pointer"
            >
              Join
            </button>
          </form>
        </div>

        <div className="playback-controls-panel">
          <div className="button-row">
            <button id="deckPrevBtn" className="deck-nav-btn opacity-45 cursor-not-allowed" disabled>
              <SkipBack size={18} />
            </button>
            <button id="deckMasterPlayBtn" className="deck-core-toggle opacity-50 cursor-not-allowed" disabled>
              <Play size={16} fill="currentColor" className="ml-0.5" />
            </button>
            <button id="deckNextBtn" className="deck-nav-btn opacity-45 cursor-not-allowed" disabled>
              <SkipForward size={18} />
            </button>
          </div>
          <div className="timeline-row">
            <span id="timeCurrent" className="time-lbl">0:00</span>
            <div id="timelineRail" className="timeline-track-rail cursor-not-allowed">
              <div id="timelineFill" className="timeline-fill-bar" style={{ width: '0%' }} />
            </div>
            <span id="timeTotal" className="time-lbl">0:00</span>
          </div>
        </div>

        <div className="utility-panel" style={{ width: '25%', gap: '16px' }}>
          <div className="flex items-center gap-1.5 shrink-0">
            <Volume2 size={13} className="text-neutral-600" />
            <input 
              type="range"
              id="volumeSlider"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
            />
          </div>
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

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div id="broadcastDeck" className="broadcast-deck">
      {/* Underlying analytical stream engine node */}
      <audio id="nativeAudioEngine" crossOrigin="anonymous" preload="auto" style={{ display: 'none' }} />

      {/* Track Art & Metadata - Left Panel */}
      <div className="now-playing-panel">
        <img 
          id="deckArt" 
          src={currentTrack.imageUrl} 
          alt={currentTrack.title} 
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop';
          }}
        />
        <div className="deck-text-group">
          <span id="deckTrackTitle" className="truncate text-white font-bold max-w-[130px]">{currentTrack.title}</span>
          <span id="deckProducerName" className="truncate text-neutral-400 text-[10px]">by {currentTrack.producer || "Tyrox"}</span>
        </div>
      </div>

      {/* Persistent Newsletter row within active player too */}
      <div className="hidden lg:flex items-center gap-2 bg-[#08090d] border border-neutral-900/60 rounded px-2.5 py-1 text-xs">
        <form onSubmit={handleNewsletterSubmit} className="flex items-center gap-1.5">
          <input
            type="email"
            required
            placeholder="artist@example.com"
            value={newsletterEmail}
            onChange={(e) => setNewsletterEmail(e.target.value)}
            className="bg-transparent text-[8.5px] text-neutral-300 outline-none w-28 font-mono"
          />
          <button
            type="submit"
            className="px-2 py-0.5 bg-[#a855f7] hover:bg-[#c084fc] font-sans font-bold text-[8px] uppercase text-white rounded transition cursor-pointer"
          >
            {subscribedNewsletter ? "OK!" : "JOIN"}
          </button>
        </form>
      </div>

      {/* Central Interactive Timeline Transport - Middle Panel */}
      <div className="playback-controls-panel">
        <div className="button-row">
          <button 
            id="deckPrevBtn" 
            onClick={prevTrack} 
            className="deck-nav-btn text-neutral-400 hover:text-white transition"
            title="Previous Beat"
          >
            <SkipBack size={18} />
          </button>

          <button 
            id="deckMasterPlayBtn" 
            onClick={togglePlay} 
            className="deck-core-toggle"
            title={isPlaying ? "Pause Beat" : "Play Beat"}
          >
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
          </button>

          <button 
            id="deckNextBtn" 
            onClick={nextTrack} 
            className="deck-nav-btn text-neutral-400 hover:text-white transition"
            title="Next Beat"
          >
            <SkipForward size={18} />
          </button>
        </div>

        {/* Timeline Row with Rail and Live Progress Fill */}
        <div className="timeline-row">
          <span id="timeCurrent" className="time-lbl">{playbackTime}</span>
          <div 
            id="timelineRail" 
            className="timeline-track-rail"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));
              seekPlayer(ratio * duration);
            }}
          >
            <div 
              id="timelineFill" 
              className="timeline-fill-bar" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span id="timeTotal" className="time-lbl">{playbackDurationStr}</span>
        </div>
      </div>

      {/* Live Spectrum & Purchase/Volume Panel - Right Panel */}
      <div className="utility-panel" style={{ width: '25%', gap: '16px' }}>
        {/* Visualizer and Direct Buy Integration */}
        <div className="hidden lg:block w-24 h-6 relative shrink-0 border-r border-[#14141f] pr-3">
          <canvas 
            ref={canvasRef} 
            width={96} 
            height={24} 
            className="w-full h-full opacity-80"
          />
        </div>

        <button 
          onClick={() => onOpenLicenseModal(currentTrack)}
          style={{ padding: '6px 14px', fontSize: '10px' }}
          className="purchase-action-btn scale-90 hover:scale-100 transition whitespace-nowrap uppercase font-sans font-black shrink-0"
        >
          Buy Lease
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <button 
            onClick={handleMuteToggle}
            className="text-neutral-450 hover:text-white transition cursor-pointer p-1"
          >
            {isMuted || volume === 0 ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={13} />}
          </button>
          <input 
            type="range"
            id="volumeSlider"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => {
              const nv = parseFloat(e.target.value);
              setVolume(nv);
              setIsMuted(nv === 0);
            }}
          />
        </div>
      </div>
    </div>
  );
};
