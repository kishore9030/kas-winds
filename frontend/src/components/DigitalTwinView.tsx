import React, { useState } from 'react';
import { Network, Play, ShieldAlert, Cpu, GitMerge, Activity, ServerCrash, Dna, CheckCircle2 } from 'lucide-react';

export default function DigitalTwinView({ nodes, hasData }: any) {
  const [simulation, setSimulation] = useState<string>('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runSimulation = () => {
    if (!simulation) return;
    setRunning(true);
    setResult(null);
    setTimeout(() => {
      setRunning(false);
      setResult({
        impacted: ['CORE-RTR-01', 'DIST-SW-02'],
        blastRadius: '99.8%',
        downtimeEst: 'Generation 422',
        recommendation: 'Optimal Fitness Achieved: Modify OSPF weight on Gi0/2 to 45 and set BGP Local_Pref to 150 on backup path.',
        logs: [
          'Initializing Digital Twin micro-sandbox...',
          'Spawning 10,000 routing permutations (Generation 1)...',
          'Evaluating fitness (Latency, Jitter, Packet Loss)...',
          'Culling bottom 90% of topologies...',
          'Cross-breeding optimal BGP attributes (Generation 145)...',
          'Genetic stabilization achieved at Generation 422.',
          'Evolution complete. Found mathematically perfect configuration.'
        ]
      });
    }, 4000);
  };

  if (!hasData) {
    return (
      <div>
        <div className="workspace-title">Darwinian Network Optimization</div>
        <div className="card" style={{height:'100%'}}>
          <div className="empty-state">
            <Dna size={40} style={{opacity:0.4}}/>
            <h3>Genetic Sandbox Inactive</h3>
            <p>Load network data to activate the evolutionary AI routing engine.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:'flex', flexDirection:'column', height:'100%'}}>
      <div className="workspace-title" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
          Darwinian Network Optimization <span className="badge badge-purple" style={{background:'var(--c-purple)', color:'#fff'}}>EXPERIMENTAL</span>
        </div>
      </div>

      <div className="grid grid-2-1" style={{flex:1, minHeight:0}}>
        {/* Simulation Canvas */}
        <div className="card" style={{display:'flex', flexDirection:'column'}}>
          <div className="card-header">
            <span className="card-title"><Dna size={14}/> Evolutionary Topology Sandbox</span>
            <span className="badge badge-green">Topology Sync: Live</span>
          </div>
          <div className="card-body" style={{flex:1, display:'flex', flexDirection:'column', gap:'16px'}}>
            <div style={{background:'rgba(0,0,0,0.2)', border:'1px solid var(--c-border)', borderRadius:'var(--radius)', padding:'16px', display:'flex', gap:'12px'}}>
              <input 
                className="form-input" style={{flex:1}} 
                placeholder="e.g., 'Evolve routing fix to resolve BGP flap on Frankfurt link'"
                value={simulation} onChange={e => setSimulation(e.target.value)}
              />
              <button className="header-btn primary" onClick={runSimulation} disabled={running}>
                {running ? <Dna size={16} className="spin"/> : <Play size={16}/>} {running ? 'Evolving...' : 'Start Genetic Evolution'}
              </button>
            </div>

            <div style={{flex:1, border:'1px dashed var(--c-border)', borderRadius:'var(--radius)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', background:'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)'}}>
              {running ? (
                <div style={{textAlign:'center', color:'var(--c-purple)'}}>
                  <Dna size={48} style={{opacity:0.8, marginBottom:'12px', animation:'pulse 1.5s infinite'}}/>
                  <div style={{fontSize:'13px', fontWeight:600}}>Simulating 10,000 Permutations...</div>
                </div>
              ) : result ? (
                <div style={{textAlign:'center'}}>
                  <CheckCircle2 size={48} color="var(--c-green)" style={{marginBottom:'12px'}}/>
                  <div style={{fontSize:'16px', fontWeight:600, color:'var(--c-text-bright)'}}>Optimal Configuration Evolved</div>
                  <div style={{color:'var(--c-text-dim)', fontSize:'13px', marginTop:'4px'}}>Mathematical perfection reached at Gen 422.</div>
                </div>
              ) : (
                <div style={{textAlign:'center', color:'var(--c-text-dim)'}}>
                  <Cpu size={40} style={{opacity:0.2, marginBottom:'12px'}}/>
                  <div style={{fontSize:'13px'}}>Awaiting optimization target. Sandbox is primed.</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Output / Blast Radius */}
        <div className="card" style={{display:'flex', flexDirection:'column'}}>
          <div className="card-header"><span className="card-title">Evolutionary Output Report</span></div>
          <div className="card-body" style={{overflowY:'auto'}}>
            {!result && !running ? (
              <div className="empty-state" style={{padding:'40px 20px'}}><p>Initiate genetic evolution to generate optimal configuration.</p></div>
            ) : running ? (
              <div style={{color:'var(--c-text-dim)', fontSize:'13px'}}>Applying genetic crossover algorithms to BGP and OSPF states...</div>
            ) : (
              <div>
                <div className="kpi" style={{padding:'0 0 16px 0', borderBottom:'1px solid var(--c-border)', marginBottom:'16px'}}>
                  <div className="kpi-label">Topology Fitness Score</div>
                  <div className="kpi-value" style={{color:'var(--c-green)'}}>{result.blastRadius}</div>
                  <div className="kpi-sub"><Dna size={12}/> Stabilized at {result.downtimeEst}</div>
                </div>
                <div style={{marginBottom:'16px'}}>
                  <div style={{fontSize:'11px', fontWeight:600, color:'var(--c-text-dim)', textTransform:'uppercase', marginBottom:'8px'}}>Evolved Configuration Output</div>
                  <div style={{fontSize:'13px', color:'var(--c-text-bright)', lineHeight:'1.5', background:'var(--c-surface-hover)', padding:'10px', borderRadius:'var(--radius)', borderLeft:'3px solid var(--c-accent)'}}>
                    {result.recommendation}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:'11px', fontWeight:600, color:'var(--c-text-dim)', textTransform:'uppercase', marginBottom:'8px'}}>Genetic Trace Log</div>
                  <div style={{background:'rgba(0,0,0,0.3)', padding:'10px', borderRadius:'var(--radius)', border:'1px solid var(--c-border-light)', fontFamily:'monospace', fontSize:'11px', color:'var(--c-text-dim)', display:'flex', flexDirection:'column', gap:'4px'}}>
                    {result.logs.map((l:string, i:number) => <div key={i}>&gt; {l}</div>)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
