import React from 'react';
import { useStore } from '../context/StoreContext';
import { Layers, Sliders, Music, Zap, FileText, CheckCircle2 } from 'lucide-react';

export const ServicesView: React.FC = () => {
  const { setActiveTab } = useStore();

  return (
    <div id="services-page-view" className="py-12 px-4 md:px-8 max-w-5xl mx-auto pt-6 flex flex-col gap-10 min-h-screen text-neutral-100">
      
      {/* Sleek Header Block */}
      <div className="border-b border-neutral-900 pb-5">
        <span className="font-mono text-[9px] uppercase tracking-widest text-red-500 font-bold block mb-1">
          PROFESSIONAL AUDIOPHILLIC ENGAGEMENT
        </span>
        <h1 className="text-2xl md:text-4xl font-sans font-black tracking-tight text-white uppercase select-none">
          SERVICES SUITE
        </h1>
        <p className="text-neutral-500 font-sans text-xs mt-1">
          High-tier industry deliverance ranging from custom production arrangements to final commercial master loudness processing.
        </p>
      </div>

      {/* Services Grid matching the exact content requirements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Exclusive Beats */}
        <div className="bg-[#090a0f] border border-neutral-900 rounded-2xl p-6 flex flex-col justify-between hover:border-red-500/20 active:scale-[0.99] transition duration-300 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full blur-[30px] pointer-events-none group-hover:bg-red-600/10 transition" />
          <div className="space-y-4">
            <div className="w-10 h-10 bg-red-950/40 text-red-400 rounded-lg flex items-center justify-center border border-red-500/20">
              <Music size={18} />
            </div>
            <div>
              <h3 className="font-sans font-black text-sm uppercase tracking-wider text-white">Exclusive Beats</h3>
              <p className="font-sans text-xs text-neutral-400 mt-2.5 leading-relaxed">
                Full ownership rights to premium Phonk-Metal instrumentals engineered for direct commercial release. Includes stems and complete licensing.
              </p>
            </div>
            <ul className="text-[10px] space-y-2 font-mono text-neutral-500">
              <li className="flex items-center gap-1.5"><CheckCircle2 size={10} className="text-red-500" /> Untagged WAV master</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 size={10} className="text-red-500" /> Track Stems multitracks</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 size={10} className="text-red-500" /> Exclusive publishing license</li>
            </ul>
          </div>
          <div className="mt-8 pt-4 border-t border-neutral-950/80">
            <button
              onClick={() => setActiveTab('storefront')}
              className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-sans font-bold text-[10px] uppercase tracking-wider rounded transition"
            >
              Browse Beat Store
            </button>
          </div>
        </div>

        {/* Card 2: Custom Production */}
        <div className="bg-[#090a0f] border border-neutral-900 rounded-2xl p-6 flex flex-col justify-between hover:border-purple-500/20 active:scale-[0.99] transition duration-300 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/5 rounded-full blur-[30px] pointer-events-none group-hover:bg-purple-600/10 transition" />
          <div className="space-y-4">
            <div className="w-10 h-10 bg-purple-950/40 text-purple-400 rounded-lg flex items-center justify-center border border-purple-500/20">
              <Zap size={18} />
            </div>
            <div>
              <h3 className="font-sans font-black text-sm uppercase tracking-wider text-white">Custom Production</h3>
              <p className="font-sans text-xs text-neutral-400 mt-2.5 leading-relaxed">
                Tailor-made project structures built completely around your unique vocal arrangement, brand direction, and style pacing.
              </p>
            </div>
            <ul className="text-[10px] space-y-2 font-mono text-neutral-500">
              <li className="flex items-center gap-1.5"><CheckCircle2 size={10} className="text-purple-500" /> Fully custom composition</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 size={10} className="text-purple-500" /> 1-on-1 revision cycle</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 size={10} className="text-purple-500" /> 100% royalty lease structure</li>
            </ul>
          </div>
          <div className="mt-8 pt-4 border-t border-neutral-950/80">
            <button
              onClick={() => setActiveTab('contact')}
              className="w-full py-2 bg-neutral-900 hover:bg-neutral-850 text-purple-400 border border-purple-500/10 hover:border-purple-500/30 text-xs font-mono font-bold tracking-widest uppercase rounded transition"
            >
              Request Custom Quote
            </button>
          </div>
        </div>

        {/* Card 3: Mixing & Mastering */}
        <div className="bg-[#090a0f] border border-neutral-900 rounded-2xl p-6 flex flex-col justify-between hover:border-red-500/20 active:scale-[0.99] transition duration-300 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full blur-[30px] pointer-events-none group-hover:bg-red-600/10 transition" />
          <div className="space-y-4">
            <div className="w-10 h-10 bg-red-950/40 text-red-400 rounded-lg flex items-center justify-center border border-red-500/20">
              <Sliders size={18} />
            </div>
            <div>
              <h3 className="font-sans font-black text-sm uppercase tracking-wider text-white">Mixing & Mastering</h3>
              <p className="font-sans text-xs text-neutral-400 mt-2.5 leading-relaxed">
                Aggressive sidechain management and high-end loudness processing built to maximize impact and punch on all stream platforms.
              </p>
            </div>
            <ul className="text-[10px] space-y-2 font-mono text-neutral-500">
              <li className="flex items-center gap-1.5"><CheckCircle2 size={10} className="text-red-500" /> Vocal tuning & editing</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 size={10} className="text-red-500" /> High-impact -4 LUFS processing</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 size={10} className="text-red-500" /> Delivery in lossless formats</li>
            </ul>
          </div>
          <div className="mt-8 pt-4 border-t border-neutral-950/80">
            <button
              onClick={() => setActiveTab('contact')}
              className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-sans font-bold text-[10px] uppercase tracking-wider rounded transition"
            >
              Order Audio Checkup
            </button>
          </div>
        </div>

      </div>

      {/* Contracts & License Safeguard banner */}
      <div className="rounded-xl border border-neutral-900 bg-[#06060c] p-6 space-y-3">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-red-500" />
          <h4 className="font-sans font-black text-xs uppercase tracking-wide text-white">Industry Best Practice Standard</h4>
        </div>
        <p className="text-[11px] font-sans text-neutral-400 leading-relaxed">
          All service deals come packaged with digital, legally binding licensing contracts issued immediately upon fulfillment. We support role-based pre-cleared master paths with immediate integration with the <strong>ANR & Label portal and API endpoints</strong> for faster releases.
        </p>
      </div>

    </div>
  );
};
