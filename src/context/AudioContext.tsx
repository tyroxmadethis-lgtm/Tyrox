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

  // Expose playUploadedBeat globally to support automatic test drivers and pipeline executors
  React.useEffect(() => {
    (window as any).playUploadedBeat = (trackData: any) => {
      const audioPlayer = document.getElementById('global-stream-player') as HTMLAudioElement;
      if (audioPlayer) {
        if (trackData && trackData.wavPath) {
          audioPlayer.src = trackData.wavPath;
          audioPlayer.load();
          audioPlayer.play()
            .then(() => {
              console.log("Beat playback started successfully.");
              setIsPlaying(true);
            })
            .catch(err => {
              console.error("Playback interrupted or file missing:", err);
              alert("Audio file could not be played. Check server processing logs.");
            });
        } else {
          console.error("Invalid track object. Audio target missing.");
        }
      }
    };
  }, []);

  return (
    <AudioContext.Provider value={{ currentTrack, isPlaying, loadAndPlayTrack, togglePlaybackState, triggerSocialShare }}>
      {children}
      <audio id="global-stream-player" ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />
    </AudioContext.Provider>
  );

}
