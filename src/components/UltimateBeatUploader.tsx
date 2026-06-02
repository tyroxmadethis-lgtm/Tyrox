/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { useStore } from "../context/StoreContext";
import {
  Upload,
  Music,
  Image as ImageIcon,
  FileArchive,
  Sparkles,
  Loader2,
  CheckCircle2,
  DollarSign,
  Play,
  Trash2,
  Cloud
} from "lucide-react";

interface UploadFile {
  file: File;
  type: "wav" | "mp3" | "stems" | "artwork";
  progress: number;
  url?: string;
}

interface Metadata {
  title: string;
  description: string;
  bpm: number;
  key: string;
  genre: string;
  subgenre: string;
  moods: string[];
  instruments: string[];
  tags: string[];
}

export const UltimateBeatUploader: React.FC = () => {
  const { addTrack, setAdminSection } = useStore();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processingAI, setProcessingAI] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Price parameters for the upload card
  const [prices, setPrices] = useState({
    mp3: 29.99,
    wav: 49.99,
    unlimited: 149.99,
    exclusive: 499.99
  });

  const [allowFreeDownload, setAllowFreeDownload] = useState(false);

  const [metadata, setMetadata] = useState<Metadata>({
    title: "",
    description: "",
    bpm: 140,
    key: "Am",
    genre: "Trap",
    subgenre: "Dark Trap",
    moods: [],
    instruments: [],
    tags: []
  });

  const [step, setStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto recognition
  const detectFileType = (file: File): "wav" | "mp3" | "stems" | "artwork" | null => {
    const name = file.name.toLowerCase();
    if (name.endsWith(".wav")) return "wav";
    if (name.endsWith(".mp3") || name.endsWith(".aac") || name.endsWith(".m4a")) return "mp3";
    if (name.endsWith(".zip") || name.endsWith(".rar")) return "stems";
    if (name.endsWith(".jpg") || name.endsWith(".png") || name.endsWith(".jpeg")) return "artwork";
    return null;
  };

  const processIncomingFiles = (incomingList: File[]) => {
    const processed: UploadFile[] = incomingList.map((file) => {
      const type = detectFileType(file);
      return {
        file,
        type: type || "wav", // fallback to wav if unrecognized
        progress: 0
      };
    });

    setFiles((prev) => [...prev, ...processed]);
    
    // Auto scanning triggered when master audio files are dropped
    const hasAudio = processed.some((f) => f.type === "wav" || f.type === "mp3");
    if (hasAudio) {
      runAIScanner(processed);
    }
    setStep(2);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processIncomingFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processIncomingFiles(Array.from(e.target.files));
    }
  };

  const runAIScanner = (incoming: UploadFile[]) => {
    setProcessingAI(true);
    const audioFile = incoming.find((f) => f.type === "wav" || f.type === "mp3");
    if (!audioFile) {
      setProcessingAI(false);
      return;
    }

    // High fidelity AI scanning simulation
    const baseName = audioFile.file.name.replace(/\.[^/.]+$/, ""); // strip extension
    setTimeout(() => {
      setMetadata({
        title: baseName.charAt(0).toUpperCase() + baseName.slice(1),
        description: "Atmospheric professional trap instrumental with dark textures and deep 808s. Produced via TYROX AI systems.",
        bpm: Math.floor(Math.random() * (160 - 120 + 1)) + 120, // 120 - 160 random BPM
        key: ["Am", "Ebm", "Fm", "G#m", "C#m", "B Minor", "G Major"][Math.floor(Math.random() * 7)],
        genre: "Trap",
        subgenre: "Dark Trap",
        moods: ["Dark", "Aggressive", "Spacey"],
        instruments: ["Flute", "Piano", "808"],
        tags: ["Future", "ATL", "Synth"]
      });
      setProcessingAI(false);
      setStep(3);
    }, 2500);
  };

  const uploadAllFiles = () => {
    if (files.length === 0) {
      alert("Please upload at least one file to build catalog.");
      return;
    }
    setUploading(true);

    // Simulate progress upload for all files in queue
    let finishedCount = 0;
    files.forEach((fileItem) => {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 15) + 5;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          finishedCount++;

          if (finishedCount === files.length) {
            // All files completed - Save Track to global local state
            const finalImg = files.find((f) => f.type === "artwork")
              ? "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop"
              : "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop";

            addTrack({
              title: metadata.title || "Untitled AI Beat",
              producer: "tyrox made this",
              bpm: metadata.bpm || 140,
              key: metadata.key || "Am",
              duration: "2:40",
              tags: [metadata.genre, metadata.subgenre, ...metadata.tags].filter(Boolean),
              imageUrl: finalImg,
              prices: {
                mp3: Number(prices.mp3) || 29.99,
                wav: Number(prices.wav) || 49.99,
                unlimited: Number(prices.unlimited) || 149.99,
                exclusive: Number(prices.exclusive) || 499.99
              },
              allowFreeDownload: allowFreeDownload
            });

            setUploading(false);
            setUploadSuccess(true);
            setStep(4);
          }
        }

        setFiles((prev) =>
          prev.map((f) =>
            f.file.name === fileItem.file.name ? { ...f, progress: currentProgress } : f
          )
        );
      }, 150);
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (files.length <= 1) {
      setStep(1);
    }
  };

  const finalizeUpload = () => {
    if (!metadata.title) {
      alert("Please enter a beat title.");
      return;
    }

    alert("Beat '" + metadata.title + "' is ready to be published locally!");

    if (files.length > 0) {
      uploadAllFiles();
    } else {
      // Direct local publishing with offline placeholder components
      addTrack({
        id: "beat-" + Date.now(),
        title: metadata.title,
        producer: "tyrox made this",
        bpm: metadata.bpm || 140,
        key: metadata.key || "Am",
        duration: "2:40",
        tags: [metadata.genre, metadata.subgenre || "Trap"].filter(Boolean),
        imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop",
        prices: {
          mp3: Number(prices.mp3) || 29.99,
          wav: Number(prices.wav) || 49.99,
          unlimited: Number(prices.unlimited) || 149.99,
          exclusive: Number(prices.exclusive) || 499.99
        },
        allowFreeDownload: allowFreeDownload
      });
      setUploadSuccess(true);
      setStep(4);
    }
  };

  return (
    <div className="w-full bg-neutral-950 text-neutral-200 p-4 md:p-8 rounded-2xl border border-neutral-900 animate-fadeIn">
      {/* HEADER */}
      <div className="border-b border-neutral-900 pb-6 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-sans italic tracking-tighter text-neutral-100 uppercase font-black flex items-center gap-2">
            <Sparkles className="text-purple-400" />
            TYROX AI UPLOADER
          </h1>
          <p className="font-mono text-[10px] text-neutral-500 uppercase mt-1">
            ENTERPRISE BEAT UPLOAD SYSTEM // OFFLINE BYPASS ENABLED
          </p>
        </div>
        <div className="flex items-center gap-2 bg-neutral-900/60 border border-neutral-800 px-3 py-1.5 rounded-lg text-[10px] font-mono">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-neutral-400">AI PIPELINE READY</span>
        </div>
      </div>

      {/* STEP TRACKER */}
      <div className="flex items-center justify-center gap-4 md:gap-8 py-4 mb-6 border-b border-neutral-900/50 max-w-2xl mx-auto overflow-x-auto">
        {[
          { num: 1, label: "Queue Files" },
          { num: 2, label: "AI Scanner" },
          { num: 3, label: "Metadata & Pricing" },
          { num: 4, label: "Publish" }
        ].map((s) => (
          <div
            key={s.num}
            className={`flex items-center gap-2 text-xs font-mono shrink-0 transition ${
              step >= s.num ? "text-purple-400" : "text-neutral-600"
            }`}
          >
            <CheckCircle2 size={14} className={step > s.num ? "text-emerald-400" : ""} />
            <span className={step === s.num ? "font-bold text-neutral-100 border-b border-purple-400" : ""}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* DRAG AREA */}
      {step < 4 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2
            border-dashed
            rounded-3xl
            p-16
            bg-[#07070a]
            transition-all
            duration-300
            cursor-pointer
            ${
              dragging
                ? "border-purple-500 bg-purple-950/10"
                : "border-purple-500/40 hover:border-purple-500"
            }
          `}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            multiple
            className="hidden"
            accept=".wav,.mp3,audio/aac,audio/x-aac,.aac,audio/mp4,.m4a,.zip,.rar,.png,.jpg,.jpeg"
          />

          <div className="flex flex-col items-center">
            <Cloud className="text-purple-500 w-20 h-20" />

            <h2 className="
              text-4xl
              font-black
              italic
              mt-8
              uppercase
            ">
              Initiate Asset Transmission
            </h2>

            <p className="
              text-zinc-500
              tracking-[0.4em]
              mt-3
              uppercase
            ">
              WAV • MP3/AAC • STEMS • ARTWORK
            </p>

            {/* Choose File Trigger & Name Display matching custom-upload-btn wireframe */}
            <div className="mt-8 flex flex-col items-center gap-2">
              <span className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-sans font-bold uppercase tracking-wider cursor-pointer shadow-lg shadow-purple-950/25 transition duration-300">
                Choose Audio File
              </span>
              <p className="font-mono text-xs text-neutral-450 mt-1 uppercase tracking-wider">
                {files.length > 0
                  ? `Selected: ${files.map((f) => f.file.name).join(", ")}`
                  : "No file chosen yet"}
              </p>
            </div>

            {/* FOUR UPLOADERS */}
            <div className="
              grid
              grid-cols-2
              md:grid-cols-4
              gap-5
              mt-14
              w-full
              max-w-5xl
            ">
              <UploadCard
                icon={<Music size={34} />}
                title="MASTER WAV"
              />

              <UploadCard
                icon={<Play size={34} />}
                title="TAGGED MP3"
              />

              <UploadCard
                icon={<FileArchive size={34} />}
                title="TRACK STEMS"
              />

              <UploadCard
                icon={<ImageIcon size={34} />}
                title="ARTWORK"
              />
            </div>
          </div>
        </div>
      )}

      {/* AI SCANNING */}
      {processingAI && (
        <div className="mt-6 bg-purple-650/10 border border-purple-500/20 rounded-xl p-4 flex items-center gap-4 animate-pulse">
          <Loader2 className="animate-spin text-purple-400" size={20} />
          <div>
            <h3 className="font-sans text-xs font-bold text-purple-300 uppercase">
              TYROX AI COMPILER ENGINE SCANNING AUDIO...
            </h3>
            <p className="text-[10px] text-neutral-500 font-mono">
              Analyzing transient peaks, parsing key scale, structuring tags & catalog parameters
            </p>
          </div>
        </div>
      )}

      {/* METADATA & FILES VIEW */}
      {step < 4 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
          {/* Metadata Parameters inputs */}
          <div className="lg:col-span-7 bg-neutral-950 border border-neutral-900 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
              <Sparkles className="text-purple-400" size={14} />
              <h3 className="font-sans font-bold text-xs uppercase text-neutral-300 tracking-wider">
                TYROX AI METADATA
              </h3>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-mono text-[9px] uppercase text-neutral-500">Track Title</label>
                  <input
                    type="text"
                    value={metadata.title}
                    onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 outline-none focus:border-purple-600"
                    placeholder="Track Title"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[9px] uppercase text-neutral-500">BPM (Tempo)</label>
                  <input
                    type="number"
                    value={metadata.bpm}
                    onChange={(e) => setMetadata({ ...metadata, bpm: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 outline-none focus:border-purple-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[9px] uppercase text-neutral-500">Musical Key</label>
                  <input
                    type="text"
                    value={metadata.key}
                    onChange={(e) => setMetadata({ ...metadata, key: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 outline-none focus:border-purple-600 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[9px] uppercase text-neutral-500">Genre</label>
                  <input
                    type="text"
                    value={metadata.genre}
                    onChange={(e) => setMetadata({ ...metadata, genre: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 outline-none focus:border-purple-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[9px] uppercase text-neutral-500">Subgenre</label>
                  <input
                    type="text"
                    value={metadata.subgenre}
                    onChange={(e) => setMetadata({ ...metadata, subgenre: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[9px] uppercase text-neutral-500">Asset Description</label>
                <textarea
                  value={metadata.description}
                  onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                  className="w-full h-24 p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 outline-none focus:border-purple-600 resize-none"
                  placeholder="Tell buyers about your soundscape, beat structure, or inspirations..."
                />
              </div>

              {/* Tag system */}
              <div className="space-y-1 pb-3">
                <label className="font-mono text-[9px] uppercase text-neutral-500">Visual Tags (Comma Separated)</label>
                <input
                  type="text"
                  value={metadata.tags.join(", ")}
                  onChange={(e) =>
                    setMetadata({
                      ...metadata,
                      tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                    })
                  }
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-250 font-mono"
                  placeholder="ATL, Synth, Melodic, Future"
                />
              </div>

              {/* Direct Pricing overrides nested */}
              <div className="border-t border-neutral-900 pt-4">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <h4 className="font-sans font-bold text-neutral-300 text-[11px] uppercase tracking-wider">
                    Licensing Pricing Tears ($ USD)
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 px-3 py-1.5 rounded-lg select-none transition">
                    <input
                      type="checkbox"
                      checked={allowFreeDownload}
                      onChange={(e) => setAllowFreeDownload(e.target.checked)}
                      className="accent-purple-500 rounded cursor-pointer w-3.5 h-3.5"
                    />
                    <span className="font-mono text-[9px] uppercase text-neutral-300 tracking-wider">
                      Allow Free Download (MP3)
                    </span>
                  </label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
                  <div>
                    <label className="text-[9px] text-neutral-500 block uppercase mb-1">MP3 Price</label>
                    <input
                      type="number"
                      value={prices.mp3}
                      onChange={(e) => setPrices({ ...prices, mp3: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-neutral-900 border border-neutral-800 p-2 text-cyan-400 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-neutral-500 block uppercase mb-1">WAV Price</label>
                    <input
                      type="number"
                      value={prices.wav}
                      onChange={(e) => setPrices({ ...prices, wav: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-neutral-900 border border-neutral-800 p-2 text-cyan-400 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-neutral-500 block uppercase mb-1">UNLIMITED</label>
                    <input
                      type="number"
                      value={prices.unlimited}
                      onChange={(e) => setPrices({ ...prices, unlimited: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-neutral-900 border border-neutral-800 p-2 text-cyan-400 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-neutral-500 block uppercase mb-1">EXCLUSIVE</label>
                    <input
                      type="number"
                      value={prices.exclusive}
                      onChange={(e) => setPrices({ ...prices, exclusive: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-neutral-900 border border-neutral-800 p-2 text-cyan-400 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submission and file queue sidebar */}
          <div className="lg:col-span-5 bg-neutral-950 border border-neutral-900 rounded-xl p-5 flex flex-col justify-between animate-fadeIn">
            <div>
              <h3 className="text-xs uppercase font-mono text-neutral-400 font-bold tracking-wider mb-4 border-b border-neutral-900 pb-2">
                Queue Assets ({files.length})
              </h3>

              {files.length > 0 ? (
                <div className="space-y-3">
                  {files.map((f, i) => (
                    <div key={i} className="bg-neutral-900 border border-neutral-850 p-3.5 rounded-lg text-xs space-y-2">
                      <div className="flex justify-between items-center text-neutral-300">
                        <div className="flex items-center gap-2 truncate">
                          <span className="p-1.5 bg-neutral-950 border border-neutral-800 text-neutral-400 rounded">
                            {f.type === "artwork" ? <ImageIcon size={12} /> : <Music size={12} />}
                          </span>
                          <span className="truncate max-w-[150px]" title={f.file.name}>
                            {f.file.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-neutral-500 uppercase bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-850">
                            {f.type}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(i);
                            }}
                            className="text-neutral-500 hover:text-red-400 transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {f.progress > 0 && (
                        <div className="space-y-1">
                          <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${f.progress}%` }}
                              className="bg-purple-600 h-full rounded-full transition-all duration-300"
                            />
                          </div>
                          <div className="flex justify-between text-[8px] font-mono text-neutral-500 uppercase">
                            <span>Status: {f.progress === 100 ? "Sync Complete" : "Pushing binary..."}</span>
                            <span>{f.progress}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 border border-dashed border-neutral-850 rounded-xl text-center space-y-3">
                  <div className="p-3 bg-neutral-900/40 rounded-full inline-block text-neutral-500">
                    <Cloud size={20} />
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-normal">
                    You can drag WAV, MP3, AAC, stems or artwork onto the transmission zone above to run real-time spectrum AI scanners automatically.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-neutral-900 mt-6 space-y-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  finalizeUpload();
                }}
                disabled={uploading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-500 hover:to-indigo-500 transition-all rounded-xl text-neutral-100 text-xs font-bold uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-950/20"
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin text-white" size={14} />
                    Pushing binary buffers to cloud...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Publish Beat
                  </>
                )}
              </button>
              {files.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFiles([]);
                    setStep(1);
                  }}
                  disabled={uploading}
                  className="w-full py-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-500 hover:text-neutral-300 transition text-[10px] font-mono uppercase tracking-wide rounded-lg cursor-pointer"
                >
                  Clear Queue
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS SCREEN */}
      {step === 4 && uploadSuccess && (
        <div className="p-8 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 size={32} />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-sans font-black text-white uppercase tracking-tight">
              PRODUCER CATALOG WRITTEN successfully!
            </h2>
            <p className="text-xs text-neutral-400 font-mono uppercase">
              BEAT REGISTRY COMPLETED // PROCESSED AND SIGNED BY "TYROX MADE THIS"
            </p>
          </div>

          <p className="text-xs text-neutral-500 leading-relaxed font-sans p-3 bg-neutral-900/30 rounded-lg border border-neutral-900">
            The generated beat & asset nodes are now mapped globally onto your storefront index. Buyers can stream, add licensing options to cart, secure checking, and load contracts.
          </p>

          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => {
                setFiles([]);
                setMetadata({
                  title: "",
                  description: "",
                  bpm: 140,
                  key: "Am",
                  genre: "Trap",
                  subgenre: "Dark Trap",
                  moods: [],
                  instruments: [],
                  tags: []
                });
                setUploadSuccess(false);
                setStep(1);
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer"
            >
              Upload Another Track
            </button>
            <button
              onClick={() => setAdminSection("tracks")}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white border border-neutral-850 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer"
            >
              Check Catalog
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function UploadCard({
  icon,
  title
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="
      bg-zinc-900
      rounded-2xl
      p-6
      w-44
      h-40
      flex
      flex-col
      items-center
      justify-center
      border
      border-zinc-800
      hover:border-purple-500
      transition-all
    ">

      <div className="text-purple-400 mb-3">
        {icon}
      </div>

      <h3 className="font-bold text-center">
        {title}
      </h3>

    </div>
  );
}
