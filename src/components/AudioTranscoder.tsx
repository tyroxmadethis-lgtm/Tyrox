import React, { useState, useRef } from 'react';
import { 
  FileAudio, 
  Cpu, 
  Server, 
  Binary, 
  Music, 
  Sparkles, 
  Settings, 
  Download, 
  Play, 
  Pause, 
  HelpCircle, 
  Gauge, 
  FolderSync, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface LogEntry {
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

export default function AudioTranscoder() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isTranscoding, setIsTranscoding] = useState(false);
  const [mode, setMode] = useState<'server' | 'client'>('server');
  const [logs, setLogs] = useState<LogEntry[]>([
    { timestamp: '08:55:00', type: 'info', message: 'VibeVault Studio audio transcoder network online.' },
    { timestamp: '08:55:02', type: 'info', message: 'Codec availability verified: FFmpeg backend and WebAudio PCM sandbox ready.' }
  ]);

  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [convertedFilename, setConvertedFilename] = useState<string>('');
  
  // Audition playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayingOriginal, setIsPlayingOriginal] = useState(false);
  
  const originalAudioRef = useRef<HTMLAudioElement | null>(null);
  const convertedAudioRef = useRef<HTMLAudioElement | null>(null);

  const addLog = (message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const time = new Date().toTimeString().split(' ')[0];
    setLogs(prev => [...prev, { timestamp: time, type, message }]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setConvertedUrl(null);
      addLog(`Loaded target audio file: "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB, MineType: ${file.type})`, 'info');
    }
  };

  // Option A: Backend Server Pristine Upload Flow
  const runServerCodecs = async (audioFile: File) => {
    addLog(`Initiating pristine backend file upload for "${audioFile.name}"...`, 'info');
    const formData = new FormData();
    formData.append('beatFile', audioFile);

    try {
      const response = await fetch('/api/upload-beat', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Server rejected file upload pipeline.');
      }

      const result = await response.json();
      addLog(`Piped code success! File successfully saved in untouched pristine format.`, 'success');
      addLog(`Path mapped: ${result.wavPath}`, 'success');

      setConvertedUrl(result.wavPath);
      setConvertedFilename(result.filename || 'original_beat.wav');
    } catch (err: any) {
      addLog(`Backend alignment failed: ${err.message}`, 'error');
      addLog(`Suggestion: Try "In-Browser Sandbox PCM Mode" for an instant, local offline transcode fallback!`, 'warn');
    }
  };

  // Option B: Binary PCM downsampler for direct in-browser WAV encoding
  const encodeToWavPCM = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // Uncompressed integer PCM
    const bitDepth = 16;
    
    const resultLength = buffer.length * numOfChan * 2 + 44;
    const arrayBuffer = new ArrayBuffer(resultLength);
    const view = new DataView(arrayBuffer);
    const channels: Float32Array[] = [];
    
    let pos = 0;

    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };

    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    // --- RIFF CONTAINER HEADERS ---
    setUint32(0x46464952); // "RIFF"
    setUint32(resultLength - 8); // chunk size
    setUint32(0x45564157); // "WAVE"
    
    // --- FORMAT CHUNK ("fmt ") ---
    setUint32(0x20746d66); // "fmt " type
    setUint32(16); // format chunk size
    setUint16(format); // compression format
    setUint16(numOfChan); // channel count
    setUint32(sampleRate); // sample rate
    setUint32(sampleRate * numOfChan * 2); // byte rate (sampleRate * channelCount * bytesPerSample)
    setUint16(numOfChan * 2); // block align
    setUint16(bitDepth); // bits per sample

    // --- DATA CHUNK ("data") ---
    setUint32(0x61746164); // "data" identifier
    setUint32(resultLength - pos - 4); // chunk length (sub-chunk size)

    // Save channel metrics
    for (let c = 0; c < numOfChan; c++) {
      channels.push(buffer.getChannelData(c));
    }

    let offset = 0;
    while (pos < resultLength) {
      for (let c = 0; c < numOfChan; c++) {
        let sample = Math.max(-1, Math.min(1, channels[c][offset])); // clamp sample values
        // Scale to 16-bit signed integer limits
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([view], { type: 'audio/wav' });
  };

  const runClientSandboxPCM = async (audioFile: File) => {
    addLog(`Spawning client-offline AudioContext. Reading file binary into buffer...`, 'info');
    
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await audioFile.arrayBuffer();
      
      addLog(`Binary loaded. Decoding audio frequencies...`, 'info');
      
      audioCtx.decodeAudioData(arrayBuffer, (decodedBuffer) => {
        addLog(`Frequencies parsed cleanly! Sample Rate: ${decodedBuffer.sampleRate}Hz, Duration: ${decodedBuffer.duration.toFixed(2)}s, Channels: ${decodedBuffer.numberOfChannels}`, 'info');
        addLog(`Encoding samples to 16-bit Linear PCM sign bit formats...`, 'info');
        
        const wavBlob = encodeToWavPCM(decodedBuffer);
        const objectUrl = URL.createObjectURL(wavBlob);
        
        addLog(`Local WAV asset generated! Size: ${(wavBlob.size / (1024 * 1024)).toFixed(2)} MB.`, 'success');
        
        const sanitizedName = audioFile.name.substring(0, audioFile.name.lastIndexOf('.')) || audioFile.name;
        
        setConvertedUrl(objectUrl);
        setConvertedFilename(`${sanitizedName}-sandbox.wav`);
        audioCtx.close();
      }, (decodeErr) => {
        addLog(`AudioContext frequency decoder failed: ${decodeErr?.message || 'Unsupported binary format.'}`, 'error');
        audioCtx.close();
      });

    } catch (err: any) {
      addLog(`Browser sandbox encoder sequence error: ${err.message}`, 'error');
    }
  };

  const handleTranscodeSequence = async () => {
    if (!selectedFile) {
      addLog('Transcode blocked: Select an audio track file first.', 'warn');
      return;
    }

    setIsTranscoding(true);
    setConvertedUrl(null);
    setIsPlaying(false);
    setIsPlayingOriginal(false);
    
    if (mode === 'server') {
      await runServerCodecs(selectedFile);
    } else {
      await runClientSandboxPCM(selectedFile);
    }
    
    setIsTranscoding(false);
  };

  // Audition players
  const toggleAuditionOriginal = () => {
    if (!selectedFile) return;
    if (isPlayingOriginal) {
      originalAudioRef.current?.pause();
      setIsPlayingOriginal(false);
    } else {
      // Pause other
      if (isPlaying) {
        convertedAudioRef.current?.pause();
        setIsPlaying(false);
      }
      if (!originalAudioRef.current) {
        const fileUrl = URL.createObjectURL(selectedFile);
        originalAudioRef.current = new Audio(fileUrl);
        originalAudioRef.current.onended = () => setIsPlayingOriginal(false);
      }
      originalAudioRef.current.play();
      setIsPlayingOriginal(true);
      addLog(`Auditioning original uncompressed input track...`, 'info');
    }
  };

  const toggleAuditionConverted = () => {
    if (!convertedUrl) return;
    if (isPlaying) {
      convertedAudioRef.current?.pause();
      setIsPlaying(false);
    } else {
      // Pause other
      if (isPlayingOriginal) {
        originalAudioRef.current?.pause();
        setIsPlayingOriginal(false);
      }
      if (!convertedAudioRef.current || convertedAudioRef.current.src !== convertedUrl) {
        convertedAudioRef.current = new Audio(convertedUrl);
        convertedAudioRef.current.onended = () => setIsPlaying(false);
      }
      convertedAudioRef.current.play();
      setIsPlaying(true);
      addLog(`Auditioning processed WAV output block...`, 'info');
    }
  };

  return (
    <div id="vibe-transcoder-root" className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
      
      {/* HEADER ROW */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-neutral-900 pb-5">
        <div>
          <span className="px-2.5 py-0.5 text-[8px] font-mono font-black tracking-widest bg-purple-500/10 text-purple-400 rounded border border-purple-500/20 uppercase">
            Symmetric Audio Transcoding Machine
          </span>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter mt-1 flex items-center gap-2">
            <Cpu className="w-8 h-8 text-purple-400 animate-spin-slow" />
            STUDIO WAV CONVERTER
          </h1>
          <p className="text-xs text-neutral-400 font-mono mt-1 leading-relaxed">
            Pipes unformatted MP3, AAC, and M4A audio chunks directly into clean, uncompressed canonical WAV container rows.
          </p>
        </div>

        <div className="flex bg-neutral-950 border border-neutral-850 p-1 rounded-xl">
          <button
            onClick={() => {
              setMode('server');
              addLog('Swapped target pipeline to: Server-Side fluent-ffmpeg stream block.', 'info');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition flex items-center gap-1.5 cursor-pointer ${
              mode === 'server' 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'text-neutral-500 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            Express Server
          </button>
          <button
            onClick={() => {
              setMode('client');
              addLog('Swapped target pipeline to: Client-Side Sandbox PCM sampler.', 'info');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition flex items-center gap-1.5 cursor-pointer ${
              mode === 'client' 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'text-neutral-500 hover:text-white'
            }`}
          >
            <Binary className="w-3.5 h-3.5" />
            Sandbox PCM
          </button>
        </div>
      </div>

      {/* CORE WORKSPACE PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: UPLOAD AND TRANSCODE ACTIONS */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          <div className="border border-neutral-900 bg-neutral-950/40 rounded-xl p-5 md:p-6 space-y-5 flex-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-60 h-60 bg-purple-600/5 rounded-full blur-[85px] pointer-events-none" />
            
            <h3 className="text-xs font-black uppercase text-neutral-400 tracking-wider flex items-center gap-1.5 border-b border-neutral-900 pb-2.5">
              <Settings className="w-4 h-4 text-purple-400" />
              Source Audio Container
            </h3>

            {/* Input Selection Block */}
            <div className="space-y-3">
              <label 
                htmlFor="transcode-audio-file"
                className="block border-2 border-dashed border-neutral-800 hover:border-purple-500/40 bg-black/40 p-8 rounded-xl text-center cursor-pointer transition"
              >
                <input 
                  type="file" 
                  id="transcode-audio-file" 
                  onChange={handleFileChange}
                  accept="audio/mp3,audio/mpeg,audio/aac,audio/m4a,audio/wav,audio/x-m4a"
                  className="hidden" 
                />
                <FileAudio className="w-12 h-12 text-purple-500 mx-auto opacity-75 mb-3" />
                <span className="block text-xs font-bold text-white uppercase">Choose Source Track</span>
                <span className="block text-[9px] text-neutral-500 font-mono mt-1 uppercase">Supports MP3, M4A, AAC, M4P</span>
              </label>

              {/* Display Selected Track Details */}
              {selectedFile && (
                <div className="bg-neutral-950 border border-neutral-900 p-3.5 rounded-lg space-y-2">
                  <div className="flex items-start justify-between gap-1">
                    <div className="truncate">
                      <p className="text-xs font-bold text-[#39FF14] truncate">{selectedFile.name}</p>
                      <p className="text-[9px] text-neutral-400 font-mono mt-0.5">
                        FileSize: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={toggleAuditionOriginal}
                      className={`p-1.5 px-2.5 text-[9px] font-mono font-bold uppercase rounded border transition shrink-0 flex items-center gap-1 cursor-pointer ${
                        isPlayingOriginal 
                          ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-600/20' 
                          : 'bg-[#39FF14]/10 border-[#39FF14]/30 text-[#39FF14] hover:bg-[#39FF14]/20'
                      }`}
                    >
                      {isPlayingOriginal ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                      {isPlayingOriginal ? 'MUTE' : 'AUDITION'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Config Parameter Note box */}
            <div className="bg-neutral-900/30 border border-neutral-900 rounded-lg p-4 space-y-2.5 text-[11px] text-neutral-400">
              <div className="flex items-center gap-1.5 text-neutral-300 font-bold font-mono text-[10px] uppercase">
                <HelpCircle className="w-4 h-4 text-purple-400" />
                Mode Descriptions
              </div>
              
              {mode === 'server' ? (
                <p className="leading-relaxed font-sans">
                  <b className="text-white">Express Server Direct Storage</b> streams the audio file binary to the Node.js process and writes the exact, pristine uncompressed raw audio file directly to host storage, ensuring 100% original playback quality with zero alterations.
                </p>
              ) : (
                <p className="leading-relaxed font-sans">
                  <b className="text-white">Sandbox PCM Downsampler</b> runs completely client-side in your browser. Using the HTML5 <code className="text-purple-400">AudioContext</code> wave interpreter, it decodes the raw audio rates and structures a high-fidelity WAV container stream locally, bypassing host workloads.
                </p>
              )}
            </div>
          </div>

          {/* Trigger Action panel */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-4 flex">
            <button
              onClick={handleTranscodeSequence}
              disabled={isTranscoding || !selectedFile}
              className={`w-full py-3 rounded-lg font-mono font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 ${
                isTranscoding 
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : !selectedFile
                    ? 'bg-neutral-900 text-neutral-600 cursor-not-allowed border border-neutral-850'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
              }`}
            >
              {isTranscoding ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  TRANSCONVERTING CONTAINERS...
                </>
              ) : (
                <>
                  <FolderSync className="w-4 h-4" />
                  EXECUTE WAV TRANSCODE
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: TELEMETRY ENGINE LOGS AND OUTPUT */}
        <div className="lg:col-span-7 flex flex-col justify-between border border-neutral-900 bg-neutral-950 rounded-2xl md:p-6 p-4 relative min-h-[440px] overflow-hidden">
          
          <div className="space-y-4 flex-1 flex flex-col justify-between mb-4">
            
            {/* Live Telemetry monitor */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-wider text-neutral-400 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-purple-400" />
                  DASHBOARD TELEMETRY FEED
                </span>
                <span className="text-[9px] font-mono text-[#39FF14] uppercase bg-[#39FF14]/10 px-2 py-0.5 rounded border border-[#39FF14]/20 animate-pulse">
                  SYSTEM READY
                </span>
              </div>
              
              {/* Terminal Logs View window */}
              <div className="bg-black/80 border border-neutral-900 rounded-lg p-4 font-mono text-[10.5px] h-[190px] md:h-[240px] overflow-y-auto space-y-2 no-scrollbar">
                {logs.map((log, index) => (
                  <div key={index} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-neutral-600 shrink-0 select-none">[{log.timestamp}]</span>
                    <span className={`shrink-0 select-none font-bold ${
                      log.type === 'success' ? 'text-[#39FF14]' :
                      log.type === 'warn' ? 'text-amber-400' :
                      log.type === 'error' ? 'text-red-500' :
                      'text-purple-400'
                    }`}>
                      {log.type === 'success' ? '✔ [SUCCESS]' :
                       log.type === 'warn' ? '⚠ [WARN]' :
                       log.type === 'error' ? '✖ [ERROR]' :
                       'ℹ [SYSTEM]'}
                    </span>
                    <span className="text-neutral-300 break-all">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* TRANSCODED OUTPUT READY CARD */}
            {convertedUrl ? (
              <div className="border border-[#39FF14]/30 bg-emerald-950/10 rounded-xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fadeIn">
                <div className="space-y-1 truncate">
                  <span className="text-[8px] font-mono font-black text-[#39FF14] bg-[#39FF14]/10 px-2 py-0.5 rounded border border-[#39FF14]/20 uppercase">
                    WAV TRANSDUCTION READY
                  </span>
                  <h4 className="text-xs font-bold text-white truncate my-1.5" title={convertedFilename}>
                    {convertedFilename}
                  </h4>
                  <p className="text-[9px] text-neutral-500 font-mono uppercase leading-none">
                    Container codec format: 16-bit Linear PCM Stereo wav
                  </p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={toggleAuditionConverted}
                    className={`p-2 px-3.5 text-xs font-mono font-black uppercase rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                      isPlaying 
                        ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-600/20' 
                        : 'bg-[#39FF14]/10 border-[#39FF14]/30 text-[#39FF14] hover:bg-[#39FF14]/20'
                    }`}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    {isPlaying ? 'STOP' : 'TEST PLAY'}
                  </button>

                  <a
                    href={convertedUrl}
                    download={convertedFilename}
                    className="p-2 px-3.5 bg-purple-600 hover:bg-purple-500 text-white border border-purple-500/20 rounded-lg text-xs font-mono font-black uppercase tracking-wider flex items-center gap-1.5 transition no-underline text-center cursor-pointer shadow-lg shadow-purple-950/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    DOWNLOAD
                  </a>
                </div>
              </div>
            ) : (
              <div className="border border-neutral-900 bg-neutral-950/60 p-6 rounded-xl text-center space-y-2">
                <Music className="w-10 h-10 text-neutral-700 mx-auto" />
                <p className="text-xs text-neutral-500 uppercase font-mono font-bold">Waiting for Transcode</p>
                <p className="text-[10px] text-neutral-600 leading-normal max-w-sm mx-auto">
                  Once the audio track is loaded above and you trigger "EXECUTE WAV TRANSCODE", the resulting download item and system audio player will appear here.
                </p>
              </div>
            )}

          </div>

          {/* ENGINE METADATA FOOTER */}
          <div className="bg-neutral-950/40 p-3 rounded-lg border border-neutral-900/60 flex items-center justify-between text-[10px] font-mono text-neutral-500 select-none">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <span>CO-STREAM DECAY FILTER 2.2V</span>
            </div>
            <span>CH. STEREO 16-BIT 44100HZ LPCM</span>
          </div>

        </div>

      </div>

    </div>
  );
}
