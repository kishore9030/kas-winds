import React, { useState } from 'react';
import { Link2, Plus, Trash2, CheckCircle, Send, ChevronDown } from 'lucide-react';

interface Connector {
  id: number; name: string; type: string; url: string; enabled: boolean; lastTest: string;
}

const connectorTypes = [
  { value:'msteams', label:'Microsoft Teams (Webhook)', category:'Alerting' },
  { value:'slack', label:'Slack (Webhook)', category:'Alerting' },
  { value:'email', label:'Email (SMTP)', category:'Alerting' },
  { value:'webhook', label:'Generic Webhook (POST)', category:'Alerting' },
  { value:'pagerduty', label:'PagerDuty', category:'Alerting' },
  { value:'smax', label:'SMAX / ServiceNow', category:'ITSM' },
  { value:'jira', label:'Jira (REST API)', category:'ITSM' },
  { value:'elasticsearch', label:'Elasticsearch (Log Sink)', category:'Data Pipeline' },
  { value:'logstash', label:'Logstash (Log Forwarder)', category:'Data Pipeline' },
  { value:'filebeat', label:'Filebeat (Agent)', category:'Data Pipeline' },
  { value:'kafka', label:'Apache Kafka', category:'Data Pipeline' },
  { value:'splunk', label:'Splunk HEC', category:'Data Pipeline' },
  { value:'syslog_fwd', label:'Syslog Forwarder (UDP/TCP)', category:'Data Pipeline' },
  { value:'snmp_fwd', label:'SNMP Trap Forwarder', category:'Data Pipeline' },
];

export default function ConnectorsView() {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState('msteams');
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [testResults, setTestResults] = useState<Record<number, 'ok'|'fail'|'testing'>>({});

  const addConnector = () => {
    if (!newName.trim() || !newUrl.trim()) return;
    setConnectors(prev => [...prev, { id: Date.now(), name: newName, type: newType, url: newUrl, enabled: true, lastTest: 'Never' }]);
    setNewName(''); setNewUrl(''); setShowAdd(false);
  };

  const testConnector = (id: number) => {
    setTestResults(prev => ({ ...prev, [id]: 'testing' }));
    setTimeout(() => {
      setTestResults(prev => ({ ...prev, [id]: 'ok' }));
      setConnectors(prev => prev.map(c => c.id === id ? { ...c, lastTest: new Date().toLocaleTimeString() } : c));
    }, 1500);
  };

  const typeLabel = (t: string) => connectorTypes.find(ct => ct.value === t)?.label || t;
  const typeCat = (t: string) => connectorTypes.find(ct => ct.value === t)?.category || '';

  return (
    <div>
      <div className="workspace-title"><Link2 size={18}/> Integrations & Connectors</div>
      <p style={{color:'var(--c-text-dim)',marginBottom:'16px',fontSize:'13px'}}>
        Configure outbound connectors for alerting, ITSM ticketing, and log forwarding pipelines. Alerts and AI RCA reports are dispatched to all enabled connectors.
      </p>

      {connectors.length === 0 && !showAdd ? (
        <div className="card"><div className="empty-state"><Link2 size={40} style={{opacity:0.4}}/><h3>No Connectors Configured</h3><p>Add MS Teams, Email, Elasticsearch, Logstash, Kafka, or any integration.</p><button className="header-btn primary" style={{marginTop:'16px'}} onClick={() => setShowAdd(true)}><Plus size={14}/> Add Connector</button></div></div>
      ) : (
        <>
          {connectors.length > 0 && (
            <div className="card" style={{marginBottom:'12px'}}>
              <div className="card-header"><span className="card-title">Active Connectors ({connectors.length})</span><button className="header-btn primary" onClick={() => setShowAdd(true)}><Plus size={14}/> Add</button></div>
              <table className="data-table">
                <thead><tr><th>Enabled</th><th>Name</th><th>Type</th><th>Category</th><th>Endpoint</th><th>Last Test</th><th>Actions</th></tr></thead>
                <tbody>
                  {connectors.map(c => (
                    <tr key={c.id}>
                      <td><div className={`toggle ${c.enabled ? 'on' : ''}`} onClick={() => setConnectors(prev => prev.map(x => x.id === c.id ? {...x, enabled:!x.enabled} : x))}/></td>
                      <td style={{fontWeight:600}}>{c.name}</td>
                      <td><span className="badge badge-blue">{typeLabel(c.type)}</span></td>
                      <td style={{fontSize:'11px',color:'var(--c-text-dim)'}}>{typeCat(c.type)}</td>
                      <td style={{fontFamily:'monospace',fontSize:'11px',color:'var(--c-text-dim)',maxWidth:'250px',overflow:'hidden',textOverflow:'ellipsis'}}>{c.url}</td>
                      <td style={{fontSize:'12px',color:'var(--c-text-dim)'}}>{c.lastTest}</td>
                      <td><div style={{display:'flex',gap:'4px'}}>
                        <button className="header-btn" onClick={() => testConnector(c.id)}>{testResults[c.id]==='testing'?'...':testResults[c.id]==='ok'?<><CheckCircle size={12} color="var(--c-green)"/> OK</>:<><Send size={12}/> Test</>}</button>
                        <button className="header-btn" onClick={() => setConnectors(prev => prev.filter(x => x.id !== c.id))}><Trash2 size={12}/></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {showAdd && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}} onClick={() => setShowAdd(false)}>
          <div className="card" style={{width:'520px',maxHeight:'80vh',overflow:'auto'}} onClick={e => e.stopPropagation()}>
            <div className="card-header"><span className="card-title">Add Connector</span></div>
            <div className="card-body">
              <div className="form-group"><label className="form-label">Connector Type</label>
                <select className="form-input form-select" value={newType} onChange={e => setNewType(e.target.value)}>
                  {['Alerting','ITSM','Data Pipeline'].map(cat => (
                    <optgroup key={cat} label={cat}>
                      {connectorTypes.filter(c => c.category === cat).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Display Name</label><input className="form-input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. NOC Teams Channel"/></div>
              
              {/* Dynamic fields per type */}
              {['msteams','slack','webhook','pagerduty'].includes(newType) && (
                <div className="form-group"><label className="form-label">Webhook URL</label><input className="form-input" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://..."/></div>
              )}
              {newType === 'email' && (<>
                <div className="form-group"><label className="form-label">SMTP Server (host:port)</label><input className="form-input" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="smtp.company.com:587"/></div>
                <div className="form-group"><label className="form-label">From</label><input className="form-input" placeholder="noc@company.com"/></div>
                <div className="form-group"><label className="form-label">Recipients</label><input className="form-input" placeholder="admin@company.com, noc@company.com"/></div>
                <div className="form-group"><label className="form-label">Auth User</label><input className="form-input" placeholder="smtp-user"/></div>
                <div className="form-group"><label className="form-label">Auth Password</label><input className="form-input" type="password"/></div>
              </>)}
              {newType === 'elasticsearch' && (<>
                <div className="form-group"><label className="form-label">Elasticsearch URL</label><input className="form-input" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://es-node:9200"/></div>
                <div className="form-group"><label className="form-label">Index Pattern</label><input className="form-input" defaultValue="elmwinds-logs-*"/></div>
                <div className="form-group"><label className="form-label">API Key / Token</label><input className="form-input" type="password"/></div>
                <div className="form-group"><label className="form-label">TLS Verify</label><select className="form-input form-select"><option>Yes</option><option>No (self-signed)</option></select></div>
              </>)}
              {newType === 'logstash' && (<>
                <div className="form-group"><label className="form-label">Logstash Host:Port</label><input className="form-input" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="logstash.local:5044"/></div>
                <div className="form-group"><label className="form-label">Protocol</label><select className="form-input form-select"><option>Beats (TCP 5044)</option><option>TCP JSON</option><option>UDP Syslog</option></select></div>
              </>)}
              {newType === 'kafka' && (<>
                <div className="form-group"><label className="form-label">Bootstrap Servers</label><input className="form-input" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="kafka1:9092,kafka2:9092"/></div>
                <div className="form-group"><label className="form-label">Topic</label><input className="form-input" defaultValue="elmwinds-events"/></div>
              </>)}
              {newType === 'splunk' && (<>
                <div className="form-group"><label className="form-label">HEC Endpoint</label><input className="form-input" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://splunk:8088"/></div>
                <div className="form-group"><label className="form-label">HEC Token</label><input className="form-input" type="password"/></div>
                <div className="form-group"><label className="form-label">Index</label><input className="form-input" defaultValue="main"/></div>
              </>)}
              {newType === 'syslog_fwd' && (<>
                <div className="form-group"><label className="form-label">Destination Host:Port</label><input className="form-input" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="siem.company.com:514"/></div>
                <div className="form-group"><label className="form-label">Protocol</label><select className="form-input form-select"><option>UDP</option><option>TCP</option><option>TLS</option></select></div>
                <div className="form-group"><label className="form-label">Format</label><select className="form-input form-select"><option>RFC 5424</option><option>RFC 3164 (BSD)</option><option>CEF</option></select></div>
              </>)}
              {['smax','jira'].includes(newType) && (<>
                <div className="form-group"><label className="form-label">API Endpoint</label><input className="form-input" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://smax.company.com/api"/></div>
                <div className="form-group"><label className="form-label">API Token / Key</label><input className="form-input" type="password"/></div>
                {newType === 'jira' && <div className="form-group"><label className="form-label">Project Key</label><input className="form-input" placeholder="NOC"/></div>}
              </>)}
              {newType === 'filebeat' && (<>
                <div className="form-group"><label className="form-label">Output Host</label><input className="form-input" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="logstash.local:5044"/></div>
                <div className="form-group"><label className="form-label">Log Paths</label><input className="form-input" placeholder="/var/log/elmwinds/*.log"/></div>
              </>)}
              {newType === 'snmp_fwd' && (<>
                <div className="form-group"><label className="form-label">Destination Host:Port</label><input className="form-input" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="nms.company.com:162"/></div>
                <div className="form-group"><label className="form-label">Community</label><input className="form-input" defaultValue="public"/></div>
              </>)}

              <div style={{display:'flex',gap:'8px',justifyContent:'flex-end',marginTop:'8px'}}>
                <button className="header-btn" onClick={() => setShowAdd(false)}>Cancel</button>
                <button className="header-btn primary" onClick={addConnector}>Add Connector</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
