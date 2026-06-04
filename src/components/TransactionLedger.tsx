import React, { useEffect, useState } from 'react';

interface LedgerItem {
  _id: string;
  trackTitle: string;
  licenseClass: string;
  buyerEmail: string;
  payout: number;
}

export default function TransactionLedger() {
  const [transactions, setTransactions] = useState<LedgerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRealLedger() {
      try {
        const origin = window.location.origin;
        const targetUrl = (!origin || origin === 'null') 
          ? '/api/transactions/live-stream' 
          : `${origin}/api/transactions/live-stream`;
        const res = await fetch(targetUrl);
        const data = await res.json();
        if (data.success) {
          setTransactions(data.ledgerItems || []);
        }
      } catch (err) {
        console.error("Ledger system dropped collection tracking", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRealLedger();
  }, []);

  if (loading) {
    return (
      <div className="text-zinc-500 font-mono text-[10px] p-6 text-center animate-pulse">
        Streaming ledger entries...
      </div>
    );
  }

  return (
    <div className="w-full bg-zinc-950/40 border border-white/5 rounded-xl p-5 shadow-2xl">
      <h3 className="text-[11px] font-bold text-zinc-400 font-mono uppercase tracking-widest mb-4 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
        $ Transaction Ledger (MongoDB Live stream)
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-sans">
          <thead>
            <tr className="border-b border-white/5 text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
              <th className="pb-3 text-left">Track</th>
              <th className="pb-3 text-left">License Class</th>
              <th className="pb-3 text-left">Buyer</th>
              <th className="pb-3 text-right">Payout</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs text-white">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center font-mono text-zinc-650 text-neutral-500">
                  No transactions recorded. System initialized at zero.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx._id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 font-semibold text-neutral-200">{tx.trackTitle}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 bg-purple-950/40 text-purple-400 border border-purple-500/20 text-[9px] rounded font-mono font-medium">
                      {tx.licenseClass}
                    </span>
                  </td>
                  <td className="py-3 text-zinc-400 font-mono text-[10.5px]">{tx.buyerEmail}</td>
                  <td className="py-3 text-right text-cyan-400 font-bold font-mono">
                    ${typeof tx.payout === "number" ? tx.payout.toFixed(2) : parseFloat(tx.payout || "0").toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
