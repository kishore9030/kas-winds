import React, { useState } from 'react';
import { Shield, Send } from 'lucide-react';

export default function RCAView({ alerts, logs, hasData }: any) {
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<{role:string,text:string}[]>([]);

  const handleSendClick = (overrideQuery?: string) => {
    const userMsg = (overrideQuery || query).trim();
    if (!userMsg) return;
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setQuery('');
    // Simulated AI response based on context
    setTimeout(() => {
      let aiReply = generateRCA(userMsg, alerts, logs);
      setChatHistory(prev => [...prev, { role: 'ai', text: aiReply }]);
    }, 600);
  };

  if (!hasData) {
    return (
      <div>
        <div className="workspace-title">AI Root Cause Analysis</div>
        <div className="card"><div className="empty-state"><Shield size={40} style={{opacity:0.4}}/><h3>AI Engine Idle</h3><p>Load sample data to enable AI-driven incident correlation.</p></div></div>
      </div>
    );
  }

  return (
    <div style={{display:'flex', flexDirection:'column', height:'100%'}}>
      <div className="workspace-title">AI Root Cause Analysis — Copilot</div>
      <div className="card" style={{flex:1, display:'flex', flexDirection:'column'}}>
        <div className="card-header">
          <span className="card-title"><Shield size={14}/> Incident Correlation Engine</span>
          <span className="badge badge-green">Local LLM Active (llama3:8b)</span>
        </div>
        {/* Chat Area */}
        <div className="card-body" style={{flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:'12px'}}>
          {chatHistory.length === 0 && (
            <div style={{color:'var(--c-text-dim)', fontSize:'13px', padding:'20px', textAlign:'center'}}>
              <p>Ask the AI to analyze incidents, correlate alerts, or investigate network anomalies.</p>
              <div style={{display:'flex', gap:'8px', justifyContent:'center', marginTop:'12px', flexWrap:'wrap'}}>
                {['Why is DIST-SW-02 down?', 'Correlate all critical alerts', 'What caused the LB pool failure?'].map(s => (
                  <button key={s} className="header-btn" onClick={() => { setQuery(s); handleSendClick(s); }}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {chatHistory.map((msg, i) => (
            <div key={i} style={{
              maxWidth:'80%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              background: msg.role === 'user' ? 'var(--c-accent-dim)' : 'var(--c-surface-hover)',
              border: `1px solid ${msg.role === 'user' ? 'var(--c-accent)' : 'var(--c-border)'}`,
              borderRadius: '8px', padding: '10px 14px', fontSize: '13px',
              lineHeight: '1.6'
            }}>
              {msg.role === 'user' ? (
                <div style={{whiteSpace: 'pre-wrap'}}>{msg.text}</div>
              ) : (
                <div dangerouslySetInnerHTML={{__html: msg.text}} />
              )}
            </div>
          ))}
        </div>
        {/* Input */}
        <div style={{padding:'12px', borderTop:'1px solid var(--c-border)', display:'flex', gap:'8px', background:'var(--c-surface)'}}>
          <input className="form-input" style={{flex:1}} placeholder="Ask AI to analyze..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendClick()}/>
          <button className="header-btn primary" onClick={() => handleSendClick()}><Send size={16}/></button>
        </div>
      </div>
    </div>
  );
}

function generateRCA(query: string, alerts: any[], logs: any[]): string {
  const q = query.toLowerCase();
  
  const formatHeader = (title: string) => `<div style="font-weight:600; color:var(--c-text-bright); margin-bottom:8px; display:flex; align-items:center; gap:6px;"><Shield size="14"/> ${title}</div>`;
  const formatBlock = (content: string) => `<div style="background:rgba(0,0,0,0.2); padding:10px; border-radius:4px; border:1px solid var(--c-border-light); margin-bottom:12px; font-family:'JetBrains Mono', monospace; font-size:12px; color:var(--c-text-dim);">${content}</div>`;
  
  if (q.includes('dist-sw-02') || q.includes('down')) {
    return formatHeader('Root Cause Analysis — DIST-SW-02') +
      `<div style="margin-bottom:8px"><span class="badge badge-red">CRITICAL</span> Node Unreachable (ICMP probe failure)</div>` +
      `<b>Correlated Timeline:</b><br/>` +
      `• 23:42:15 — UPLINK_FAILURE: All uplinks to CORE-RTR-01 are down<br/>` +
      `• 23:42:18 — Interface GigabitEthernet1/0/1 changed state to down<br/><br/>` +
      `<b>AI Conclusion:</b> The AI engine detected that DIST-SW-02 lost both uplink interfaces simultaneously. This is consistent with a physical layer failure (cable/SFP) or an upstream port shutdown on CORE-RTR-01, rather than a device failure.<br/><br/>` +
      `<b>Suggested Remediation Playbook:</b>` +
      formatBlock(`ssh admin@10.10.0.1<br/>enable<br/>show interface status | include Gi0/0/3<br/>show log | include Gi0/0/3`);
  }
  if (q.includes('correlate') || q.includes('critical')) {
    return formatHeader('AI Alert Correlation Summary') +
      `<b>INCIDENT CLUSTER #1 (98% Confidence):</b><br/>` +
      `• DIST-SW-02 unreachable + uplink failure<br/>` +
      `→ <i>Root Cause: Physical link failure on switch uplinks.</i><br/><br/>` +
      `<b>INCIDENT CLUSTER #2 (85% Confidence):</b><br/>` +
      `• LB-PROD-01 CPU at 88% + pool members down<br/>` +
      `→ <i>Root Cause: Backend application server failure causing LB health check timeouts and connection queuing.</i><br/><br/>` +
      `<b>INDEPENDENT ALERTS:</b><br/>` +
      `• FW-EDGE-01 spyware detection — unrelated, isolated security event.`;
  }
  if (q.includes('lb') || q.includes('pool') || q.includes('load balancer')) {
    return formatHeader('Root Cause Analysis — LB-PROD-01') +
      `<b>ISSUE:</b> Virtual server /Common/app_https has 0 active pool members.<br/><br/>` +
      `<b>Correlated Data:</b><br/>` +
      `• LB CPU is at 88% (above 80% threshold).<br/>` +
      `• Pool member 10.10.20.5:443 health monitor failed at 23:41:50.<br/><br/>` +
      `<b>AI Conclusion:</b> Backend application server APP-SRV-01 (10.10.20.5) stopped responding to HTTPS health checks. The LB CPU spike is a secondary symptom caused by connection queuing and aggressive health check retries.<br/><br/>` +
      `<b>Automated Action Available:</b>` +
      `<div style="margin-top:8px"><button class="header-btn primary" onclick="alert('Executing Ansible Playbook: Restart Tomcat on APP-SRV-01...')">Restart APP-SRV-01 Web Service</button></div>`;
  }
  return `I analyzed the current alert and log data for your query: "${query}"<br/><br/>Currently there are ${alerts.length} active alerts and ${logs.length} log entries in the system. Please ask a more specific question about a node, alert, or incident for detailed correlation.`;
}
