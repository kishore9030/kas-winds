import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Sparkles, Activity, ShieldAlert, Cpu } from 'lucide-react';
import { AreaChart, Area, XAxis, ResponsiveContainer } from 'recharts';

export default function OmniAI({ currentView, globalData }: { currentView: string, globalData: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<{role:string, text:string, type?: string}[]>([]);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isOpen]);

  // Generate initial context greeting based on the current view
  useEffect(() => {
    if (isOpen && chatHistory.length === 0) {
      let greeting = "Hello! I am your Omni-AI Analyst. How can I help you today?";
      if (currentView === 'nta') greeting = "I see you are viewing Network Traffic. Would you like me to analyze the top talkers for anomalous bandwidth patterns?";
      if (currentView === 'logs') greeting = "I'm monitoring the live syslog feed. Do you want me to correlate any recent critical events?";
      if (currentView === 'inventory') greeting = "I'm analyzing your node inventory. Should I predict any impending hardware failures based on current telemetry?";
      
      setChatHistory([{ role: 'ai', text: greeting }]);
    }
  }, [isOpen, currentView]);

  const handleSend = () => {
    if (!query.trim()) return;
    const userMsg = query.trim();
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setQuery('');
    
    setTimeout(() => {
      let aiResponse = generateOmniResponse(userMsg, currentView, globalData);
      setChatHistory(prev => [...prev, aiResponse]);
    }, 800);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: '24px', right: '24px', width: '60px', height: '60px', 
          borderRadius: '30px', background: 'linear-gradient(135deg, var(--c-accent), #2563eb)',
          color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(37,99,235,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, transition: 'transform 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Sparkles size={24} style={{margin: 'auto'}}/>
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', width: '380px', height: '600px',
      background: 'var(--c-surface)', borderRadius: '12px', boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
      display: 'flex', flexDirection: 'column', zIndex: 9999, overflow: 'hidden', border: '1px solid var(--c-border)'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px', background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <div style={{width: '32px', height: '32px', borderRadius: '8px', background: 'var(--c-accent-dim)', color: 'var(--c-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Bot size={20}/>
          </div>
          <div>
            <div style={{fontWeight: 600, fontSize: '14px', color: 'var(--c-text-bright)'}}>Omni-AI Analyst</div>
            <div style={{fontSize: '11px', color: 'var(--c-green)', display: 'flex', alignItems: 'center', gap: '4px'}}>
              <span className="dot dot-green" style={{width: '6px', height: '6px', marginRight: 0}}/> Context Sync: Active
            </div>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} style={{background: 'none', border: 'none', color: 'var(--c-text-dim)', cursor: 'pointer'}}>
          <X size={20}/>
        </button>
      </div>

      {/* Chat Area */}
      <div style={{flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--c-bg)'}}>
        {chatHistory.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%', background: msg.role === 'user' ? 'var(--c-accent)' : 'var(--c-surface)',
            color: msg.role === 'user' ? '#fff' : 'var(--c-text)', border: msg.role === 'user' ? 'none' : '1px solid var(--c-border)',
            padding: '12px', borderRadius: '12px', borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
            borderBottomLeftRadius: msg.role === 'user' ? '12px' : '4px', fontSize: '13px', lineHeight: '1.5',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div dangerouslySetInnerHTML={{__html: msg.text}} />
            
            {/* Generative UI Components */}
            {msg.type === 'chart_bandwidth' && (
              <div style={{marginTop: '12px', height: '120px', background: 'var(--c-bg)', borderRadius: '8px', padding: '8px'}}>
                 <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={globalData.traffic?.slice(0,10) || []}>
                    <Area type="monotone" dataKey="inbound" stroke="var(--c-accent)" fill="var(--c-accent-dim)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            {msg.type === 'playbook' && (
              <div style={{marginTop: '12px', background: '#0f172a', color: '#38bdf8', padding: '10px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px'}}>
                $ ansible-playbook isolate_host.yml -e "host=10.10.0.45"
              </div>
            )}
          </div>
        ))}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input */}
      <div style={{padding: '16px', background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)'}}>
        <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
          <input 
            value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask Omni-AI..." 
            style={{
              width: '100%', padding: '12px 40px 12px 16px', borderRadius: '24px', border: '1px solid var(--c-border)',
              outline: 'none', fontSize: '13px', background: 'var(--c-bg)', color: 'var(--c-text-bright)'
            }}
          />
          <button onClick={handleSend} style={{
            position: 'absolute', right: '6px', width: '32px', height: '32px', borderRadius: '50%',
            background: 'var(--c-accent)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <Send size={14}/>
          </button>
        </div>
      </div>
    </div>
  );
}

function generateOmniResponse(query: string, view: string, _data: any) {
  const q = query.toLowerCase();
  
  if (q.includes("analyze") && view === 'nta') {
    return {
      role: 'ai',
      type: 'chart_bandwidth',
      text: `<b>Generative Insight:</b> I analyzed the top talker streams. <b>10.10.40.5</b> is consuming 45% of WAN bandwidth doing a database replication. Here is the real-time anomaly isolation chart:`
    };
  }
  
  if (q.includes("isolate") || q.includes("fix")) {
    return {
      role: 'ai',
      type: 'playbook',
      text: `I have generated the necessary zero-trust isolation playbook. Would you like to execute this against the edge switch?`
    };
  }

  return {
    role: 'ai',
    text: `Based on your current view (<b>${view}</b>), I am continuously correlating telemetry. Please provide a specific query or node name to investigate deeper.`
  };
}
