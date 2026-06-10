/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioSynthService {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private currentTrackId: string | null = null;
  
  // Audio schedule nodes
  private timerId: any = null;
  private nextNoteTime = 0.0;
  private beat = 0;
  private bpm = 120;
  private key = 'Am';
  private masterVolume: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  // HTML5 audio elements for lossless file streaming
  private player: HTMLAudioElement | null = null;
  private activeObjectUrl: string | null = null;
  private isStreamingMode = false;
  private mediaSource: MediaElementAudioSourceNode | null = null;
  
  // Client callbacks
  private onTimeUpdateCallback: ((time: number, duration: number) => void) | null = null;
  private onStateChangeCallback: ((playing: boolean) => void) | null = null;
  
  // Playback timer (virtual progress in seconds)
  private trackStartTime = 0;
  private elapsedSuspendedTime = 0;
  private virtualDuration = 180; // 3 minutes standard
  private playbackIntervalId: any = null;

  constructor() {
    // Lazy loaded context to satisfy browser policies
  }

  private init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    try {
      this.ctx = new AudioContextClass();
      
      // Setup nodes if context was created successfully
      if (this.ctx) {
        this.masterVolume = this.ctx.createGain();
        this.masterVolume.gain.setValueAtTime(0.4, this.ctx.currentTime); // default to 40% volume

        this.analyserNode = this.ctx.createAnalyser();
        this.analyserNode.fftSize = 128;
        
        // Connect nodes
        this.masterVolume.connect(this.analyserNode);
        this.analyserNode.connect(this.ctx.destination);
      }
    } catch (e) {
      console.warn("AudioContext setup blocked or unsupported in this sandboxed environment:", e);
      this.ctx = null;
    }
  }

  public setCallbacks(
    onTimeUpdate: (time: number, duration: number) => void,
    onStateChange: (playing: boolean) => void
  ) {
    this.onTimeUpdateCallback = onTimeUpdate;
    this.onStateChangeCallback = onStateChange;
  }

  public getAnalyser(): AnalyserNode | null {
    this.init();
    return this.analyserNode;
  }

  public setVolume(value: number) {
    this.init();
    if (this.masterVolume && this.ctx) {
      this.masterVolume.gain.setValueAtTime(value, this.ctx.currentTime);
    }
  }

  public async play(trackId: string, bpm = 120, key = 'Am', audioUrl?: string) {
    this.init();
    if (!this.ctx) return;
    
    // Resume context if suspended
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isPlaying && this.currentTrackId === trackId) {
      // Already playing this track
      return;
    }

    if (this.isPlaying) {
      this.stop();
    }

    this.isPlaying = true;
    this.currentTrackId = trackId;
    this.bpm = bpm;
    this.key = key;
    this.beat = 0;
    this.nextNoteTime = this.ctx.currentTime;
    
    this.trackStartTime = this.ctx.currentTime;
    this.elapsedSuspendedTime = 0;

    // Check if we should attempt to stream the track from `/api/stream-beat/${trackId}`
    this.isStreamingMode = false;

    // Build/retrieve programmatic HTML5 Audio Player
    if (!this.player) {
      this.player = (document.getElementById('nativeAudioEngine') || document.getElementById('coreEnginePlayer')) as HTMLAudioElement;
      if (!this.player) {
        this.player = document.createElement('audio');
        this.player.id = 'nativeAudioEngine';
        this.player.crossOrigin = 'anonymous';
        this.player.preload = 'auto';
        document.body.appendChild(this.player);
      }
      
      // Connect programmatic HTML audio player to our existing global analyserNode!
      try {
        this.mediaSource = this.ctx.createMediaElementSource(this.player);
        this.mediaSource.connect(this.masterVolume!);
      } catch (e) {
        console.warn("createMediaElementSource connect warning (benign):", e);
      }

      // Sync player events
      this.player.onended = () => {
        this.stop();
        if (this.onTimeUpdateCallback) {
          this.onTimeUpdateCallback(0, this.virtualDuration);
        }
      };

      this.player.ontimeupdate = () => {
        if (this.isStreamingMode && this.player) {
          const current = this.player.currentTime;
          const dur = this.player.duration || this.virtualDuration;
          if (this.onTimeUpdateCallback) {
            this.onTimeUpdateCallback(current, dur);
          }
        }
      };
    }

    // Clean up older object URLs
    if (this.activeObjectUrl) {
      URL.revokeObjectURL(this.activeObjectUrl);
      this.activeObjectUrl = null;
    }

    // Setup streaming trigger indicator
    const playBtn = document.getElementById('playTrigger');
    if (playBtn) {
      playBtn.innerText = "Streaming pure lossless assets...";
      playBtn.style.setProperty("background", "#ff9f43", "important");
    }

    try {
      if (audioUrl) {
        console.log(`Streaming directly from custom URL: ${audioUrl}`);
        this.player.src = audioUrl;
        this.player.load();
        this.isStreamingMode = true;
        await this.player.play();
      } else {
        console.log(`Initiating stream transfer for track ID: ${trackId}`);
        const streamResponse = await fetch(`/api/stream-beat/${trackId}`);
        if (!streamResponse.ok) {
          throw new Error("Target audio file path corrupted or offline.");
        }

        const rawAudioBlob = await streamResponse.blob();
        this.activeObjectUrl = URL.createObjectURL(rawAudioBlob);

        this.player.src = this.activeObjectUrl;
        this.player.load();
        this.isStreamingMode = true;

        await this.player.play();
      }

      if (playBtn) {
        playBtn.innerText = "Playing Pristine Beat";
        playBtn.style.setProperty("background", "#2ed573", "important");
      }
      
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback(true);
      }
    } catch (error) {
      console.warn("High fidelity streaming handler fell back to procedure synth engine:", error);
      if (playBtn) {
        playBtn.innerText = "Stream offline - Fallback Active";
        playBtn.style.setProperty("background", "#ff4757", "important");
      }

      this.isStreamingMode = false;
      if (this.player) {
        this.player.pause();
        this.player.src = "";
      }

      // Procedural synthesizer fallback mode
      this.isPlaying = true;
      this.scheduler();
      this.startVirtualTimer();

      if (this.onStateChangeCallback) {
        this.onStateChangeCallback(true);
      }
    }
  }

  public pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    
    if (this.isStreamingMode && this.player) {
      this.player.pause();
    } else if (this.ctx) {
      this.elapsedSuspendedTime += (this.ctx.currentTime - this.trackStartTime);
      if (this.ctx.state === 'running') {
        this.ctx.suspend();
      }
    }

    if (this.timerId) clearTimeout(this.timerId);
    if (this.playbackIntervalId) clearInterval(this.playbackIntervalId);

    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(false);
    }
  }

  public resume() {
    if (this.isPlaying) return;
    if (!this.ctx || !this.currentTrackId) return;

    this.isPlaying = true;
    
    if (this.isStreamingMode && this.player) {
      this.player.play().catch(e => console.warn(e));
    } else {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.trackStartTime = this.ctx.currentTime;
      this.nextNoteTime = this.ctx.currentTime;
      this.scheduler();
      this.startVirtualTimer();
    }

    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(true);
    }
  }

  public stop() {
    this.isPlaying = false;
    this.currentTrackId = null;
    
    if (this.player) {
      this.player.pause();
      this.player.src = "";
    }
    this.isStreamingMode = false;

    if (this.activeObjectUrl) {
      URL.revokeObjectURL(this.activeObjectUrl);
      this.activeObjectUrl = null;
    }
    
    if (this.timerId) clearTimeout(this.timerId);
    if (this.playbackIntervalId) clearInterval(this.playbackIntervalId);
    
    this.elapsedSuspendedTime = 0;

    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(false);
    }
  }

  public getCurrentTime(): number {
    if (this.isStreamingMode && this.player) {
      return this.player.currentTime;
    }
    if (!this.ctx || !this.isPlaying) {
      return this.elapsedSuspendedTime;
    }
    return this.elapsedSuspendedTime + (this.ctx.currentTime - this.trackStartTime);
  }

  public seek(seconds: number) {
    if (this.isStreamingMode && this.player) {
      this.player.currentTime = seconds;
    } else {
      if (!this.ctx) return;
      this.elapsedSuspendedTime = seconds;
      this.trackStartTime = this.ctx.currentTime;
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(seconds, this.virtualDuration);
      }
    }
  }

  private startVirtualTimer() {
    if (this.playbackIntervalId) clearInterval(this.playbackIntervalId);
    
    this.playbackIntervalId = setInterval(() => {
      if (!this.isPlaying) return;
      const current = this.getCurrentTime();
      if (current >= this.virtualDuration) {
        this.stop();
        if (this.onTimeUpdateCallback) {
          this.onTimeUpdateCallback(0, this.virtualDuration);
        }
      } else {
        if (this.onTimeUpdateCallback) {
          this.onTimeUpdateCallback(current, this.virtualDuration);
        }
      }
    }, 250);
  }

  // Scheduler loops
  private scheduler() {
    if (!this.isPlaying || !this.ctx) return;
    
    const scheduleAheadTime = 0.1; // schedule 100ms in advance
    const lookahead = 25.0; // call scheduler every 25ms

    while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
      this.scheduleNote(this.beat, this.nextNoteTime);
      this.advanceNote();
    }
    
    this.timerId = setTimeout(() => this.scheduler(), lookahead);
  }

  private advanceNote() {
    const secondsPerBeat = 60.0 / this.bpm;
    const eighthNoteTime = 0.25 * secondsPerBeat; // 16th note division
    this.nextNoteTime += eighthNoteTime;
    this.beat = (this.beat + 1) % 16;
  }

  // Musical notes mapper for Key chord progressions
  // Returns MIDI frequency
  private getChordFreqs(key: string, measure: number): number[] {
    // Simple 4-chord progression based on requested track key
    // i - VI - III - VII standard chord progression
    const rootMap: { [key: string]: number } = {
      'C': 261.63, 'Cm': 261.63,
      'Am': 220.00, 'A': 220.00,
      'Fm': 174.61, 'F': 174.61,
      'G': 196.00, 'Gm': 196.00,
      'Dm': 293.66, 'Em': 329.63,
    };

    const baseFreq = rootMap[key] || 220.00; // Am default
    const progressionMultiplier = [1.0, 0.8, 1.2, 0.9]; // i, VI, III, VII offsets
    const scaleMultiplier = progressionMultiplier[measure % 4];
    
    const root = baseFreq * scaleMultiplier;
    // Build minor or major chord triads
    const isMinor = key.includes('m');
    const thirdMult = isMinor ? 1.2 : 1.25; // Minor third (3:2.5 ratio or minor factor) vs Major third
    const fifthMult = 1.5; // Perfect fifth

    return [root, root * thirdMult, root * fifthMult, root * 2.0];
  }

  private scheduleNote(beat: number, time: number) {
    if (!this.ctx || !this.masterVolume) return;

    const measure = Math.floor(this.beat / 16);
    const step = beat % 16; // 0 to 15 (16th notes)

    // --- SYNTH KICK DRUM (rhythm: beats 0, 4, 8, 12) ---
    if (step % 4 === 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.connect(gain);
      gain.connect(this.masterVolume);

      // Low pitch drum sweep
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.3);

      gain.gain.setValueAtTime(0.8, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

      osc.type = 'sine';
      osc.start(time);
      osc.stop(time + 0.3);
    }

    // --- HI-HAT (rhythm: beats 2, 6, 10, 14, and some offbeats) ---
    const hasHihat = (step % 2 === 0) || (step % 3 === 0 && Math.random() > 0.4);
    if (hasHihat && step % 4 !== 0) {
      // Noise buffer for hihat metallic sound
      const bufferSize = this.ctx.sampleRate * 0.05; // 50ms pulse
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      // Bandpass Filter to make hihat realistic (hissing)
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(8000, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterVolume);

      noise.start(time);
      noise.stop(time + 0.05);
    }

    // --- MELODY SYNTH (rhythm matches key chords) ---
    // Make a rolling arp pluck on steps 0, 3, 6, 8, 11, 14
    const arpSteps = [0, 3, 6, 8, 11, 14];
    if (arpSteps.includes(step)) {
      const chordFreqs = this.getChordFreqs(this.key, measure);
      // Select note from triad chord based on step index to make an arpeggio!
      const noteIdx = arpSteps.indexOf(step) % chordFreqs.length;
      const freq = chordFreqs[noteIdx];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterVolume);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);
      
      // Fun pitch vibrato or slide
      if (step === 8) {
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, time + 0.15);
      }

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, time);
      filter.frequency.exponentialRampToValueAtTime(100, time + 0.2);

      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

      osc.start(time);
      osc.stop(time + 0.3);
    }

    // --- LOW BASS SYNTH (rhythm: sustained drone on root note) ---
    if (step === 0 || step === 8) {
      const chordFreqs = this.getChordFreqs(this.key, measure);
      const rootFreq = chordFreqs[0] / 2; // Drop an octave for deep sub-bass

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.connect(gain);
      gain.connect(this.masterVolume);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(rootFreq, time);

      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.7);

      osc.start(time);
      osc.stop(time + 0.8);
    }

    // --- TRONVICIOUS EXCLUSIVE PROMO VOICE AUDIO TAG ("Purchase your tracks today...") ---
    // Every 32 beats (about every 15 seconds) generate a robotic computer sweep saying "VIBE VAULT" 
    // to simulate a professional watermarked beat store demo track!
    if (step === 0 && measure % 2 === 0 && measure > 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.masterVolume);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, time);
      osc.frequency.setValueAtTime(880, time + 0.15);
      osc.frequency.setValueAtTime(1200, time + 0.3);

      gain.gain.setValueAtTime(0.0, time);
      gain.gain.linearRampToValueAtTime(0.15, time + 0.05);
      gain.gain.setValueAtTime(0.15, time + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

      osc.start(time);
      osc.stop(time + 0.5);
    }
  }
}

export const AudioSynth = new AudioSynthService();
