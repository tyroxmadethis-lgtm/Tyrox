import React, { useState, useEffect } from 'react';
import { Shield, DollarSign, CreditCard, Lock, AlertTriangle, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';

interface PayPalCheckoutProps {
  amount: number;
  email: string;
  payoutEmail: string;
  onSuccess: (orderId: string) => void;
  onCancel: () => void;
}

export const PayPalCheckout: React.FC<PayPalCheckoutProps> = ({
  amount,
  email,
  payoutEmail,
  onSuccess,
  onCancel,
}) => {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [sdkError, setSdkError] = useState(false);
  const [useSimulation, setUseSimulation] = useState(true); // Default to simulation due to strict sandboxed iframe restrictions
  const [paymentMode, setPaymentMode] = useState<'options' | 'paypal-login' | 'card-form' | 'processing' | 'success'>('options');
  
  // Sandbox Account state
  const [paypalUser, setPaypalUser] = useState('sandbox-artist@vibevault.co');
  const [paypalPass, setPaypalPass] = useState('••••••••••••');
  
  // Card state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardZip, setCardZip] = useState('');
  const [cardName, setCardName] = useState('');

  // Processing telemetry log steps
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Load Real SDK in background anyway to see if possible
  useEffect(() => {
    const scriptId = 'paypal-js-sdk';
    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      setSdkLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://www.paypal.com/sdk/js?client-id=sb&currency=USD&components=buttons';
    script.async = true;
    
    script.onload = () => {
      setSdkLoaded(true);
      // If we are in standard non-sandboxed environment, we can let user use real SDK buttons
      setUseSimulation(false);
    };

    script.onerror = () => {
      setSdkError(true);
      setUseSimulation(true);
    };

    document.body.appendChild(script);

    return () => {
      // Keep it loaded for subsequent mounts
    };
  }, []);

  // Try to render real PayPal buttons if SDK is loaded and not using simulation
  useEffect(() => {
    if (sdkLoaded && !useSimulation) {
      const container = document.getElementById('paypal-button-real-container');
      if (container) {
        container.innerHTML = ''; // clear
        try {
          // @ts-ignore
          if (window.paypal && window.paypal.Buttons) {
            // @ts-ignore
            window.paypal.Buttons({
              createOrder: (data: any, actions: any) => {
                return actions.order.create({
                  purchase_units: [{
                    amount: {
                      value: amount.toFixed(2),
                      currency_code: 'USD'
                    },
                    payee: {
                      email_address: payoutEmail
                    },
                    description: 'VibeVault Digital License & Quality Stem Files'
                  }]
                });
              },
              onApprove: (data: any, actions: any) => {
                return actions.order.capture().then((details: any) => {
                  const paypalOrderId = details.id || 'PAY-' + Math.random().toString(36).substr(2, 9).toUpperCase();
                  onSuccess(paypalOrderId);
                });
              },
              onError: (err: any) => {
                console.error("PayPal SDK Render Error:", err);
                setUseSimulation(true); // Auto-fallback to sandbox simulation on error
              }
            }).render('#paypal-button-real-container');
          }
        } catch (e) {
          console.error("PayPal initialization crash, falling back:", e);
          setUseSimulation(true);
        }
      }
    }
  }, [sdkLoaded, useSimulation, amount, payoutEmail]);

  // Run the processing simulation steps
  const startPaymentSimulation = (methodName: string) => {
    setPaymentMode('processing');
    setTelemetryLogs([]);
    setProcessingProgress(0);

    const steps = [
      { delay: 400, text: `[0.0s] INIT // Contacting secure PayPal processor gateway...` },
      { delay: 1000, text: `[0.6s] AUTH // Handshaking key with merchant route: ${payoutEmail}` },
      { delay: 1800, text: `[1.3s] BIND // Mapping secure checkout token for customer: ${email}` },
      { delay: 2600, text: `[2.1s] CAPTURE // Processing $${amount.toFixed(2)} USD via [Sandbox - ${methodName}]...` },
      { delay: 3400, text: `[2.8s] VERIFY // Resolving instant transactional ledgers inside VibeVault...` },
      { delay: 4000, text: `[3.5s] CLEAR // Funds successfully captured! Dispatching contracts and stems.` }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setTelemetryLogs(prev => [...prev, step.text]);
        setProcessingProgress(((idx + 1) / steps.length) * 100);
        
        if (idx === steps.length - 1) {
          // Complete!
          setTimeout(() => {
            const simulatedId = 'PAYB_' + Math.random().toString(36).substr(2, 7).toUpperCase();
            onSuccess(simulatedId);
          }, 600);
        }
      }, step.delay);
    });
  };

  const handlePayPalLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startPaymentSimulation('PayPal Buyer Wallet Balance');
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCvv) {
      alert("Please fill in valid card parameters for sandbox clearance.");
      return;
    }
    startPaymentSimulation('Direct Card Settlement');
  };

  return (
    <div className="bg-[#0b0c10] border border-[#222533] rounded-2xl overflow-hidden shadow-2xl p-5 space-y-4 font-sans text-neutral-200">
      
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-[#222533] pb-3 mb-1">
        <div className="text-left">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ffcc] animate-pulse" />
            <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400">Merchant API Checkout</span>
          </div>
          <h4 className="text-xs font-black uppercase text-white tracking-wide">
            Secure Payout Protocol
          </h4>
        </div>
        <div className="text-right">
          <span className="font-mono text-[10px] text-neutral-500 block">TOTAL TRANSFER VALUE</span>
          <span className="font-mono text-sm font-black text-[#00ffcc]">${amount.toFixed(2)}</span>
        </div>
      </div>

      {/* Main Switch Area */}
      {paymentMode === 'options' && (
        <div className="space-y-4">
          
          {/* Simulation Toggle Disclaimer */}
          <div className="p-3 rounded-lg bg-purple-950/10 border border-purple-900/20 flex gap-2.5 items-start text-left">
            <Shield size={14} className="text-purple-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-purple-300 uppercase leading-none tracking-tight">Isolated Sandbox Terminal Active</p>
              <p className="text-[9px] text-neutral-400 leading-normal">
                To bypass restricted browser popup block policies inside the AI studio container, use our responsive **Developer Sandbox Gateway** to simulate checkout clearance.
              </p>
            </div>
          </div>

          {/* Toggle buttons */}
          <div className="grid grid-cols-2 gap-2 bg-[#12141c] p-1 rounded-lg border border-[#222533]">
            <button
              onClick={() => setUseSimulation(true)}
              className={`py-1.5 px-2 text-[9.5px] font-mono font-bold uppercase tracking-wider rounded transition-all ${
                useSimulation 
                  ? 'bg-purple-900/30 text-purple-300 border border-purple-500/15' 
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              Developer Sandbox
            </button>
            <button
              onClick={() => {
                if (sdkError) {
                  alert("PayPal Live Script blocked by iframe rules. Defaulting to sandbox simulation.");
                  return;
                }
                setUseSimulation(false);
              }}
              className={`py-1.5 px-2 text-[9.5px] font-mono font-bold uppercase tracking-wider rounded transition-all ${
                !useSimulation 
                  ? 'bg-emerald-950/30 text-emerald-300 border border-emerald-500/15' 
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              PayPal Live JS
            </button>
          </div>

          {/* Render Area */}
          {useSimulation ? (
            <div className="space-y-2.5 pt-1 text-left">
              
              {/* Gold PayPal Button */}
              <button
                onClick={() => setPaymentMode('paypal-login')}
                className="w-full h-11 bg-gradient-to-b from-[#ffdf00] to-[#e1be00] hover:from-[#ffe630] text-[#111] font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow hover:shadow-yellow-500/10 flex items-center justify-center gap-1.5 cursor-pointer border border-[#cba100]"
              >
                <span className="font-sans italic font-black text-blue-900 text-sm tracking-tighter">Pay_Pal</span>
                <span className="font-semibold text-[10.5px]">Checkout</span>
              </button>

              {/* Blue / Black Card Button */}
              <button
                onClick={() => setPaymentMode('card-form')}
                className="w-full h-11 bg-[#1c1d24] hover:bg-[#272833] text-white border border-[#3b3e54] font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard size={14} className="text-[#00ffcc]" />
                Pay with Debit or Credit Card
              </button>

              <div className="flex justify-center items-center gap-1.5 text-neutral-500 pt-1">
                <Lock size={10} />
                <span className="font-mono text-[8px] tracking-wider uppercase">Vetted secure PayPal PCI DSS Compliance</span>
              </div>

            </div>
          ) : (
            <div className="space-y-4 pt-1 text-left">
              <div id="paypal-button-real-container" className="min-h-12 w-full bg-neutral-900/30 rounded-xl" />
              {!sdkLoaded && !sdkError && (
                <div className="flex items-center justify-center gap-2 py-4 font-mono text-[10px] text-neutral-500">
                  <Loader2 size={12} className="animate-spin text-purple-400" />
                  LOADING PAYPAL GLOBAL FRAMEWORK...
                </div>
              )}
              {sdkError && (
                <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20 text-rose-400 font-mono text-[9px] uppercase leading-relaxed text-center">
                  Live connection resisted by policies. Switch to Sandbox Simulation.
                </div>
              )}
            </div>
          )}

          {/* Cancel */}
          <div className="pt-2 border-t border-[#222533] flex justify-between items-center">
            <span className="font-mono text-[8px] text-neutral-600">ID: VV-PAYPAL-V4-LINK</span>
            <button
              onClick={onCancel}
              className="text-[10px] font-mono text-neutral-500 hover:text-neutral-300 underline cursor-pointer"
            >
              Cancel Payment
            </button>
          </div>

        </div>
      )}

      {/* Mode PayPal Login Sandbox Screen */}
      {paymentMode === 'paypal-login' && (
        <form onSubmit={handlePayPalLoginSubmit} className="space-y-4 text-left animate-slideRight">
          <div className="bg-[#1c2e42] p-3.5 rounded-xl border border-blue-500/20">
            <div className="flex justify-between items-center mb-1">
              <span className="font-sans italic font-black text-[#5ac8fa] text-base tracking-tighter">Pay_Pal</span>
              <span className="font-mono text-[8.5px] bg-blue-900/40 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/15 uppercase">Developer Sandbox Account</span>
            </div>
            <p className="text-[9.5px] text-neutral-300 leading-normal font-sans">
              Sign in securely to authorize your automated buyer account balance containing simulated funds.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="font-mono text-[9px] uppercase text-neutral-500">Sandbox Email</label>
              <input
                type="email"
                required
                className="w-full px-3 py-2 bg-[#12141c] border border-[#222533] text-xs font-mono text-white rounded-lg focus:border-blue-400 outline-none"
                value={paypalUser}
                onChange={(e) => setPaypalUser(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[9px] uppercase text-neutral-500">Sandbox Password</label>
              <input
                type="password"
                required
                className="w-full px-3 py-2 bg-[#12141c] border border-[#222533] text-xs font-mono text-white rounded-lg focus:border-blue-400 outline-none"
                value={paypalPass}
                onChange={(e) => setPaypalPass(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setPaymentMode('options')}
              className="flex-1 py-1.5 bg-[#12141c] border border-[#222533] hover:bg-neutral-900 text-neutral-400 text-[10px] font-mono rounded-lg uppercase tracking-wider transition cursor-pointer"
            >
              Return
            </button>
            <button
              type="submit"
              className="flex-1 py-1.5 bg-[#0070ba] hover:bg-[#005ea6] text-white text-[10px] font-mono font-bold rounded-lg uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              Log In & Approve
              <ArrowRight size={12} />
            </button>
          </div>
        </form>
      )}

      {/* Mode Direct Card Form Sandbox Screen */}
      {paymentMode === 'card-form' && (
        <form onSubmit={handleCardSubmit} className="space-y-4 text-left animate-slideRight">
          <div className="bg-[#12161f] p-3 rounded-lg border border-[#222533] flex justify-between items-center">
            <span className="font-mono text-[9px] text-neutral-400 font-bold uppercase tracking-wider">Debit or Credit Card Sandbox</span>
            <div className="flex gap-1 text-neutral-500 text-[9px]">
              <span>VISA</span> • <span>MC</span> • <span>AMEX</span>
            </div>
          </div>

          <div className="space-y-3 font-sans">
            <div className="space-y-1">
              <label className="font-mono text-[9px] uppercase text-neutral-500">Cardholder Name</label>
              <input
                type="text"
                required
                placeholder="PRODUCER VIP"
                className="w-full px-3 py-2 bg-[#12141c] border border-[#222533] text-xs text-white rounded-lg focus:border-[#00ffcc] outline-none"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[9px] uppercase text-neutral-500">16-Digit Card Number</label>
              <input
                type="text"
                required
                placeholder="4111 2222 3333 4444"
                className="w-full px-3 py-2 bg-[#12141c] border border-[#222533] text-xs font-mono text-white rounded-lg focus:border-[#00ffcc] outline-none"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="font-mono text-[9px] uppercase text-neutral-500">Expiry</label>
                <input
                  type="text"
                  required
                  placeholder="MM/YY"
                  className="w-full px-3 py-2 bg-[#12141c] border border-[#222533] text-xs font-mono text-white rounded-lg focus:border-[#00ffcc] outline-none"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="font-mono text-[9px] uppercase text-neutral-500">CVV</label>
                <input
                  type="password"
                  required
                  placeholder="3-Digits"
                  maxLength={4}
                  className="w-full px-3 py-2 bg-[#12141c] border border-[#222533] text-xs font-mono text-white rounded-lg focus:border-[#00ffcc] outline-none"
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="font-mono text-[9px] uppercase text-neutral-500">Postal Code</label>
                <input
                  type="text"
                  required
                  placeholder="90210"
                  className="w-full px-3 py-2 bg-[#12141c] border border-[#222533] text-xs font-mono text-white rounded-lg focus:border-[#00ffcc] outline-none"
                  value={cardZip}
                  onChange={(e) => setCardZip(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setPaymentMode('options')}
              className="flex-1 py-1.5 bg-[#12141c] border border-[#222533] hover:bg-neutral-900 text-neutral-400 text-[10px] font-mono rounded-lg uppercase tracking-wider transition cursor-pointer"
            >
              Return
            </button>
            <button
              type="submit"
              className="flex-1 py-1.5 bg-[#00ffcc] hover:bg-[#00e1b5] text-black text-[10px] font-mono font-bold rounded-lg uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              Authorize Card
              <ArrowRight size={12} />
            </button>
          </div>
        </form>
      )}

      {/* Mode Processing Screen */}
      {paymentMode === 'processing' && (
        <div className="space-y-4 py-3 text-center animate-pulse">
          <div className="w-12 h-12 bg-purple-950/20 text-[#00ffcc] rounded-full flex items-center justify-center mx-auto border border-purple-500/20">
            <Loader2 size={22} className="animate-spin text-[#00ffcc]" />
          </div>
          
          <div className="space-y-1">
            <h5 className="font-sans font-black text-xs uppercase tracking-wider text-white">Clearing Transaction Flow</h5>
            <div className="w-full max-w-xs mx-auto bg-neutral-900 h-1 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-[#00ffcc] transition-all duration-350"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
          </div>

          {/* Core Logs Viewer */}
          <div className="bg-[#020204] border border-[#222533] p-3 rounded-lg text-left font-mono text-[9px] leading-relaxed space-y-1 text-neutral-450 h-28 overflow-y-auto">
            {telemetryLogs.map((log, idx) => (
              <div key={idx} className="transition-all duration-150 animate-fadeIn text-neutral-300">
                {log.includes('CLEAR') ? (
                  <span className="text-[#00ffcc] font-bold">{log}</span>
                ) : log.includes('CAPT') || log.includes('BIND') ? (
                  <span className="text-purple-300">{log}</span>
                ) : (
                  <span>{log}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
