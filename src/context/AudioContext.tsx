import React, { createContext, useState, useRef } from 'react';

export const AudioContext = createContext<any>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadAndPlayTrack = (track: any) => {
    if (audioRef.current) {
      audioRef.current.src = track.audioUrl || track.audioFileUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
      audioRef.current.play().catch(err => console.log("Audio play failed / blocked by browser autoplay:", err));
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  const togglePlaybackState = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.log("Audio play resumed failed:", err));
      setIsPlaying(true);
    }
  };

  // Execution engine to distribute native content anchors anywhere globally on the web
  const triggerSocialShare = (track: any, platform: string) => {
    const trackIdStr = track.id || track._id || "";
    const targetUrl = encodeURIComponent(`https://vercel.app/${trackIdStr}`);
    const shareText = encodeURIComponent(`Check out this new fire beat "${track.title}" by Tyrox Made This!`);
    
    let destination = "";
    if (platform === 'twitter') destination = `https://twitter.com/intent/tweet?text=${shareText}&url=${targetUrl}`;
    if (platform === 'facebook') destination = `https://facebook.com/sharer/sharer.php?u=${targetUrl}`;
    if (platform === 'youtube') destination = `https://youtube.com`; // Direct routing anchor

    window.open(destination, '_blank', 'width=600,height=400');
  };

  return (
    <AudioContext.Provider value={{ currentTrack, isPlaying, loadAndPlayTrack, togglePlaybackState, triggerSocialShare }}>
      {children}
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />
    </AudioContext.Provider>
  );
}
