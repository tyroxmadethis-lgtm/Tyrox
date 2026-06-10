import React, { useState, useEffect } from 'react';

interface ScrapedBeat {
  id: string;
  title: string;
  price: string;
  url: string; // Original link format: https://payhip.com
}

export default function AutomatedTracklistStore() {
  const [syncedBeats, setSyncedBeats] = useState<ScrapedBeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<string[]>(["🔄 Ingress node initialized..."]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    async function autoFetchPayhipProducts() {
      try {
        const API_TOKEN = (import.meta as any).env.VITE_APIFY_TOKEN || localStorage.getItem('vv_apify_token') || "YOUR_LIVE_APIFY_ACCOUNT_TOKEN";
        const CREATOR = "tyroxmadethis";

        addLog(`📡 Scanning Payhip catalog on autopilot for creator '${CREATOR}'...`);

        if (!API_TOKEN || API_TOKEN === "YOUR_LIVE_APIFY_ACCOUNT_TOKEN" || API_TOKEN === "YOUR_REAL_APIFY_TOKEN") {
          addLog("📋 [AUTOPILOT] Inactive credentials. Please configure real Apify token to scrape Payhip.");
          await new Promise(resolve => setTimeout(resolve, 1000));
          setSyncedBeats([]);
          return;
        }

        // Construct synchronous scraper endpoint
        const endpoint = `https://api.apify.com/v2/acts/vsekar91~payhip-creator-scraper/run-sync-get-dataset-items?token=${API_TOKEN}`;
        
        addLog(`🛰️ Contacting Apify router: ${endpoint}`);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creators: [CREATOR] })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP Error Status: ${response.status}`);
        }

        const data = await response.json();
        
        if (Array.isArray(data)) {
          const mapped: ScrapedBeat[] = data.map((b: any, index: number) => {
            const rawUrl = b.payhipUrl || b.url || "https://payhip.com";
            // Map standard landing '/b/' paths over to '/co/' format checkout URLs
            const formattedPayhipUrl = typeof rawUrl === 'string' ? rawUrl.replace('/b/', '/co/') : rawUrl;
            return {
              id: b.id || `scraped-${index}`,
              title: b.title || b.name || "Scraped Beat",
              price: b.price || b.amount || "$29.99",
              url: formattedPayhipUrl
            };
          });
          setSyncedBeats(mapped);
          addLog(`🎉 Successfully acquired ${mapped.length} live Payhip products dynamically!`);
        } else {
          addLog("📥 Job completed, empty result returned.");
          setSyncedBeats([]);
        }
      } catch (err: any) {
        console.error("Automated catalog sync failure:", err);
        addLog(`⚠️ Connection Refused: ${err.message || String(err)}`);
        setSyncedBeats([]);
      } finally {
        setLoading(false);
      }
    }

    autoFetchPayhipProducts();
  }, []);

  const triggerBypassCheckout = (payhipUrl: string) => {
    // AUTOMATIC BYPASS: Mutates standard sales links to direct purchase popups
    // This transforms ://payhip.com into ://payhip.com automatically
    const bypassUrl = payhipUrl.replace('/b/', '/co/');
    window.open(bypassUrl, '_blank', 'width=500,height=600');
  };

  if (loading) {
    return (
      <div className="w-full bg-[#0a0a0d] border border-zinc-900 rounded-xl p-8 text-center">
        <span className="text-purple-500 font-mono text-xs uppercase tracking-widest animate-pulse">
          SYNCING CATALOG ON AUTOPILOT...
        </span>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0a0a0d] text-white p-6 rounded-xl border border-zinc-900">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xs font-black tracking-widest text-purple-500 uppercase">Live Synced Catalog</h3>
          <p className="text-[10px] text-zinc-500 font-mono">Micro-store widget with native purchase popup checkout</p>
        </div>
        <span className="text-[9px] font-mono bg-purple-900/40 text-purple-400 px-2.5 py-1 rounded-full border border-purple-800/30">
          Autopilot Active
        </span>
      </div>
      
      <div className="flex flex-col gap-3">
        {syncedBeats.map((beat) => (
          <div key={beat.id} className="flex justify-between items-center bg-[#111116] p-4 rounded-lg border border-zinc-900/60 hover:border-purple-600 transition-colors">
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-wide uppercase">{beat.title}</span>
              <span className="text-[10px] text-zinc-500 font-mono">ID: {beat.id}</span>
            </div>
            
            <button 
              onClick={() => triggerBypassCheckout(beat.url)}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-black px-4 py-2.5 rounded transition-transform active:scale-95 cursor-pointer select-none"
            >
              Buy {beat.price || "Now"}
            </button>
          </div>
        ))}
      </div>

      {/* Embedded Live Diagnostics Log */}
      <div className="mt-4 pt-3 border-t border-zinc-900/60">
        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-1.5">// Autopilot logs</span>
        <div className="bg-black/40 border border-zinc-900 p-2.5 rounded font-mono text-[9px] text-zinc-400 max-h-20 overflow-y-auto space-y-0.5">
          {logs.map((log, idx) => (
            <div key={idx} className="truncate">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
