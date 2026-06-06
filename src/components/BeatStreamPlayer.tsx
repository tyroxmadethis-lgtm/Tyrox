import React, { useState, useRef } from 'react';

interface BeatStreamPlayerProps {
  trackTitle: string;
  previewUrl: string;
  trackPrice: string;
}

export default function BeatStreamPlayer({ trackTitle, previewUrl, trackPrice }: BeatStreamPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleStreamPlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((error) => {
          console.warn("Media playback adjustment:", error);
          // Ensure ui toggles cleanly even if browser gesture policies delay initial auto-play trigger
          setIsPlaying(true);
        });
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 24px',
      background: '#0d0d0f',
      border: '1px solid #1a1a1f',
      borderRadius: '8px',
      marginBottom: '12px',
      width: '100%'
    }}>
      {/* Native Browser Audio Framework */}
      <audio 
        ref={audioRef} 
        src={previewUrl} 
        onEnded={() => setIsPlaying(false)}
        preload="none" 
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={toggleStreamPlayback}
          style={{
            background: '#39FF14', // Neon green brand accent
            color: '#000',
            border: 'none',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontWeight: '900',
            fontSize: '1.1rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <div>
          <span style={{ fontWeight: '700', color: '#fff', fontSize: '1rem' }}>{trackTitle}</span>
        </div>
      </div>

      <button style={{
        background: 'transparent',
        color: '#39FF14',
        border: '1px solid #39FF14',
        padding: '10px 20px',
        fontWeight: '700',
        borderRadius: '4px',
        cursor: 'pointer',
        textTransform: 'uppercase',
        fontSize: '0.85rem'
      }}>
        Buy {trackPrice}
      </button>
    </div>
  );
}
