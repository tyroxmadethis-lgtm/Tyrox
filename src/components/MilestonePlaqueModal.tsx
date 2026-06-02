/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { Award, Download, Sparkles, X, Heart, Trophy, Disc, Printer, Share2 } from "lucide-react";
import { AudioSynth } from "../services/audioSynth";

interface MilestonePlaqueModalProps {
  plaqueData: {
    beat_id: string;
    track_title: string;
    certified_streams: number;
    award_type: string;
    presentee: string;
    print_template_url: string;
  } | null;
  onClose: () => void;
}

export const MilestonePlaqueModal: React.FC<MilestonePlaqueModalProps> = ({
  plaqueData,
  onClose
}) => {
  const [shimmerPosition, setShimmerPosition] = useState(0);
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    if (!plaqueData) return;

    // Trigger celebratory royal synth progression from AudioSynth
    try {
      // Standard celebratory chord sequence in G# Minor! G#m - B - F# - C#
      setTimeout(() => AudioSynth.play("beat_001", 145, "B"), 100);
      setTimeout(() => AudioSynth.play("beat_001", 145, "G#m"), 400);
      setTimeout(() => AudioSynth.play("beat_001", 145, "F#"), 700);
      setTimeout(() => AudioSynth.play("beat_001", 145, "B"), 1000);
    } catch (e) {
      console.warn("Audio celebrate synth skipped", e);
    }

    // Circular shimmer animation loop
    const iv = setInterval(() => {
      setShimmerPosition((prev) => (prev + 5) % 360);
    }, 80);

    return () => clearInterval(iv);
  }, [plaqueData]);

  if (!plaqueData) return null;

  const handleShare = () => {
    setCopied(true);
    navigator.clipboard.writeText(
      `🏆 CRITICAL WIN // Officially Certified: "${plaqueData.track_title}" has just achieved ${plaqueData.certified_streams.toLocaleString()} streams and been awarded a ${plaqueData.award_type}! Presented to ${plaqueData.presentee}.`
    );
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadTemplate = () => {
    setDownloadSuccess(true);
    // Simulate downloading highly detailed printable S3 vector template
    const link = document.createElement("a");
    link.href = "#";
    link.setAttribute("download", `platinum_plaque_${plaqueData.beat_id}.png`);
    setTimeout(() => setDownloadSuccess(false), 3500);
  };

  return (
    <div 
      id="plaque-achievement-overlay" 
      className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto animate-fadeIn select-none"
    >
      {/* Sparkle background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        
        {/* Floating stars */}
        <Sparkles className="absolute top-12 left-1/3 text-purple-400/35 animate-bounce" size={24} />
        <Sparkles className="absolute bottom-20 right-1/3 text-emerald-400/25 animate-pulse" size={32} />
        <Sparkles className="absolute top-1/2 right-12 text-yellow-400/30 animate-bounce" size={16} />
      </div>

      <div className="relative max-w-4xl w-full flex flex-col items-center gap-6 z-10">
        
        {/* Header Ribbon alert */}
        <div className="text-center space-y-1 animate-slideDown">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-purple-950/40 border border-purple-500/35 rounded-full text-purple-300 font-mono text-[10px] uppercase tracking-widest">
            <Trophy size={11} className="text-yellow-400 animate-spin-slow" />
            AUTOMATED PLATINUM MILESTONE CHECKER // APPROVED
          </div>
          <h2 className="text-3xl md:text-5xl font-sans italic tracking-tighter uppercase font-black text-transparent bg-clip-text bg-gradient-to-r from-neutral-100 via-neutral-300 to-white mt-2">
            CRITICAL MILESTONE ACCREDITATION
          </h2>
          <p className="font-mono text-neutral-400 text-xs tracking-wider">
            {plaqueData.message ?? `CRITICAL WIN: ${plaqueData.track_title} has surpassed ${plaqueData.certified_streams.toLocaleString()} streams!`}
          </p>
        </div>

        {/* The Authentic 3D Plaque Container */}
        <div 
          id="visual-rich-award-plaque" 
          className="relative w-full max-w-md aspect-[3/4] bg-neutral-900 border-8 border-neutral-800 rounded-3xl p-6 md:p-8 flex flex-col justify-between items-center shadow-[0_0_80px_rgba(255,255,255,0.06)] overflow-hidden scale-95 md:scale-100 hover:scale-[1.02] active:scale-95 duration-500 cursor-pointer"
          style={{
            backgroundImage: "radial-gradient(circle at 50% 30%, #15161e 0%, #0c0d12 100%)",
            boxShadow: "inset 0 0 40px rgba(0,0,0,0.8), 0 25px 60px -15px rgba(0,0,0,0.9)"
          }}
        >
          {/* Beveled glass protective layer look (Shimmer overlay effect) */}
          <div 
            className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent bg-[length:300%_300%] opacity-80"
            style={{
              backgroundImage: `linear-gradient(${shimmerPosition}deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.04) 45%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 55%, rgba(255,255,255,0) 100%)`
            }}
          />

          {/* Top Label Tag */}
          <div className="flex flex-col items-center text-center mt-2">
            <span className="font-sans text-[8px] tracking-[0.25em] text-neutral-500 uppercase font-bold">CERTIFIED RECORD REVENUE</span>
            <span className="font-sans text-[9px] tracking-widest text-neutral-400 uppercase font-black mt-0.5">VIBEVAULT PRODUCTIONS</span>
          </div>

          {/* Circular Platinum Groove LP Record Disc */}
          <div className="relative w-56 h-56 md:w-64 md:h-64 rounded-full flex items-center justify-center p-0.5 shadow-2xl overflow-hidden group">
            {/* Liquid Platinum reflective back circle */}
            <div 
              className="absolute inset-0 rounded-full bg-gradient-to-tr from-neutral-800 via-neutral-100/40 to-neutral-700 animate-pulse-slow"
              style={{
                transform: `rotate(${shimmerPosition}deg)`,
                backgroundImage: "conic-gradient(from 0deg, #1f2029 0%, #d1d5db 20%, #4b5563 40%, #f3f4f6 50%, #4b5563 60%, #9ca3af 80%, #1f2029 100%)"
              }}
            />

            {/* Subtle Vinyl Grooves overlay lines */}
            <div className="absolute inset-2 rounded-full border border-neutral-900/10" />
            <div className="absolute inset-4 rounded-full border border-neutral-900/15" />
            <div className="absolute inset-6 rounded-full border border-neutral-800/10" />
            <div className="absolute inset-8 rounded-full border border-neutral-900/10" />
            <div className="absolute inset-10 rounded-full border border-neutral-900/20" />
            <div className="absolute inset-12 rounded-full border border-neutral-800/25" />
            <div className="absolute inset-16 rounded-full border border-neutral-900/10" />
            <div className="absolute inset-20 rounded-full border border-neutral-900/15" />
            <div className="absolute inset-24 rounded-full border border-neutral-800/30" />
            <div className="absolute inset-28 rounded-full border border-neutral-900/15" />
            <div className="absolute inset-32 rounded-full border border-neutral-900/20" />
            
            {/* Center Label of the Disc */}
            <div className="relative w-16 h-16 rounded-full bg-neutral-950 border border-neutral-700/60 flex flex-col justify-center items-center shadow-inner text-center p-1">
              {/* Inner design of track */}
              <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 border border-neutral-600 mb-1 z-10" />
              <div className="font-sans text-[5px] text-neutral-400 font-black uppercase tracking-tighter truncate max-w-[55px]">{plaqueData.track_title}</div>
              <div className="font-mono text-[4px] text-purple-400 uppercase mt-0.5 font-bold">145 BPM // G#m</div>
              <div className="font-sans text-[4px] text-neutral-500 uppercase tracking-widest mt-0.5">by tyrox</div>
            </div>
          </div>

          {/* Engraved Silver Metal Plaque Plate on bottom */}
          <div 
            id="engraved-silver-plaque-plate" 
            className="w-full bg-gradient-to-b from-neutral-800 via-neutral-200 to-neutral-400 p-4 rounded-xl border border-neutral-100/20 text-center text-neutral-950 shadow-lg relative flex flex-col items-center justify-center min-h-[110px]"
            style={{
              boxShadow: "0 6px 20px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.7)"
            }}
          >
            {/* Plate screws look */}
            <span className="absolute top-1 px-1 left-1.5 font-mono text-[6px] text-neutral-600 select-none">⊕</span>
            <span className="absolute top-1 px-1 right-1.5 font-mono text-[6px] text-neutral-600 select-none">⊕</span>
            <span className="absolute bottom-1 px-1 left-1.5 font-mono text-[6px] text-neutral-600 select-none">⊕</span>
            <span className="absolute bottom-1 px-1 right-1.5 font-mono text-[6px] text-neutral-600 select-none">⊕</span>

            {/* Plate text */}
            <div className="text-[10px] font-sans font-bold tracking-[0.2em] text-neutral-900 uppercase">
              PRESENTED TO
            </div>
            
            <div className="text-sm md:text-base font-sans font-extrabold tracking-tight text-neutral-950 mt-1 uppercase italic drop-shadow-sm truncate max-w-[280px]">
              {plaqueData.presentee}
            </div>
            
            <p className="text-[8px] md:text-[9px] font-sans font-medium text-neutral-800/90 leading-tight mt-1.5 max-w-[280px]">
              TO CERTIFY THE AUTOMATED DIGITAL RECORD STREAMING MILESTONE OF MORE THAN
              <span className="font-bold text-neutral-950 block text-[9px] md:text-[10px] tracking-wide my-0.5">
                {plaqueData.certified_streams.toLocaleString()} CERTIFIED DIGITAL STREAMS
              </span>
              FOR THE LICENSED CATALOG TRACK MASTER OUTLINE TITLE
            </p>

            <div className="text-[10px] font-sans font-extrabold text-neutral-950 italic mt-1 uppercase max-w-[280px] truncate">
              "{plaqueData.track_title}"
            </div>

            <div className="text-[8px] font-mono font-bold tracking-wider text-purple-900 uppercase mt-2 border-t border-neutral-500/20 pt-1 w-full max-w-[180px]">
              {plaqueData.award_type}
            </div>
          </div>
        </div>

        {/* Secondary Action Toolbar mimicking S3 template delivery */}
        <div className="flex flex-wrap justify-center gap-3 animate-fadeIn mt-2">
          
          <button
            onClick={handleDownloadTemplate}
            disabled={downloadSuccess}
            className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-sans font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-2"
          >
            {downloadSuccess ? (
              <>
                <Sparkles className="text-yellow-400 animate-spin" size={14} />
                Plating Master Generated!
              </>
            ) : (
              <>
                <Download size={14} className="text-purple-400" />
                Download Print Template
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            className="px-5 py-2.5 bg-purple-650 hover:bg-purple-600 text-white text-xs font-sans font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-purple-950/20"
          >
            {copied ? (
              <>
                <Sparkles size={14} className="animate-pulse text-yellow-300" />
                Copied Achievement Link!
              </>
            ) : (
              <>
                <Share2 size={14} className="text-purple-200" />
                Share Certification
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-900 text-neutral-400 hover:text-neutral-200 text-xs font-sans font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
          >
            <X size={14} />
            Close Gallery
          </button>
        </div>
      </div>
    </div>
  );
};
