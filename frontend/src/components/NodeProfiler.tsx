import React from 'react';
import { X, Shield, Activity, Network, HardDrive, Cpu, TerminalSquare } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export default function NodeProfiler({ node, onClose }: { node: any, onClose: () => void }) {
  if (!node) return null;

  const mockCpuData = Array.from({length: 20}, (_, i) => ({ time: i, val: node.cpu + (Math.random() * 10 - 5) }));

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.4)', 
      backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px'
    }}>
      <div style={{
        background: 'var(--c-surface)', width: '100%', maxWidth: '1000px', height: '100%', maxHeight: '700px',
        borderRadius: '12px', boxShadow: '0 24px 48px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          background: 'linear-gradient(to right, rgba(2,132,199,0.05), transparent)'
        }}>
          <div>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px'}}>
              <div style={{width: '48px', height: '48px', borderRadius: '12px', background: 'var(--c-accent-dim)', color: 'var(--c-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <HardDrive size={24}/>
              </div>
              <div>
                <h2 style={{fontSize: '24px', fontWeight: 700, color: 'var(--c-text-bright)', margin: 0}}>{node.hostname}</h2>
                <div style={{fontSize: '13px', color: 'var(--c-text-dim)', display: 'flex', gap: '12px', marginTop: '4px'}}>
                  <span>{node.ip}</span> • <span>{node.vendor} {node.model}</span> • <span>{node.location}</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="header-btn" style={{padding: '8px'}}><X size={20}/></button>
        </div>

        {/* Content */}
        <div style={{flex: 1, overflowY: 'auto', padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', background: 'var(--c-bg)'}}>
          
          {/* Left Col: AI 360 Analysis */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
            <div className="card" style={{borderLeft: '4px solid var(--c-accent)'}}>
              <div className="card-header"><span className="card-title"><Shield size={16}/> AI 360° Contextual Analysis</span></div>
              <div className="card-body">
                {node.status === 'down' ? (
                  <div>
                    <div style={{fontSize: '14px', fontWeight: 600, color: 'var(--c-red)', marginBottom: '8px'}}>CRITICAL: Node Unreachable</div>
                    <p style={{fontSize: '13px', color: 'var(--c-text-dim)', lineHeight: 1.6}}>
                      Omni-AI has correlated 3 recent syslog events indicating an uplink failure prior to ICMP drop. Neighboring node CORE-RTR-01 reported interface Gi0/0/3 transitioned to down state 2 seconds prior.
                    </p>
                  </div>
                ) : node.cpu > 70 ? (
                  <div>
                    <div style={{fontSize: '14px', fontWeight: 600, color: 'var(--c-yellow)', marginBottom: '8px'}}>WARNING: Impending Capacity Exhaustion</div>
                    <p style={{fontSize: '13px', color: 'var(--c-text-dim)', lineHeight: 1.6}}>
                      Predictive analytics detect a linear CPU consumption trend originating from SNMP polling threads. At current slope, node will reach 100% saturation in approximately 7 days.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div style={{fontSize: '14px', fontWeight: 600, color: 'var(--c-green)', marginBottom: '8px'}}>HEALTHY: Baseline Normal</div>
                    <p style={{fontSize: '13px', color: 'var(--c-text-dim)', lineHeight: 1.6}}>
                      Node is operating within 1 standard deviation of historical 30-day baseline. No anomalous NetFlow or syslog patterns detected.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title"><TerminalSquare size={16}/> Auto-Remediation Playbook</span></div>
              <div className="card-body">
                <div style={{background: '#0f172a', padding: '16px', borderRadius: '8px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '12px'}}>
                  <div style={{color: '#94a3b8', marginBottom: '8px'}}># AI-Generated remediation script for {node.hostname}</div>
                  {node.status === 'down' ? (
                    <div>$ ansible-playbook recover_port.yml -e "target=CORE-RTR-01 port=Gi0/0/3"</div>
                  ) : node.cpu > 70 ? (
                    <div>$ ansible-playbook restart_snmpd.yml -l {node.hostname}</div>
                  ) : (
                    <div>$ echo "No remediation required."</div>
                  )}
                </div>
                <button className="header-btn primary" style={{marginTop: '12px', width: '100%', justifyContent: 'center'}}>Execute Playbook</button>
              </div>
            </div>
          </div>

          {/* Right Col: Telemetry & Topology */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
            <div className="card">
              <div className="card-header"><span className="card-title"><Cpu size={16}/> Live Telemetry Predictor</span></div>
              <div className="card-body">
                <div style={{height: '180px'}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockCpuData}>
                      <Area type="monotone" dataKey="val" stroke={node.cpu > 70 ? "var(--c-yellow)" : "var(--c-green)"} fill={node.cpu > 70 ? "var(--c-yellow-dim)" : "var(--c-green-dim)"} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="card" style={{flex: 1}}>
              <div className="card-header"><span className="card-title"><Network size={16}/> Micro-Topology Blast Radius</span></div>
              <div className="card-body" style={{position: 'relative', overflow: 'hidden'}}>
                <svg width="100%" height="100%" viewBox="0 0 400 200" style={{position: 'absolute', top: 0, left: 0}}>
                  <defs>
                    <linearGradient id="linkGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--c-border)" />
                      <stop offset="100%" stopColor="var(--c-accent)" />
                    </linearGradient>
                    <linearGradient id="linkGradRed" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--c-border)" />
                      <stop offset="100%" stopColor="var(--c-red)" />
                    </linearGradient>
                  </defs>
                  
                  {/* Edges */}
                  <path d="M 200 100 Q 120 50 80 80" fill="none" stroke={node.status === 'down' ? "url(#linkGradRed)" : "url(#linkGrad)"} strokeWidth="2" />
                  <path d="M 200 100 Q 280 50 320 80" fill="none" stroke="url(#linkGrad)" strokeWidth="2" />
                  <path d="M 200 100 Q 200 160 200 180" fill="none" stroke="url(#linkGrad)" strokeWidth="2" />

                  {/* Animated Packets */}
                  {node.status !== 'down' && (
                    <>
                      <circle r="3" fill="var(--c-accent)">
                        <animateMotion dur="2s" repeatCount="indefinite" path="M 80 80 Q 120 50 200 100" />
                      </circle>
                      <circle r="3" fill="var(--c-accent)">
                        <animateMotion dur="2.5s" repeatCount="indefinite" path="M 320 80 Q 280 50 200 100" />
                      </circle>
                    </>
                  )}

                  {/* Nodes */}
                  <g transform="translate(80, 80)">
                    <circle r="20" fill="var(--c-surface)" stroke="var(--c-border)" strokeWidth="2" />
                    <text x="0" y="32" textAnchor="middle" fontSize="10" fill="var(--c-text-dim)">SW-01</text>
                  </g>
                  <g transform="translate(320, 80)">
                    <circle r="20" fill="var(--c-surface)" stroke="var(--c-border)" strokeWidth="2" />
                    <text x="0" y="32" textAnchor="middle" fontSize="10" fill="var(--c-text-dim)">SW-02</text>
                  </g>
                  <g transform="translate(200, 180)">
                    <circle r="20" fill="var(--c-surface)" stroke="var(--c-border)" strokeWidth="2" />
                    <text x="0" y="24" textAnchor="middle" fontSize="10" fill="var(--c-text-dim)">Uplink</text>
                  </g>
                  
                  {/* Center Node */}
                  <g transform="translate(200, 100)">
                    <circle r="24" fill="var(--c-surface)" stroke={node.status === 'down' ? 'var(--c-red)' : node.cpu > 70 ? 'var(--c-yellow)' : 'var(--c-green)'} strokeWidth="3" />
                    <text x="0" y="40" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--c-text-bright)">{node.hostname}</text>
                    {node.status === 'down' && (
                       <circle r="40" fill="rgba(220,38,38,0.1)" stroke="var(--c-red)" strokeWidth="1" strokeDasharray="4 4">
                         <animate attributeName="r" values="30;50;30" dur="2s" repeatCount="indefinite" />
                       </circle>
                    )}
                  </g>
                </svg>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
