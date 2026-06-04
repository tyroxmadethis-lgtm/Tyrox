import React, { useEffect, useState } from 'react';

export function FinancialTelemetryStream() {
  // Initialize every metric strictly at ZERO on boot up
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    licensesDistributed: 0,
    verifiedAcquisitions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function streamLiveTelemetry() {
      try {
        // Fetch from the live API route we built in the last step
        const origin = window.location.origin;
        const absoluteUrl = (!origin || origin === 'null') 
          ? '/api/analytics/live-telemetry' 
          : `${origin}/api/analytics/live-telemetry`;
        const response = await fetch(absoluteUrl);
        const data = await response.json();
        
        if (data.success) {
          setMetrics(data.metrics || { totalSales: 0, licensesDistributed: 0, verifiedAcquisitions: 0 });
        }
      } catch (error) {
        console.error("Telemetry failed to hook into system server", error);
      } finally {
        setLoading(false);
      }
    }

    streamLiveTelemetry();
    
    // Set up a clean streaming polling interval to keep metrics in perfect sync
    const interval = setInterval(streamLiveTelemetry, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-zinc-950 p-6 rounded-2xl border border-white/5 relative overflow-hidden">
      {/* Absolute top grid layout with link status marker */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-white font-mono flex items-center gap-2">
            📊 Core Financial Telemetry
          </h2>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">MongoDB Analytics Data Pipeline Active</p>
        </div>
        <span className="flex items-center gap-2 text-[10px] font-mono bg-emerald-950/50 text-emerald-405 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          SERVER LINKED
        </span>
      </div>

      {/* Grid containing your three analytic data anchors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* CARD 1: Total Sales Revenue */}
        <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-5 select-none hover:border-purple-500/20 transition-colors">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Total Accumulated Store Sales</p>
          <p className="text-3xl font-black text-white mt-2 font-mono">
            ${metrics.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* CARD 2: Active Distributed Track Licenses */}
        <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-5 select-none hover:border-purple-500/20 transition-colors">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Active Licenses Distributed</p>
          <p className="text-3xl font-black text-white mt-2 font-mono">
            {metrics.licensesDistributed} UNITS
          </p>
        </div>

        {/* CARD 3: Human Free Download Acquisitions */}
        <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-5 select-none hover:border-purple-500/20 transition-colors">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Verified Download Acquisitions</p>
          <p className="text-3xl font-black text-purple-400 mt-2 font-mono">
            {metrics.verifiedAcquisitions} BINARY
          </p>
        </div>

      </div>
    </div>
  );
}

export default FinancialTelemetryStream;
