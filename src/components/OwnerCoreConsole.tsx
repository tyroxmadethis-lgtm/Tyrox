import React, { useState } from 'react';
import { Shield, Music, DollarSign, UploadCloud, Trash2, CheckCircle2 } from 'lucide-react';

interface SoloTrack {
  title: string;
  bpm: string;
  genre: string;
  price: string;
  fileName?: string;
}

interface OwnerCoreConsoleProps {
  addNotification: (msg: string) => void;
}

export const OwnerCoreConsole: React.FC<OwnerCoreConsoleProps> = ({ addNotification }) => {
  const [soloCatalog, setSoloCatalog] = useState<SoloTrack[]>(() => {
    try {
      const saved = localStorage.getItem('vv_solo_catalog');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [trackTitle, setTrackTitle] = useState('');
  const [trackBpm, setTrackBpm] = useState('');
  const [trackGenre, setTrackGenre] = useState('Trap');
  const [trackPrice, setTrackPrice] = useState('29.99');
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    }
  };

  const addTrackToLocalCatalog = () => {
    if (!trackTitle.trim() || !trackBpm.trim() || !trackPrice.trim()) {
      alert("Operator Alert: Please fill out all fields before publishing.");
      return;
    }

    const newTrack: SoloTrack = {
      title: trackTitle.trim(),
      bpm: trackBpm.trim(),
      genre: trackGenre,
      price: trackPrice.trim(),
      fileName: fileName || "cyber_pulse.m4a"
    };

    const updatedCatalog = [newTrack, ...soloCatalog];
    setSoloCatalog(updatedCatalog);
    localStorage.setItem('vv_solo_catalog', JSON.stringify(updatedCatalog));

    // Reset form fields
    setTrackTitle('');
    setTrackBpm('');
    setTrackPrice('29.99');
    setTrackGenre('Trap');
    setFileName('');

    // Trigger system notification
    addNotification(`SUCCESS // Published solo track: "${newTrack.title}"`);
  };

  const deleteSoloTrack = (index: number) => {
    const trackToDelete = soloCatalog[index];
    const updated = soloCatalog.filter((_, i) => i !== index);
    setSoloCatalog(updated);
    localStorage.setItem('vv_solo_catalog', JSON.stringify(updated));
    addNotification(`MEM-RELEASED // Deleted solo track "${trackToDelete.title}"`);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn text-neutral-200 font-sans">
      
      {/* Platform Header Area */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#111217] border border-[#222533] p-6 rounded-xl shadow-lg">
        <div>
          <h1 className="text-2xl md:text-3xl font-sans font-black tracking-tight text-white uppercase">
            VIBEVAULT OWNER CORE
          </h1>
          <p className="text-xs text-neutral-400 mt-1 font-medium">
            Private Single-Operator Ingestion Terminal
          </p>
        </div>
        <div className="bg-purple-900/15 text-purple-400 border border-purple-500/20 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
          <Shield size={12} className="text-purple-400" />
          <span>Verified Solo Admin</span>
        </div>
      </header>

      {/* Two-Column Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        
        {/* LEFT COMPONENT: PRIVATE INGESTION FORM */}
        <main className="lg:col-span-6 bg-[#111217] border border-[#222533] p-5 md:p-6 rounded-xl space-y-5">
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider pb-3 border-b border-[#222533] flex items-center gap-2">
              <UploadCloud size={14} className="text-emerald-400" />
              Upload New Track
            </h2>
          </div>

          <div className="space-y-4">
            
            {/* File upload input */}
            <div className="space-y-1.5 text-left">
              <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                Audio File Source (.AAC / .M4A)
              </label>
              <div className="relative group cursor-pointer">
                <input 
                  type="file" 
                  accept="audio/aac, audio/x-aac, .aac, audio/mp4, .m4a"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                />
                <div className="p-3.5 bg-[#191b22] hover:bg-[#20232c] border border-dashed border-[#222533] rounded-lg transition-all flex flex-col items-center justify-center text-center gap-1">
                  <UploadCloud size={20} className="text-neutral-500 group-hover:text-emerald-400 transition" />
                  {fileName ? (
                    <span className="text-[11px] font-mono font-semibold text-emerald-400 truncate max-w-full">
                      {fileName}
                    </span>
                  ) : (
                    <>
                      <span className="text-[11px] font-semibold text-neutral-300">Choose AAC or M4A master stream</span>
                      <span className="text-[9px] text-neutral-500 font-mono">DRAG AND DROP OR CLICK</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Title field */}
            <div className="space-y-1.5 text-left">
              <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                Beat Title
              </label>
              <input
                type="text"
                id="trackTitle"
                placeholder="e.g., Cyber Pulse"
                value={trackTitle}
                onChange={(e) => setTrackTitle(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#191b22] border border-[#222533] text-sm rounded-lg text-white font-medium placeholder:text-neutral-600 focus:border-emerald-400 outline-none transition"
              />
            </div>

            {/* BPM and Genre fields row */}
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                  Tempo (BPM)
                </label>
                <input
                  type="number"
                  id="trackBpm"
                  placeholder="130"
                  value={trackBpm}
                  onChange={(e) => setTrackBpm(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#191b22] border border-[#222533] text-sm rounded-lg text-white font-mono placeholder:text-neutral-600 focus:border-emerald-400 outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                  Genre Profile
                </label>
                <select
                  id="trackGenre"
                  value={trackGenre}
                  onChange={(e) => setTrackGenre(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#191b22] border border-[#222533] text-sm rounded-lg text-white font-medium focus:border-emerald-400 outline-none cursor-pointer transition"
                >
                  <option value="Trap">Trap</option>
                  <option value="Hip-Hop">Hip-Hop</option>
                  <option value="R&B">R&B</option>
                  <option value="Boom Bap">Boom Bap</option>
                </select>
              </div>
            </div>

            {/* Standard Lease Price field */}
            <div className="space-y-1.5 text-left">
              <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                Standard Lease Price ($ USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 text-sm font-mono font-bold">$</span>
                <input
                  type="number"
                  id="trackPrice"
                  step="0.01"
                  value={trackPrice}
                  onChange={(e) => setTrackPrice(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 bg-[#191b22] border border-[#222533] text-sm rounded-lg text-white font-mono focus:border-emerald-400 outline-none transition"
                />
              </div>
            </div>

            {/* Action Publish button */}
            <button
              onClick={addTrackToLocalCatalog}
              className="w-full py-3 bg-[#00ffcc] hover:bg-[#00e1b5] text-[#07080a] hover:text-black font-black uppercase tracking-wider text-xs rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 mt-2 cursor-pointer shadow-md"
            >
              <Music size={13} fill="currentColor" />
              Publish to Marketplace
            </button>

          </div>
        </main>

        {/* RIGHT COMPONENT: LIVE CATALOG PREVIEW */}
        <aside className="lg:col-span-6 bg-[#111217] border border-[#222533] p-5 md:p-6 rounded-xl space-y-5">
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider pb-3 border-b border-[#222533] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Music size={14} className="text-purple-400 animate-pulse" />
                Active Live Catalog
              </span>
              <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase">
                {soloCatalog.length} Beats Loaded
              </span>
            </h2>
          </div>

          <div className="catalog-list space-y-3 max-h-[460px] overflow-y-auto pr-1" id="catalogTarget">
            {soloCatalog.map((item, index) => (
              <div
                key={index}
                className="bg-[#191b22] border border-[#222533]/80 p-3.5 rounded-lg flex justify-between items-center gap-4 transition hover:border-[#3a3d4f]"
              >
                <div className="item-info min-w-0 flex-1 text-left">
                  <div className="title text-xs md:text-sm font-black text-white truncate text-left uppercase tracking-tight">
                    {item.title}
                  </div>
                  <div className="meta text-[10px] text-neutral-400 mt-1 font-mono uppercase tracking-wider text-left">
                    {item.genre} // {item.bpm} BPM
                    {item.fileName && (
                      <span className="text-[9px] text-neutral-600 block truncate mt-0.5 font-sans lowercase">
                        file: {item.fileName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="item-price text-xs md:text-sm text-[#00ffcc] font-mono font-bold">
                    ${parseFloat(item.price).toFixed(2)}
                  </div>
                  
                  {/* Delete Option to cleanly manage single-operator console catalog memory */}
                  <button
                    onClick={() => deleteSoloTrack(index)}
                    className="p-1 px-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded border border-rose-500/15 transition cursor-pointer"
                    title="Release Stream Memory"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}

            {soloCatalog.length === 0 && (
              <div className="text-center py-12 border border-dashed border-[#222533] rounded-xl space-y-2">
                <Music size={22} className="mx-auto text-neutral-600" />
                <p className="text-xs text-neutral-500 font-mono uppercase">
                  Your store catalog is currently empty.
                </p>
              </div>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
};
