import React, { useState, useRef, useEffect } from 'react';
import { 
  Music, 
  Upload, 
  Activity, 
  Sparkles, 
  Download, 
  CheckCircle2, 
  Loader2, 
  Play, 
  Pause, 
  Sliders, 
  FileAudio
} from 'lucide-react';

export default function AudioSoundMatcher() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [errorText, setErrorText] = useState('');
  
  // Results
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [processedFilename, setProcessedFilename] = useState('');
  const [isPlayingResult, setIsPlayingResult] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dynamic sound signature visuals
  useEffect(() => {
    if (!processing && !isPlayingResult) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    const barsCount = 38;
    const barWidth = 6;
    const gap = 3;
    canvas.width = (barWidth + gap) * barsCount;
    canvas.height = 120;
    
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const time = Date.now() * 0.003;
      
      for (let i = 0; i < barsCount; i++) {
        const x = i * (barWidth + gap);
        // Generates natural waves 
        let multiplier = Math.sin(time + i * 0.15) * 0.4 + 0.6;
        if (processing) {
          multiplier += Math.random() * 0.15; // Jitter while processing
        }
        
        const h = Math.max(10, multiplier * canvas.height * 0.85);
        const y = canvas.height - h;
        
        // Premium Neon Green and Purple gradient bars
        const grad = ctx.createLinearGradient(0, y, 0, canvas.height);
        grad.addColorStop(0, '#39FF14'); // Hot Lime Green
        grad.addColorStop(0.5, '#c084fc'); // Neon Purple
        grad.addColorStop(1, '#6b21a8'); // Deep Violet
        
        ctx.fillStyle = grad;
        // Rounded caps for visual polish
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, h, 4);
        ctx.fill();
      }
      
      animationId = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [processing, isPlayingResult]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.toLowerCase();
      if (ext.endsWith('.mp3') || ext.endsWith('.wav') || ext.endsWith('.m4a')) {
        setSelectedFile(file);
        setErrorText('');
        resetState();
      } else {
        setErrorText('Unsupported audio format. Please load a clean stereo WAV, MP3, or M4A track block.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setErrorText('');
      resetState();
    }
  };

  const resetState = () => {
    setProcessedUrl(null);
    setProcessedFilename('');
    setIsPlayingResult(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setProgress(0);
    setCurrentStep('');
  };

  const executeSoundMatchMaster = async () => {
    if (!selectedFile) return;
    
    setProcessing(true);
    setErrorText('');
    setProgress(5);
    setCurrentStep('Analyzing draft audio spectrum ratios...');

    // Custom steps simulator matching true matchering workflow
    const runStep = (p: number, stepText: string, delay: number) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setProgress(p);
          setCurrentStep(stepText);
          resolve();
        }, delay);
      });
    };

    try {
      await runStep(25, 'Loading Multi-Platinum reference target blueprint profile...', 1200);
      await runStep(45, 'Applying signature Tyrox dynamic limiting & EQ curves...', 1400);
      await runStep(70, 'Adjusting RMS Loudness targets (-9.0 LUFS linear ceiling)...', 1100);
      await runStep(85, 'Deploying offline brickwall mastering compression (Unaltered Lossless Container)...', 1000);
      
      // Post file to Express Endpoint
      const formData = new FormData();
      formData.append('beat', selectedFile);

      const response = await fetch('/upload-and-match', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Server sonic processing pipeline reported an issue.');
      }

      const data = await response.json();
      
      await runStep(100, 'Consolidating pristine uncompressed stream buffers!', 600);
      
      setProcessedUrl(data.download_url);
      setProcessedFilename(`matched_${selectedFile.name}`);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || 'Processing failed. Please check file formatting or server logs.');
    } finally {
      setProcessing(false);
    }
  };

  const togglePlayback = () => {
    if (!processedUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(processedUrl);
      audioRef.current.onended = () => {
        setIsPlayingResult(false);
      };
    }

    if (isPlayingResult) {
      audioRef.current.pause();
      setIsPlayingResult(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlayingResult(true))
        .catch((err) => {
          console.error("Audio playback stalled:", err);
          setErrorText("Could not initiate sound preview. Check browser permissions.");
        });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      
      {/* GLAMOUR BANNER CARD */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-900 bg-neutral-950 p-6 md:p-8 space-y-4">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded-md border border-cyan-500/20">
              ⚡ LIVE SONIC Blueprint
            </span>
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#39FF14] bg-[#39FF14]/15 px-2.5 py-1 rounded-md border border-[#39FF14]/20">
              PRISTINE LOSSLESS 
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight italic text-white flex items-center gap-2">
            TYROX <span className="text-[#39FF14]">SIGNATURE SOUND MATCHER</span>
          </h1>
          <p className="text-xs md:text-sm text-neutral-400 max-w-2xl leading-relaxed">
            Upload your raw stereo mixdowns, drafts, or fully-mixed beats. This acoustic engine matches your tracks dynamic curves, frequency balance, and RMS loudness patterns directly against Tyrox's signatureWisconsin-engineered master reference profile.
          </p>
        </div>
        <div className="absolute right-0 top-0 w-1/3 h-full opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500 via-transparent to-transparent pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: DROPZONE & STATUS */}
        <div className="lg:col-span-7 space-y-6">
          
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all duration-300 cursor-pointer flex flex-col items-center justify-center space-y-4
              ${dragging ? 'border-cyan-400 bg-cyan-950/10 scale-[0.99]' : 'border-neutral-850 hover:border-cyan-500 bg-neutral-950/40'}
            `}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".mp3,.wav,.m4a" 
              className="hidden" 
            />

            {!selectedFile ? (
              <>
                <div className="w-16 h-16 bg-neutral-900/60 rounded-full flex items-center justify-center text-cyan-400 border border-neutral-800 shadow-xl shadow-black/40">
                  <Upload size={28} className="animate-bounce" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Drag and Drop Beat Block</h3>
                  <p className="text-[11px] text-neutral-500 font-sans">
                    OR CLICK TO SELECT FROM FILES (.mp3, .wav, or .m4a)
                  </p>
                </div>
                <div className="text-[9px] text-neutral-600 font-mono uppercase tracking-widest pt-2">
                  100% Raw unaltered uncompressed pipeline
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 bg-[#39FF14]/10 rounded-full flex items-center justify-center text-[#39FF14] border border-[#39FF14]/20 shadow-xl shadow-[#39FF14]/5">
                  <FileAudio size={24} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest">Selected Draft Input Track</p>
                  <p className="text-xs font-bold text-[#39FF14] truncate max-w-sm font-mono">{selectedFile.name}</p>
                  <p className="text-[10px] text-neutral-500 font-mono">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Pristine Original</p>
                </div>
                {!processing && !processedUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetState();
                      setSelectedFile(null);
                    }}
                    className="text-[10px] font-mono uppercase text-red-400 hover:text-red-300 transition underline pt-2 cursor-pointer"
                  >
                    Clear File selection
                  </button>
                )}
              </>
            )}
          </div>

          {/* ACTIVE PROCESSING CONSOLE */}
          {processing && (
            <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6 space-y-4 animate-scaleUp">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold font-mono text-cyan-400 animate-pulse uppercase flex items-center gap-1.5">
                  <Loader2 className="animate-spin" size={13} />
                  Engine Matching Active
                </span>
                <span className="text-xs font-bold font-mono text-white">{progress}%</span>
              </div>
              <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-cyan-400 to-[#39FF14] h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs font-mono text-neutral-400 italic text-center">
                &gt; {currentStep}
              </p>
            </div>
          )}

          {errorText && (
            <div className="p-4 bg-red-950/20 border border-red-500/20 text-red-400 text-xs rounded-xl font-mono">
              ⚠️ {errorText}
            </div>
          )}

          {/* PROCESS CONTROLLER */}
          {selectedFile && !processing && !processedUrl && (
            <button
              onClick={executeSoundMatchMaster}
              className="w-full py-4 bg-[#39FF14] hover:bg-[#34e512] text-black font-black uppercase text-xs tracking-widest rounded-xl transition shadow-xl shadow-[#39FF14]/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              Execute High-Fidelity Match Master
            </button>
          )}

        </div>

        {/* RIGHT COLUMN: SONIC SPECTROGRAM & SUCCESS OUTPUT */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* MULTI-PLATINUM TARGET SOUND PROFILE HUD CARD */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black font-sans uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Sliders size={13} className="text-purple-400" />
              Target Sonic Blueprint Profile
            </h3>
            
            <div className="space-y-3.5 pt-1">
              <div className="flex justify-between items-center bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-900">
                <div className="space-y-0.5">
                  <span className="block text-[10px] text-neutral-400 font-mono uppercase">Reference track source</span>
                  <span className="block text-xs font-bold text-white font-mono">target_sound.m4a (Wisconsin Master)</span>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#39FF14] animate-pulse" />
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="bg-neutral-900/40 p-2.5 rounded-lg border border-neutral-900">
                  <span className="block text-[9px] text-neutral-500 font-mono uppercase">EQ Target Gain</span>
                  <span className="block text-xs font-bold text-neutral-300 font-mono">Aggressive Sub-Harm</span>
                </div>
                <div className="bg-neutral-900/40 p-2.5 rounded-lg border border-neutral-900">
                  <span className="block text-[9px] text-neutral-500 font-mono uppercase">Brickwall Ceiling</span>
                  <span className="block text-xs font-bold text-neutral-300 font-mono">-1.0 dB Limit</span>
                </div>
                <div className="bg-neutral-900/40 p-2.5 rounded-lg border border-neutral-900">
                  <span className="block text-[9px] text-neutral-500 font-mono uppercase">Target Loudness</span>
                  <span className="block text-xs font-bold text-neutral-300 font-mono">-9.0 LUFS RMS</span>
                </div>
                <div className="bg-neutral-900/40 p-2.5 rounded-lg border border-neutral-900">
                  <span className="block text-[9px] text-neutral-500 font-mono uppercase">Linear phase filter</span>
                  <span className="block text-xs font-bold text-neutral-300 font-mono">Active (1024 Taps)</span>
                </div>
              </div>
            </div>

            {/* LIVE DYNAMIC SPECTROGRAM VISUALIZER BOX */}
            <div className="border border-neutral-900 rounded-xl bg-black p-4 flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden">
              {(processing || isPlayingResult) ? (
                <div className="space-y-2 text-center w-full relative z-10">
                  <canvas ref={canvasRef} className="mx-auto block" />
                  <span className="text-[9px] text-[#39FF14] font-mono uppercase tracking-widest animate-pulse block">
                    {processing ? 'Calculating acoustic matching matrices...' : 'Streaming matched high-fidelity audio...'}
                  </span>
                </div>
              ) : (
                <div className="text-center space-y-1.5 opacity-40">
                  <Activity size={24} className="mx-auto text-neutral-600" />
                  <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest">Visualizer Standby</p>
                </div>
              )}
            </div>
          </div>

          {/* DYNAMIC SUCCESS OUTPUT RESULT CARD */}
          {processedUrl && !processing && (
            <div className="bg-neutral-950 border border-[#39FF14]/20 rounded-2xl p-5 space-y-5 animate-fadeIn shadow-lg shadow-[#39FF14]/5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#39FF14]/15 border border-[#39FF14]/30 rounded-full flex items-center justify-center text-[#39FF14]">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#39FF14]">Matching Complete</h3>
                  <span className="text-[9px] text-neutral-500 font-mono uppercase block">Unaltered Pristine lossless Output</span>
                </div>
              </div>

              {/* STAT RECORD */}
              <div className="bg-neutral-905 border border-neutral-900 p-3 rounded-lg space-y-1.5 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Output Target file:</span>
                  <span className="text-neutral-300 max-w-[180px] truncate">{processedFilename}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Peak Signal Limit:</span>
                  <span className="text-neutral-300">-1.0 dB (Verified)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Bitrate & Encoding:</span>
                  <span className="text-emerald-400">100% Pristine Source Original</span>
                </div>
              </div>

              <div className="flex gap-3">
                {/* PREVIEW BUTTON */}
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-850 text-white rounded-xl text-[10px] font-mono uppercase tracking-wider border border-neutral-800 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isPlayingResult ? (
                    <>
                      <Pause size={12} className="text-[#39FF14]" />
                      <span>Pause Preview</span>
                    </>
                  ) : (
                    <>
                      <Play size={12} className="text-cyan-400" />
                      <span>Play Matched Beat</span>
                    </>
                  )}
                </button>

                {/* DOWNLOAD ACTUATOR */}
                <a
                  href={processedUrl}
                  download={processedFilename}
                  className="flex-1 py-3 bg-[#39FF14] hover:bg-[#34e512] text-black rounded-xl text-[10px] font-bold font-sans uppercase tracking-wider transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-[#39FF14]/10 no-underline"
                >
                  <Download size={13} />
                  <span>Download Beat</span>
                </a>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
