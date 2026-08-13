import React, { useState, useEffect, useRef } from 'react';
import { Terminal, ArrowRight, CheckCircle, Search, Server } from 'lucide-react';

export default function IntentPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsProcessing(true);
    // Simulate AI parsing intent
    setTimeout(() => {
      setIsProcessing(false);
      setResult({
        intent: "Simulate a failure on the primary Frankfurt link and calculate business impact",
        targets: ["Frankfurt Core (CORE-FRA-01)", "AWS Direct Connect", "Branch SD-WAN Edges"],
        actions: [
          "BGP will successfully reconverge to the backup MPLS link in 4.2 seconds",
          "WARNING: Backup link capacity (100Mbps) cannot handle current live traffic load (340Mbps)",
          "Resulting bandwidth saturation will drop 70% of E-Commerce traffic",
          "FINANCIAL RISK: Estimated $45,000/hour revenue loss"
        ]
      });
    }, 1500);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.4)', 
      backdropFilter: 'blur(4px)', zIndex: 11000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh'
    }} onClick={onClose}>
      
      <div style={{
        width: '100%', maxWidth: '750px', background: 'var(--c-surface)', borderRadius: '12px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.3)', overflow: 'hidden', border: '1px solid var(--c-border)'
      }} onClick={e => e.stopPropagation()}>
        
        <form onSubmit={handleSubmit} style={{display: 'flex', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--c-border)', background: 'var(--c-bg)'}}>
          <Terminal size={20} color="var(--c-accent)" style={{marginRight: '12px'}}/>
          <input 
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Simulate an outage... (e.g. 'Simulate Frankfurt link failure and calculate business impact')"
            style={{
              flex: 1, border: 'none', background: 'transparent', outline: 'none',
              fontSize: '18px', color: 'var(--c-text-bright)', fontWeight: 500
            }}
          />
          <div style={{fontSize: '11px', color: 'var(--c-text-dim)', border: '1px solid var(--c-border)', padding: '2px 6px', borderRadius: '4px'}}>
            ESC to close
          </div>
        </form>

        {isProcessing && (
          <div style={{padding: '32px', textAlign: 'center', color: 'var(--c-text-dim)'}}>
            <div className="dot dot-green" style={{animation: 'pulse 1s infinite', width: '12px', height: '12px', margin: '0 auto 12px auto'}}/>
            Analyzing BGP tables, current traffic loads, and application flows...
          </div>
        )}

        {result && (
          <div style={{padding: '24px', background: 'var(--c-surface)'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--c-green)', fontWeight: 600, marginBottom: '16px'}}>
              <CheckCircle size={18}/> Predictive Analysis Complete
            </div>
            
            <div className="grid grid-2" style={{gap: '24px'}}>
              <div>
                <div style={{fontSize: '12px', color: 'var(--c-text-dim)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600}}>Target Devices</div>
                {result.targets.map((t: string, i: number) => (
                  <div key={i} style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'var(--c-bg)', borderRadius: '6px', marginBottom: '8px', fontSize: '13px', color: 'var(--c-text)'}}>
                    <Server size={14} color="var(--c-accent)"/> {t}
                  </div>
                ))}
              </div>
              
              <div>
                <div style={{fontSize: '12px', color: 'var(--c-text-dim)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600}}>Predictive Discoveries</div>
                {result.actions.map((a: string, i: number) => (
                  <div key={i} style={{display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px', borderLeft: '2px solid var(--c-accent)', marginBottom: '8px', fontSize: '13px', color: 'var(--c-text)'}}>
                    <ArrowRight size={14} style={{marginTop: '2px', color: 'var(--c-accent)'}}/>
                    {a}
                  </div>
                ))}
              </div>
            </div>

            <div style={{marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
              <button className="header-btn" onClick={onClose}>Cancel</button>
              <button className="header-btn primary" onClick={onClose}>Generate Executive Risk Report</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
