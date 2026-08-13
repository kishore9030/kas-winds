import React, { useState } from 'react';
import { Search, Filter, AlertTriangle, Info, XCircle, Shield, ChevronDown, ChevronRight, Save } from 'lucide-react';

export default function LogView({ logs }: { logs: any[] }) {
  const [sevFilter, setSevFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [editPayload, setEditPayload] = useState<string>('');
  const [localEnrichments, setLocalEnrichments] = useState<Record<number, any>>({});
  
  const [showInjectModal, setShowInjectModal] = useState(false);
  const [rawInjectText, setRawInjectText] = useState('');
  const [isInjecting, setIsInjecting] = useState(false);

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertName, setAlertName] = useState('');
  const [alertConnectors, setAlertConnectors] = useState<string[]>(['msteams']);
  const [isAdvancedJSON, setIsAdvancedJSON] = useState(false);
  const [advancedJSON, setAdvancedJSON] = useState(`[
  {
    "type": "keephq",
    "project_id": "network_ops",
    "auth_token": "pk_12345",
    "actions": {
      "firing": {
        "endpoint": "https://api.keephq.dev/v1/incidents/trigger",
        "payload_template": { "status": "triggered", "message": "Node {{source}} is DOWN" }
      },
      "recover": {
        "endpoint": "https://api.keephq.dev/v1/incidents/resolve",
        "payload_template": { "status": "resolved", "message": "Node {{source}} RECOVERED" }
      }
    }
  }
]`);
  const [isSavingAlert, setIsSavingAlert] = useState(false);

  const filtered = logs.filter(l => {
    if (sevFilter !== 'all' && l.severity !== sevFilter) return false;
    
    // Kibana-style Query Parser for UI Filtering
    if (searchTerm) {
      const parts = searchTerm.split(' ');
      let matches = true;
      for (const part of parts) {
        if (!part) continue;
        if (part.includes(':')) {
          const [k, v] = part.split(':');
          const valToCheck = l.enriched_data?.[k] || (l as any)[k];
          if (!valToCheck || String(valToCheck).toLowerCase() !== v.toLowerCase()) {
            matches = false;
            break;
          }
        } else {
          if (!l.msg.toLowerCase().includes(part.toLowerCase()) && 
              !l.source.toLowerCase().includes(part.toLowerCase()) && 
              !JSON.stringify(l.enriched_data || {}).toLowerCase().includes(part.toLowerCase())) {
            matches = false;
            break;
          }
        }
      }
      if (!matches) return false;
    }
    return true;
  });

  const handleExpand = (i: number, originalData: any) => {
    if (expandedLog === i) {
      setExpandedLog(null);
    } else {
      setExpandedLog(i);
      setEditPayload(JSON.stringify(localEnrichments[i] || originalData, null, 2));
    }
  };

  const handleSaveEnrichment = (i: number) => {
    try {
      const parsed = JSON.parse(editPayload);
      setLocalEnrichments(prev => ({ ...prev, [i]: parsed }));
      alert('Enrichment saved successfully!');
    } catch (e) {
      alert('Invalid JSON formatting. Please check your syntax.');
    }
  };

  const handleInject = async () => {
    if (!rawInjectText.trim()) return;
    setIsInjecting(true);
    try {
      const token = localStorage.getItem('kas_token');
      // If we are completely offline and playing with mock data, just add to local state
      if (!token) {
        alert('You are in offline mode. Connect the Postgres backend to test the AI Auto-Decoder API!');
        setIsInjecting(false);
        return;
      }
      
      const res = await fetch('http://localhost:8000/api/logs/ingest_smart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ raw_text: rawInjectText })
      });
      if (res.ok) {
        alert('Log ingested and parsed successfully! Refreshing feed...');
        setShowInjectModal(false);
        setRawInjectText('');
        window.location.reload(); // Quick refresh to pull new DB state
      } else {
        alert('Ingestion failed: ' + await res.text());
      }
    } catch (e: any) {
      alert('Error injecting log: ' + e.message);
    } finally {
      setIsInjecting(false);
    }
  };

  const handleSaveAlert = async () => {
    let finalConnectors: any[] = alertConnectors;
    
    if (isAdvancedJSON) {
      try {
        finalConnectors = JSON.parse(advancedJSON);
        if (!Array.isArray(finalConnectors)) {
          alert("Advanced JSON must be an array of connector objects.");
          return;
        }
      } catch (e) {
        alert("Invalid JSON format in the Advanced Editor.");
        return;
      }
    } else if (alertConnectors.length === 0) {
      alert("Please select at least one connector.");
      return;
    }

    if (!alertName.trim() || !searchTerm.trim()) {
      alert("Please provide a name and ensure you have a search query.");
      return;
    }
    
    setIsSavingAlert(true);
    try {
      const token = localStorage.getItem('kas_token');
      const res = await fetch('http://localhost:8000/api/alerts/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: alertName, query_string: searchTerm, connectors: finalConnectors })
      });
      if (res.ok) {
        alert('Alert Policy created! Any new logs matching this query will be routed to your connectors.');
        setShowAlertModal(false);
        setAlertName('');
      } else {
        alert('Failed to save alert: ' + await res.text());
      }
    } catch (e: any) {
      alert('Error saving alert: ' + e.message);
    } finally {
      setIsSavingAlert(false);
    }
  };

  if (logs.length === 0) {
    return <div className="card" style={{height:'100%'}}><div className="empty-state"><Info size={40} style={{opacity:0.4}}/><h3>No Syslog Data</h3><p>Configure syslog receivers or load sample data to view logs.</p></div></div>;
  }

  return (
    <div style={{position: 'relative'}}>
      {showInjectModal && (
        <div style={{position:'absolute', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div className="card" style={{width:'500px'}}>
            <div className="card-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span className="card-title">Zero-Touch AI Ingestion Test</span>
              <button onClick={() => setShowInjectModal(false)} style={{background:'none',border:'none',color:'var(--c-text-dim)',cursor:'pointer'}}><XCircle size={16}/></button>
            </div>
            <div className="card-body">
              <p style={{fontSize:'12px', color:'var(--c-text-dim)', marginBottom:'12px'}}>
                Paste a raw, unstructured log line here. The backend will attempt fast regex parsing first. If it fails, it will send the string to the Local LLM AI Auto-Decoder to infer the schema and extract JSON dynamically.
              </p>
              <textarea 
                className="form-input" 
                value={rawInjectText} 
                onChange={e => setRawInjectText(e.target.value)} 
                rows={5} 
                placeholder="Example: %SYS-5-CONFIG_I: Configured from console by admin on vty0 (10.0.0.1) OR paste a messy Java stack trace..."
                style={{width:'100%', resize:'vertical'}}
              />
              <div style={{display:'flex', justifyContent:'flex-end', marginTop:'12px', gap:'8px'}}>
                <button className="header-btn" onClick={() => setShowInjectModal(false)}>Cancel</button>
                <button className="header-btn primary" onClick={handleInject} disabled={isInjecting}>
                  {isInjecting ? 'Analyzing...' : 'Ingest & Decode'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAlertModal && (
        <div style={{position:'absolute', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div className="card" style={{width:'500px'}}>
            <div className="card-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span className="card-title">Create Query Alert</span>
              <button onClick={() => setShowAlertModal(false)} style={{background:'none',border:'none',color:'var(--c-text-dim)',cursor:'pointer'}}><XCircle size={16}/></button>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Alert Name</label>
                <input className="form-input" value={alertName} onChange={e => setAlertName(e.target.value)} placeholder="e.g. Critical Firewall Threats" />
              </div>
              <div className="form-group">
                <label className="form-label">Trigger Query (from search bar)</label>
                <input className="form-input" value={searchTerm} disabled style={{opacity:0.7}} />
              </div>
              <div className="form-group">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px'}}>
                  <label className="form-label" style={{marginBottom:0}}>Action: Send To Connectors</label>
                  <label style={{fontSize:'11px', color:'var(--c-text-dim)', display:'flex', alignItems:'center', gap:'4px', cursor:'pointer'}}>
                    <input type="checkbox" checked={isAdvancedJSON} onChange={e => setIsAdvancedJSON(e.target.checked)} />
                    Advanced JSON (KeepHQ / Adaptive Cards)
                  </label>
                </div>
                
                {!isAdvancedJSON ? (
                  <div style={{display:'flex', gap:'12px', flexWrap:'wrap', marginTop:'8px'}}>
                    {['msteams', 'jira', 'smax', 'email'].map(conn => (
                      <label key={conn} style={{display:'flex', alignItems:'center', gap:'4px', fontSize:'12px', color:'var(--c-text-bright)'}}>
                        <input type="checkbox" checked={alertConnectors.includes(conn)} onChange={(e) => {
                          if (e.target.checked) setAlertConnectors([...alertConnectors, conn]);
                          else setAlertConnectors(alertConnectors.filter(c => c !== conn));
                        }}/>
                        {conn.toUpperCase()}
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea 
                    className="form-input" 
                    rows={8} 
                    value={advancedJSON} 
                    onChange={e => setAdvancedJSON(e.target.value)}
                    style={{width:'100%', fontFamily:'monospace', fontSize:'12px', resize:'vertical', marginTop:'4px'}}
                    placeholder="Enter JSON array of webhook payloads..."
                  />
                )}
              </div>
              <div style={{display:'flex', justifyContent:'flex-end', marginTop:'16px', gap:'8px'}}>
                <button className="header-btn" onClick={() => setShowAlertModal(false)}>Cancel</button>
                <button className="header-btn primary" onClick={handleSaveAlert} disabled={isSavingAlert}>
                  {isSavingAlert ? 'Saving...' : 'Save Alert Policy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="workspace-title" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <span>Log Viewer — Syslog & Event Logs</span>
        <button className="header-btn" style={{borderColor:'var(--c-accent)', color:'var(--c-accent)'}} onClick={() => setShowInjectModal(true)}>+ Inject Raw Log (AI Test)</button>
      </div>
      {/* Controls */}
      <div style={{display:'flex', gap:'8px', marginBottom:'12px', flexWrap:'wrap'}}>
        <div className="search-box" style={{display:'flex', alignItems:'center', background:'var(--c-surface)', border:'1px solid var(--c-border)', borderRadius:'4px', paddingRight:'4px'}}>
          <Search size={14} style={{marginLeft:'8px', color:'var(--c-text-dim)'}}/>
          <input className="form-input" style={{border:'none', width:'320px'}} placeholder="Kibana Query (e.g. severity:critical facility:JVM)" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
          <button className="header-btn primary" style={{padding:'4px 8px', fontSize:'11px'}} onClick={() => {
            if (!searchTerm) alert('Please enter a query first!');
            else setShowAlertModal(true);
          }}>Create Alert</button>
        </div>
        {['all','critical','warning','info'].map(s => (
          <button key={s} onClick={() => setSevFilter(s)} className={`header-btn ${sevFilter === s ? 'primary' : ''}`} style={{textTransform:'capitalize'}}>
            {s === 'all' ? `All (${logs.length})` : `${s} (${logs.filter(l=>l.severity===s).length})`}
          </button>
        ))}
      </div>

      <div className="card" style={{marginBottom: '16px', background: 'linear-gradient(90deg, rgba(59,130,246,0.1), transparent)', borderLeft: '3px solid var(--c-accent)'}}>
        <div className="card-body" style={{display:'flex', gap:'12px', alignItems:'flex-start', padding:'12px 16px'}}>
          <Shield size={24} color="var(--c-accent)"/>
          <div>
            <div style={{fontWeight:600, fontSize:'13px', color:'var(--c-text-bright)', marginBottom:'4px'}}>AI Log Stream Analyst</div>
            <div style={{fontSize:'12px', color:'var(--c-text-dim)', lineHeight:'1.5'}}>
              {sevFilter === 'critical' ? 'Detected a cluster of critical events originating from DIST-SW-02 uplink failures.' : 
               sevFilter === 'warning' ? 'Multiple health check and threshold warnings detected across F5 load balancers and perimeter firewalls.' :
               'Monitoring live stream. Identified 2 correlated incident clusters in the last 15 minutes.'}
            </div>
            <button className="header-btn primary" style={{marginTop:'10px'}} onClick={() => alert('Opening RCA Copilot for deep analysis...')}>Send to RCA Copilot</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Live Syslog Feed</span>
          <span style={{fontSize:'11px', color:'var(--c-text-dim)'}}>{filtered.length} entries</span>
        </div>
        <div style={{overflowY:'auto', maxHeight:'calc(100vh - 200px)'}}>
          {filtered.map((log, i) => {
            const currentEnrichedData = localEnrichments[i] || log.enriched_data;
            
            // Allow enriched_data to override base display fields dynamically!
            const displaySource = currentEnrichedData?.source || log.source;
            const displaySeverity = currentEnrichedData?.severity || log.severity;
            const displayFacility = currentEnrichedData?.facility || log.facility;
            const displayMsg = currentEnrichedData?.msg || log.msg;

            return (
            <div key={i} style={{marginBottom: expandedLog === i ? '8px' : '0'}}>
              <div 
                className="log-entry" 
                style={{cursor: currentEnrichedData ? 'pointer' : 'default', borderBottom: expandedLog === i ? 'none' : ''}} 
                onClick={() => currentEnrichedData && handleExpand(i, currentEnrichedData)}
              >
                {currentEnrichedData ? (expandedLog === i ? <ChevronDown size={14} style={{opacity:0.5, flexShrink:0}}/> : <ChevronRight size={14} style={{opacity:0.5, flexShrink:0}}/>) : <div style={{width:'14px', flexShrink:0}}></div>}
                <span className="log-ts">{log.ts}</span>
                <span className={`log-sev ${displaySeverity}`}>{displaySeverity}</span>
                <span className="log-src">{displaySource}</span>
                <span style={{color:'var(--c-text-dim)', width:'50px', flexShrink:0, fontSize:'11px'}}>{displayFacility}</span>
                <span className="log-msg">{displayMsg}</span>
                {currentEnrichedData && (
                  <span style={{marginLeft:'auto', fontSize:'10px', color:'var(--c-accent)', fontWeight:600, border:'1px solid var(--c-accent)', padding:'2px 6px', borderRadius:'12px'}}>JSON</span>
                )}
              </div>
              {expandedLog === i && currentEnrichedData && (
                <div style={{background:'rgba(0,0,0,0.2)', padding:'12px 16px', borderLeft:`3px solid var(--c-${log.severity === 'critical' ? 'red' : log.severity === 'warning' ? 'yellow' : 'accent'})`, marginLeft:'14px', marginBottom:'8px', borderRadius:'0 0 4px 4px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                    <span style={{fontSize:'12px', fontWeight:600, color:'var(--c-text-bright)'}}>Enriched Data Payload (JSON)</span>
                    <button className="header-btn primary" onClick={() => handleSaveEnrichment(i)}><Save size={14}/> Apply</button>
                  </div>
                  <textarea 
                    value={editPayload} 
                    onChange={e => setEditPayload(e.target.value)}
                    style={{width:'100%', height:'120px', background:'var(--c-bg)', color:'var(--c-text-bright)', fontFamily:'monospace', fontSize:'12px', border:'1px solid var(--c-border)', borderRadius:'4px', padding:'8px', outline:'none', resize:'vertical'}}
                    spellCheck="false"
                  />
                </div>
              )}
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
