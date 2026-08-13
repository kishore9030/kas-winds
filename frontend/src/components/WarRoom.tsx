import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldAlert, Cpu, Activity, Shield, Play } from 'lucide-react';

const AI_AGENTS = {
  netops: { name: 'NetOps AI', icon: <Cpu size={16}/>, color: 'var(--c-blue)' },
  secops: { name: 'SecOps AI', icon: <Shield size={16}/>, color: 'var(--c-red)' },
  silicon: { name: 'Silicon AI', icon: <Activity size={16}/>, color: 'var(--c-yellow)' }
};

const SIMULATED_CONVERSATION = [
  { agent: 'netops', text: "I'm detecting intermittent CRC errors and BGP route flapping on the CORE-RTR to EDGE-SW link.", delay: 1000 },
  { agent: 'secops', text: "No volumetric DDoS or firewall ACL violations detected on the perimeter. This isn't a malicious traffic anomaly.", delay: 3000 },
  { agent: 'silicon', text: "I've analyzed the SNMP DOM (Digital Optical Monitoring) data. The Tx bias current on the Gi0/1 SFP+ module has increased by 14% over the last 72 hours just to maintain optical output.", delay: 5500 },
  { agent: 'silicon', text: "Furthermore, the chassis fan RPM shows micro-vibrations indicative of bearing wear. This is a physical laser diode degradation. The transceiver will completely fail in 48 hours.", delay: 8500 },
  { agent: 'netops', text: "Understood. I am gracefully draining BGP traffic off Gi0/1 to the backup link to prevent an outage before the hardware dies.", delay: 11000 },
  { agent: 'netops', text: "Traffic successfully re-routed. Network stability restored. I've automatically created a Jira ticket for SFP replacement.", delay: 13500 },
];

export default function WarRoom({ incident, onClose }: { incident: any, onClose: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startSimulation = () => {
    setIsSimulating(true);
    setMessages([]);
    SIMULATED_CONVERSATION.forEach(msg => {
      setTimeout(() => {
        setMessages(prev => [...prev, msg]);
      }, msg.delay);
    });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', 
      backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px'
    }}>
      <div style={{
        background: 'var(--c-surface)', width: '100%', maxWidth: '800px', height: '100%', maxHeight: '600px',
        borderRadius: '16px', boxShadow: '0 24px 48px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        border: '1px solid var(--c-border)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(90deg, rgba(220,38,38,0.05), transparent)'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <ShieldAlert size={24} color="var(--c-red)"/>
            <div>
              <h2 style={{fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--c-text-bright)'}}>Autonomous War Room</h2>
              <div style={{fontSize: '12px', color: 'var(--c-text-dim)', marginTop: '4px'}}>Incident: {incident?.msg || "Critical Network Outage"}</div>
            </div>
          </div>
          <div style={{display: 'flex', gap: '12px'}}>
            {!isSimulating && (
              <button className="header-btn primary" onClick={startSimulation}>
                <Play size={14}/> Start AI Triangulation
              </button>
            )}
            <button onClick={onClose} className="header-btn" style={{padding: '8px'}}><X size={20}/></button>
          </div>
        </div>

        {/* Chat Area */}
        <div style={{flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--c-bg)'}}>
          
          <div style={{textAlign: 'center', fontSize: '12px', color: 'var(--c-text-dim)', marginBottom: '16px'}}>
            3 Specialized AI Agents have joined the War Room.
          </div>

          {messages.map((msg, i) => {
            const agent = AI_AGENTS[msg.agent as keyof typeof AI_AGENTS];
            return (
              <div key={i} style={{display: 'flex', gap: '12px', alignItems: 'flex-start'}}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px', background: 'var(--c-surface)', 
                  border: `1px solid ${agent.color}`, color: agent.color, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {agent.icon}
                </div>
                <div style={{flex: 1}}>
                  <div style={{fontSize: '12px', fontWeight: 600, color: 'var(--c-text-bright)', marginBottom: '4px'}}>{agent.name}</div>
                  <div style={{
                    background: 'var(--c-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--c-border)',
                    fontSize: '13px', color: 'var(--c-text)', lineHeight: 1.5, boxShadow: 'var(--shadow-sm)'
                  }}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}
          {isSimulating && messages.length < SIMULATED_CONVERSATION.length && (
            <div style={{display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--c-text-dim)', fontSize: '12px'}}>
              <span className="dot dot-green" style={{animation: 'pulse 1s infinite'}}/> Agents are correlating data...
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Footer */}
        {messages.length === SIMULATED_CONVERSATION.length && (
          <div style={{padding: '20px 24px', background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{fontSize: '13px', color: 'var(--c-green)', fontWeight: 600}}>
                ✓ Consensus Reached & Remediation Applied
              </div>
              <button className="header-btn" onClick={onClose}>Close War Room</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
