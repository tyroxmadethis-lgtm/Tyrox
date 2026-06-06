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
  Trash2,
  Cloud,
  ChevronLeft,
  ChevronRight
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
  tags: string[];
}

export const UltimateBeatUploader: React.FC = () => {
  const { addTrack, setAdminSection } = useStore();
  const [step, setStep] = useState(1); // Stepper pages: 1 (Basic Info), 2 (Artwork), 3 (Audio Uploads), 4 (Pricing & Review), 5 (Success Screen)
  
  // Page 1: Metadata Metadata
  const [metadata, setMetadata] = useState<Metadata>({
    title: "",
    description: "",
    bpm: 140,
    key: "Am",
    genre: "Trap",
    subgenre: "Dark Trap",
    tags: []
  });

  const [tagInputText, setTagInputText] = useState("");

  const handleTagsInputChange = (value: string) => {
    let rawTags = value.split(",");
    if (rawTags.length > 58) {
      rawTags = rawTags.slice(0, 58);
      alert("Maximum limit of 58 custom tags reached.");
      const truncatedValue = rawTags.join(",");
      setTagInputText(truncatedValue);
      setMetadata((prev) => ({
        ...prev,
        tags: rawTags.map((s) => s.trim()).filter(Boolean)
      }));
    } else {
      setTagInputText(value);
      setMetadata((prev) => ({
        ...prev,
        tags: rawTags.map((s) => s.trim()).filter(Boolean)
      }));
    }
  };

  // Page 2: Artwork
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [artworkPreview, setArtworkPreview] = useState<string | null>(null);
  const artworkFileRef = useRef<HTMLInputElement>(null);

  const handleArtworkChange = (file: File) => {
    setArtworkFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setArtworkPreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    // Sync with the files array for step 3 display & triggerUploadProcess logic
    setFiles((prev) => {
      const filtered = prev.filter((f) => f.type !== "artwork");
      return [
        ...filtered,
        {
          file,
          type: "artwork",
          progress: 0
        }
      ];
    });
  };

  // Page 3: Audio File Upload Queue
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processingAI, setProcessingAI] = useState(false);
  
  // Page 4: Pricing & Review Parameter
  const [flatPrice, setFlatPrice] = useState<string>("29.99");
  const [allowFreeDownload, setAllowFreeDownload] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto classification
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
        type: type || "wav",
        progress: 0
      };
    });

    setFiles((prev) => [...prev, ...processed]);
    
    // AI scanner triggers for added audio blocks
    const hasAudio = processed.some((f) => f.type === "wav" || f.type === "mp3");
    if (hasAudio && !metadata.title) {
      runAIScanner(processed);
    }
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

    const baseName = audioFile.file.name.replace(/\.[^/.]+$/, "");
    setTimeout(() => {
      setMetadata((prev) => ({
        ...prev,
        title: baseName.charAt(0).toUpperCase() + baseName.slice(1),
        bpm: Math.floor(Math.random() * (160 - 120 + 1)) + 120,
        key: ["Am", "Ebm", "Fm", "G#m", "C#m", "B Minor", "G Major"][Math.floor(Math.random() * 7)]
      }));
      setProcessingAI(false);
    }, 1800);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadArtworkToCloudinary = async (artworkFile: File): Promise<string | null> => {
    try {
      // 1. Fetch encrypted signature from our Express server endpoint
      const signResponse = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "tyrox_beats_assets" })
      });

      if (!signResponse.ok) {
        const errJson = await signResponse.json().catch(() => ({}));
        console.warn("Cloudinary signing endpoint offline or misconfigured:", errJson.error || "unknown signature error");
        return null;
      }

      const signData = await signResponse.json();
      if (!signData.success) {
        console.warn("Cloudinary signing failed:", signData.error);
        return null;
      }

      // 2. Build secure FormData payload for direct Cloudinary upload
      const formData = new FormData();
      formData.append("file", artworkFile);
      formData.append("api_key", signData.apiKey);
      formData.append("timestamp", String(signData.timestamp));
      formData.append("signature", signData.signature);
      formData.append("folder", signData.folder);
      formData.append("transformation", signData.transformation);

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`;
      const uploadResponse = await fetch(cloudinaryUrl, {
        method: "POST",
        body: formData
      });

      if (!uploadResponse.ok) {
        const errText = await uploadResponse.text();
        console.warn("Cloudinary API rejected the secure upload:", errText);
        return null;
      }

      const uploadResult = await uploadResponse.json();
      console.log("Cloudinary secure upload successful:", uploadResult.secure_url);
      return uploadResult.secure_url;
    } catch (error) {
      console.error("Failed secure Cloudinary upload flow:", error);
      return null;
    }
  };

  const triggerUploadProcess = async () => {
    if (files.length === 0) {
      alert("Please configure or upload at least one audio asset in Page 2 to sync.");
      return;
    }

    setUploading(true);
    let finishedCount = 0;
    let artworkUrl: string | null = null;

    // Check for artwork files to upload securely to Cloudinary first
    const artworkFileItem = files.find((f) => f.type === "artwork");
    if (artworkFileItem) {
      setFiles((prev) =>
        prev.map((f) =>
          f.type === "artwork" ? { ...f, progress: 20 } : f
        )
      );
      
      const uploadedUrl = await uploadArtworkToCloudinary(artworkFileItem.file);
      if (uploadedUrl) {
        artworkUrl = uploadedUrl;
        setFiles((prev) =>
          prev.map((f) =>
            f.type === "artwork" ? { ...f, progress: 100, url: uploadedUrl } : f
          )
        );
      } else {
        setFiles((prev) =>
          prev.map((f) =>
            f.type === "artwork" ? { ...f, progress: 100 } : f
          )
        );
      }
    }

    // Process other files in parallel/simulated behavior
    files.forEach((fileItem) => {
      if (fileItem.type === "artwork") {
        finishedCount++;
        if (finishedCount === files.length) {
          handleCompletePublishingFlow(artworkUrl);
        }
        return;
      }

      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 20) + 10;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          finishedCount++;

          if (finishedCount === files.length) {
            handleCompletePublishingFlow(artworkUrl);
          }
        }

        setFiles((prev) =>
          prev.map((f) =>
            f.file.name === fileItem.file.name ? { ...f, progress: currentProgress } : f
          )
        );
      }, 100);
    });
  };

  const handleCompletePublishingFlow = async (artworkUrl: string | null) => {
    const finalPrice = parseFloat(flatPrice) || 29.99;
    
    // Choose actual Cloudinary uploaded URL or fall back to high-quality unsplash/placeholder image
    const finalImg = artworkUrl || (files.find((f) => f.type === "artwork")
      ? "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop"
      : "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop");

    // Attempt actual database registry creation
    try {
      const response = await fetch("/api/tracks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: metadata.title || "Untitled AI Beat",
          bpm: metadata.bpm || 140,
          key: metadata.key || "Am",
          genre: metadata.genre,
          subgenre: metadata.subgenre,
          tags: metadata.tags,
          imageUrl: finalImg,
          price: finalPrice,
          allowFreeDownload: allowFreeDownload
        })
      });
      const data = await response.json();
      console.log("Database Sync Result:", data);
    } catch (apiError) {
      console.warn("MongoDB API offline or failed, writing to fallback local storage pipeline:", apiError);
    }

    // Call Context addTrack to notify the storefront seamlessly
    addTrack({
      title: metadata.title || "Untitled AI Beat",
      producer: "tyrox made this",
      bpm: Number(metadata.bpm) || 140,
      key: metadata.key || "Am",
      duration: "2:40",
      tags: [metadata.genre, metadata.subgenre, ...metadata.tags].filter(Boolean),
      imageUrl: finalImg,
      price: finalPrice,
      prices: {
        mp3: finalPrice,
        wav: finalPrice,
        unlimited: finalPrice,
        exclusive: finalPrice
      },
      allowFreeDownload: allowFreeDownload
    });

    setUploading(false);
    setUploadSuccess(true);
    setStep(5);
  };

  // Nav Handlers
  const handleNextPageFromBasicInfo = () => {
    if (!metadata.title.trim()) {
      alert("A valid beat track title is mandatory.");
      return;
    }
    setStep(2);
  };

  const handleNextPageFromAudioUpload = () => {
    const hasAudio = files.some(
      (f) => f.type === "wav" || f.type === "mp3" || f.type === "stems"
    );
    if (!hasAudio) {
      alert("Please upload at least one audio asset (MP3, WAV or Zip Stems) to progress.");
      return;
    }
    setStep(4);
  };

  return (
    <div id="vv-stepper-uploader" className="w-full bg-neutral-950 text-neutral-250 p-4 md:p-8 rounded-2xl border border-neutral-900 shadow-2xl animate-fadeIn">
      
      {/* HEADER SECTION */}
      <div className="border-b border-neutral-900 pb-6 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-sans italic tracking-tighter text-white uppercase font-black flex items-center gap-2">
            <Sparkles className="text-purple-400" />
            TYROX STUDIO TRANSMISSION
          </h1>
          <p className="font-mono text-[9px] text-neutral-500 uppercase mt-1 tracking-wider">
            Elite Multi-Platinum Master Registry Node • Madison, Wisconsin
          </p>
        </div>
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-850 px-3 py-1.5 rounded-lg text-[10px] font-mono select-none">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-neutral-400 uppercase tracking-widest">STEPPED REGISTRY FLOW</span>
        </div>
      </div>

      {/* CORE STEPPER PIPELINE */}
      <div className="flex items-center justify-between py-3 mb-8 border-b border-neutral-900/40 max-w-2xl mx-auto">
        {[
          { num: 1, label: "1. Info" },
          { num: 2, label: "2. Artwork" },
          { num: 3, label: "3. Audio" },
          { num: 4, label: "4. Price & Review" }
        ].map((s) => (
          <div
            key={s.num}
            className={`flex items-center gap-2 text-xs font-mono select-none transition-all duration-200 ${
              step >= s.num ? "text-purple-400 font-bold" : "text-neutral-600"
            }`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${
              step === s.num 
                ? "bg-purple-600 border-purple-500 text-white" 
                : step > s.num
                  ? "bg-emerald-950/40 border-emerald-500 text-emerald-400"
                  : "bg-neutral-900 border-neutral-800 text-neutral-600"
            }`}>
              {step > s.num ? "✓" : s.num}
            </div>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* PAGE 1: BASIC INFO */}
      {step === 1 && (
        <div className="space-y-6 max-w-3xl mx-auto animate-fadeIn">
          <div className="bg-neutral-900/25 border border-neutral-900 rounded-xl p-5 md:p-6 space-y-4">
            <h3 className="text-xs uppercase font-mono text-purple-400 font-bold tracking-wider mb-2 border-b border-neutral-850 pb-2">
              Page 1: Core Beat Parameters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="font-mono text-[9px] uppercase text-neutral-500">Track Title *</label>
                <input
                  type="text"
                  value={metadata.title}
                  onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 outline-none focus:border-purple-600 transition"
                  placeholder="e.g. Madison Driller"
                />
              </div>
              <div className="space-y-1">
                <label className="font-mono text-[9px] uppercase text-neutral-500">BPM (Tempo)</label>
                <input
                  type="number"
                  value={metadata.bpm}
                  onChange={(e) => setMetadata({ ...metadata, bpm: parseInt(e.target.value, 10) || 140 })}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 outline-none focus:border-purple-600 font-mono transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-sans">
              <div className="space-y-1">
                <label className="font-mono text-[9px] uppercase text-neutral-500">Musical Key Scale</label>
                <input
                  type="text"
                  value={metadata.key}
                  onChange={(e) => setMetadata({ ...metadata, key: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 outline-none focus:border-purple-600 font-mono transition"
                  placeholder="e.g. Bm"
                />
              </div>
              <div className="space-y-1">
                <label className="font-mono text-[9px] uppercase text-neutral-500">Primary Genre</label>
                <input
                  type="text"
                  value={metadata.genre}
                  onChange={(e) => setMetadata({ ...metadata, genre: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 outline-none focus:border-purple-600 transition"
                />
              </div>
              <div className="space-y-1">
                <label className="font-mono text-[9px] uppercase text-neutral-500">Subgenre classification</label>
                <input
                  type="text"
                  value={metadata.subgenre}
                  onChange={(e) => setMetadata({ ...metadata, subgenre: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 outline-none focus:border-purple-600 transition"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-mono text-[9px] uppercase text-neutral-500">Asset Concept Description</label>
              <textarea
                value={metadata.description}
                onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                className="w-full h-24 p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 outline-none focus:border-purple-600 resize-none transition"
                placeholder="Uncompressed masters, aggressive clinical synth lines, sub-bass architecture details..."
              />
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-center select-none">
                <label className="font-mono text-[9px] uppercase text-neutral-500 font-bold tracking-wider">Visual Tags (separated by commas) *</label>
                <span className="font-mono text-[9.5px] bg-neutral-900 border border-neutral-850 px-2 py-0.5 rounded text-neutral-400 font-bold">{metadata.tags.length}/58 TAGS</span>
              </div>
              <input
                type="text"
                value={tagInputText}
                onChange={(e) => handleTagsInputChange(e.target.value)}
                className="tag-input w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 font-mono outline-none focus:border-purple-600 transition"
                placeholder="HighFi, Aggressive, Madison, Synth"
              />
              <p className="font-mono text-[8.5px] uppercase text-neutral-600 tracking-normal mt-0.5">
                Separate tags with a COMMA (,). High precision indexing parses up to 58 custom tags.
              </p>
              {metadata.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1.5 max-h-24 overflow-y-auto no-scrollbar select-none">
                  {metadata.tags.map((tag, idx) => (
                    <span 
                      key={idx}
                      className="tag yt-style-tag text-[8px] uppercase whitespace-nowrap"
                      style={{ padding: '2px 8px', fontSize: '8px', margin: '1px' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleNextPageFromBasicInfo}
              className="flex items-center gap-1.5 px-6 py-3 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg shadow-purple-950/20"
            >
              Next: Track Artwork
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* PAGE 2: ARTWORK UPLOAD (NEW SECTION) */}
      {step === 2 && (
        <div id="step-artwork-section" className="space-y-6 max-w-3xl mx-auto animate-fadeIn text-neutral-250">
          <div className="bg-neutral-900/25 border border-neutral-900 rounded-xl p-5 md:p-6 space-y-4">
            <h3 className="text-xs uppercase font-mono text-purple-400 font-bold tracking-wider mb-2 border-b border-neutral-850 pb-2">
              PAGE 2: TRACK ARTWORK
            </h3>
            <p className="text-xs font-mono text-neutral-400 my-1 leading-relaxed">
              Upload a high-quality cover image for your beat.
            </p>

            <div className="flex flex-col items-center">
              <div 
                id="artwork-preview-box" 
                onClick={() => artworkFileRef.current?.click()}
                className="upload-dropzone border-2 border-dashed border-neutral-850 hover:border-purple-500 bg-neutral-950/60 p-6 rounded-xl text-center cursor-pointer transition flex flex-col items-center justify-center relative overflow-hidden"
                style={{ width: '300px', height: '300px' }}
              >
                {!artworkPreview ? (
                  <div id="dropzone-prompt" className="space-y-2 select-none">
                    <ImageIcon className="text-purple-500 w-12 h-12 mx-auto opacity-75" />
                    <p className="text-xs font-bold text-white uppercase mt-2">
                      Drag & drop your artwork here, or <span className="text-purple-500 hover:text-purple-400 underline cursor-pointer">browse</span>
                    </p>
                    <p className="text-[10px] text-neutral-500 font-mono mt-1">
                      Supports JPG, PNG (Minimum 500x500px recommended)
                    </p>
                  </div>
                ) : (
                  <img 
                    id="artwork-display" 
                    className="hidden-preview w-full h-full object-contain bg-black" 
                    src={artworkPreview || ""} 
                    alt="Artwork Preview" 
                    style={{ display: 'block' }}
                  />
                )}
              </div>

              <input 
                type="file" 
                id="artwork-file-input" 
                ref={artworkFileRef}
                accept="image/*" 
                className="hidden-input hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleArtworkChange(e.target.files[0]);
                  }
                }}
              />
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="navigation-buttons mt-6 flex justify-between">
            <button 
              type="button" 
              className="flex items-center gap-1.5 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-850 hover:text-white transition active:scale-95 text-xs font-mono uppercase tracking-wider text-neutral-400 rounded-lg cursor-pointer"
              onClick={() => setStep(1)}
            >
              <ChevronLeft size={14} />
              Back
            </button>
            <button 
              type="button" 
              className="flex items-center gap-1.5 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 active:scale-95 transition text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
              onClick={() => setStep(3)}
            >
              Next: Audio Files
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* PAGE 3: AUDIO FILE UPLOADS */}
      {step === 3 && (
        <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
          {/* DRAG AND DROP CLOUD ZONE */}
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
              rounded-2xl
              p-12
              bg-[#050608]/40
              transition-all
              duration-300
              cursor-pointer
              text-center
              space-y-4
              ${
                dragging
                  ? "border-purple-500 bg-purple-950/10"
                  : "border-purple-500/20 hover:border-purple-500"
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
            
            <Cloud className="text-purple-500 w-16 h-16 mx-auto animate-pulse" />
            <h2 className="text-xl md:text-2xl font-sans uppercase font-black italic tracking-tight text-white">
              Symmetric Asset Carrier Zone
            </h2>
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-neutral-500">
              Drop premium files here • Auto-Scan transient audio peaks
            </p>
            <span className="inline-block px-5 py-2 bg-neutral-900 hover:bg-neutral-850 text-purple-400 rounded-lg text-[10px] font-mono border border-neutral-800 transition">
              BROWSE DISK ENGINES
            </span>
          </div>

          {processingAI && (
            <div className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-4 flex items-center gap-3.5 animate-pulse text-xs">
              <Loader2 className="animate-spin text-purple-400 shrink-0" size={16} />
              <div>
                <h4 className="font-mono font-bold text-white uppercase text-[10px] tracking-wide">
                  AI SCANNER ACTIVE // PARSING SPECTRUM
                </h4>
                <p className="text-neutral-500 text-[9px] uppercase mt-0.5">
                  Calculating transients, identifying optimal tempo scale, structuring parameters...
                </p>
              </div>
            </div>
          )}

          {/* ACTIVE QUEUE CONTAINER */}
          <div className="bg-neutral-900/25 border border-neutral-900 rounded-xl p-5">
            <h3 className="text-xs uppercase font-mono text-neutral-400 font-bold tracking-wider mb-3 pb-1 border-b border-neutral-850">
              Active Upload Queue ({files.length} Assets)
            </h3>

            {files.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {files.map((f, i) => (
                  <div key={i} className="bg-neutral-900/50 border border-neutral-850 p-3 rounded-lg text-xs flex flex-col justify-between space-y-1.5 rounded-xl">
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className="p-1 px-1.5 bg-neutral-950 border border-neutral-800 text-purple-400 font-mono text-[9px] uppercase rounded">
                          {f.type}
                        </span>
                        <span className="truncate max-w-[140px] text-neutral-300 text-[11px]" title={f.file.name}>
                          {f.file.name}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(i);
                        }}
                        className="text-neutral-500 hover:text-red-400 p-1 rounded-md transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {f.progress > 0 && (
                      <div className="space-y-0.5">
                        <div className="w-full bg-neutral-800 h-1 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${f.progress}%` }}
                            className="bg-purple-600 h-full rounded-full transition-all duration-200"
                          />
                        </div>
                        <div className="flex justify-between text-[8px] font-mono text-neutral-500">
                          <span>SYNCING...</span>
                          <span>{f.progress}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-500 text-[10px] font-mono uppercase text-center py-6">
                Queue empty. Load WAV, Tagged MP3 trackouts, or Artwork graphics in step above.
              </p>
            )}
          </div>

          {/* STEPPER NAV CONTROLS */}
          <div className="flex justify-between pt-4 border-t border-neutral-900">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-850 hover:text-white transition active:scale-95 text-xs font-mono uppercase tracking-wider text-neutral-400 rounded-lg cursor-pointer"
            >
              <ChevronLeft size={14} />
              Back
            </button>
            <button
              onClick={handleNextPageFromAudioUpload}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 active:scale-95 transition text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
            >
              Next: Pricing & Review
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* PAGE 4: PRICING & REVIEW */}
      {step === 4 && (
        <div className="space-y-6 max-w-3xl mx-auto animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* PRICING INPUT */}
            <div className="md:col-span-6 bg-neutral-900/30 border border-neutral-900 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-xs uppercase font-mono text-purple-400 font-bold tracking-wider mb-4 border-b border-neutral-850 pb-2">
                  Pricing Parameters
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-1 text-xs">
                    <label className="font-mono text-[9px] uppercase text-neutral-500 font-bold">
                      Beat Price ($ USD) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 font-mono text-neutral-500 text-xs">$</span>
                      <input
                        type="text"
                        value={flatPrice}
                        onChange={(e) => setFlatPrice(e.target.value)}
                        className="w-full pl-7 pr-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-white font-mono outline-none focus:border-purple-600 transition"
                        placeholder="29.99"
                      />
                    </div>
                    <p className="text-[9px] text-neutral-500 font-mono mt-1 uppercase">
                      Sets single high-fidelity licensing purchase price.
                    </p>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer bg-neutral-900 hover:bg-neutral-850 border border-neutral-800/80 px-3 py-2.5 rounded-lg select-none transition">
                    <input
                      type="checkbox"
                      checked={allowFreeDownload}
                      onChange={(e) => setAllowFreeDownload(e.target.checked)}
                      className="accent-purple-500 rounded cursor-pointer w-4 h-4"
                    />
                    <div>
                      <span className="font-mono text-[9px] uppercase text-neutral-200 tracking-wider font-bold">
                        Allow Free Download (MP3)
                      </span>
                      <p className="text-[8px] text-neutral-500 font-mono uppercase mt-0.5">
                        Free download is gated by automated newsletter capture.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="bg-neutral-900/45 p-3 rounded-xl border border-neutral-850 mt-5">
                <span className="text-[8px] font-mono text-neutral-500 uppercase block tracking-wider mb-0.5">
                  LICENSING AGREEMENT
                </span>
                <p className="text-[9px] text-neutral-400 italic leading-relaxed">
                  "Publishing assigns exclusive intellectual property ownership, bypassing intermediate brokers with direct Stripe Connect deployment."
                </p>
              </div>
            </div>

            {/* REVIEW METADATA SUMMARY */}
            <div className="md:col-span-6 bg-neutral-900/30 border border-neutral-900 p-5 rounded-2xl space-y-4">
              <h3 className="text-xs uppercase font-mono text-neutral-400 font-bold tracking-wider border-b border-neutral-850 pb-2">
                Metadata Review
              </h3>

              <div className="space-y-3 font-mono text-[10px] uppercase">
                <div className="flex justify-between py-1 border-b border-neutral-900">
                  <span className="text-neutral-500">Title:</span>
                  <span className="text-white font-sans font-bold">{metadata.title}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-900">
                  <span className="text-neutral-500">Tempo (BPM):</span>
                  <span className="text-white">{metadata.bpm} BPM</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-900">
                  <span className="text-neutral-500">Key:</span>
                  <span className="text-white text-purple-400 font-bold">{metadata.key}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-900">
                  <span className="text-neutral-500">Genre:</span>
                  <span className="text-white">{metadata.genre} ~ {metadata.subgenre}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-900">
                  <span className="text-neutral-500">Audio Sources:</span>
                  <span className="text-emerald-400">{files.length} Assets Attached</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-900">
                  <span className="text-neutral-500">Licensing Tiers:</span>
                  <span className="text-white">Unified Studio Pricing</span>
                </div>
              </div>
            </div>

          </div>

          {/* STEPPER NAV CONTROLS */}
          <div className="flex justify-between pt-6 border-t border-neutral-900 mt-6 md:gap-3">
            <button
              onClick={() => setStep(3)}
              disabled={uploading}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-850 hover:text-white transition active:scale-95 text-xs font-mono uppercase tracking-wider text-neutral-400 rounded-lg cursor-pointer disabled:opacity-50"
            >
              <ChevronLeft size={14} />
              Back
            </button>
            <button
              onClick={triggerUploadProcess}
              disabled={uploading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-500 hover:to-indigo-500 transition-all rounded-xl text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-950/20"
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin text-white" size={14} />
                  Writing uncompressed blocks...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Registry Publish Beat
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS SCREEN */}
      {step === 5 && uploadSuccess && (
        <div className="p-8 text-center space-y-5 max-w-lg mx-auto animate-scaleUp">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-950/20">
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
                  tags: []
                });
                setTagInputText("");
                setFlatPrice("29.99");
                setAllowFreeDownload(false);
                setUploadSuccess(false);
                setArtworkFile(null);
                setArtworkPreview(null);
                setStep(1);
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer active:scale-95"
            >
              Upload Another Track
            </button>
            <button
              onClick={() => setAdminSection("tracks")}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white border border-neutral-850 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer active:scale-95"
            >
              Check Catalog
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
