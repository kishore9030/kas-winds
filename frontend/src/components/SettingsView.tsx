import React, { useState } from 'react';
import { Settings as Gear, Plus, Trash2, Shield, Users, Radio, Database, Bell, Brain } from 'lucide-react';

type Tab = 'snmp' | 'discovery' | 'receivers' | 'ad' | 'rbac' | 'alerting' | 'ai' | 'connectors' | 'pipelines';

export default function SettingsView() {
  const [tab, setTab] = useState<Tab>('snmp');
  const [saved, setSaved] = useState(false);
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const tabs: {id:Tab, label:string, icon:React.ReactNode}[] = [
    { id:'snmp', label:'SNMP Profiles', icon:<Radio size={14}/> },
    { id:'discovery', label:'Discovery', icon:<Database size={14}/> },
    { id:'receivers', label:'Receivers', icon:<Gear size={14}/> },
    { id:'ad', label:'AD / LDAP', icon:<Users size={14}/> },
    { id:'rbac', label:'RBAC & Roles', icon:<Shield size={14}/> },
    { id:'alerting', label:'Alert Policies', icon:<Bell size={14}/> },
    { id:'pipelines', label:'Ingestion Pipelines', icon:<Radio size={14}/> },
    { id:'connectors', label:'Connector Registry', icon:<Database size={14}/> },
    { id:'ai', label:'AI Engine', icon:<Brain size={14}/> },
  ];

  return (
    <div>
      <div className="workspace-title"><Gear size={18}/> Platform Configuration</div>
      <div className="tabs">
        {tabs.map(t => (
          <div key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)} style={{display:'flex',alignItems:'center',gap:'6px'}}>
            {t.icon} {t.label}
          </div>
        ))}
      </div>

      {tab === 'snmp' && <SNMPTab />}
      {tab === 'discovery' && <DiscoveryTab />}
      {tab === 'receivers' && <ReceiversTab />}
      {tab === 'ad' && <ADTab />}
      { tab === 'rbac' && <RBACTab /> }
      { tab === 'alerting' && <AlertPoliciesTab /> }
      { tab === 'pipelines' && <LogPipelinesTab /> }
      { tab === 'connectors' && <ConnectorsTab /> }
      { tab === 'ai' && <AITab /> }

      <div style={{marginTop:'16px', display:'flex', gap:'8px', justifyContent:'flex-end'}}>
        <button className="header-btn primary" onClick={handleSave}>{saved ? '✓ Saved & Applied' : 'Save & Apply All'}</button>
      </div>
    </div>
  );
}

function SNMPTab() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchProfiles = async () => {
      const token = localStorage.getItem('kas_token');
      const res = await fetch('http://localhost:8000/api/snmp_profiles', { headers: { 'Authorization': `Bearer ${token}` }});
      if(res.ok) setProfiles(await res.json());
      setLoading(false);
    };
    fetchProfiles();
  }, []);

  const handleSave = async () => {
    const token = localStorage.getItem('elm_token');
    await fetch('http://localhost:8000/api/snmp_profiles', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(profiles) });
    alert("SNMP Profiles saved to DB");
  };

  if(loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
        <p style={{color:'var(--c-text-dim)',fontSize:'13px'}}>Define multiple SNMP credential profiles. Assign profiles to device groups during discovery.</p>
        <div style={{display:'flex', gap:'8px'}}>
          <button className="header-btn" onClick={()=>setProfiles(p=>[...p,{id:Date.now(),name:'New Profile',version:'v2c',community:'public',port:161,timeout:2}])}><Plus size={14}/> Add Profile</button>
          <button className="header-btn primary" onClick={handleSave}>Save to Database</button>
        </div>
      </div>
      {profiles.map((p) => (
        <div key={p.id} className="card" style={{marginBottom:'8px'}}>
          <div className="card-header">
            <span className="card-title">Profile: {p.name}</span>
            <button className="header-btn" onClick={()=>setProfiles(prev=>prev.filter(x=>x.id!==p.id))}><Trash2 size={12}/></button>
          </div>
          <div className="card-body">
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'12px'}}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" value={p.name} onChange={e => setProfiles(prev => prev.map(x => x.id === p.id ? {...x, name: e.target.value} : x))} />
              </div>
              <div className="form-group">
                <label className="form-label">Version</label>
                <select className="form-input form-select" value={p.version} onChange={e => setProfiles(prev => prev.map(x => x.id === p.id ? {...x, version: e.target.value} : x))}>
                  <option value="v1">v1</option>
                  <option value="v2c">v2c</option>
                  <option value="v3 (noAuthNoPriv)">v3 (noAuthNoPriv)</option>
                  <option value="v3 (authNoPriv)">v3 (authNoPriv)</option>
                  <option value="v3 (authPriv)">v3 (authPriv)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{p.version.startsWith('v3') ? 'Username' : 'Community'}</label>
                <input className="form-input" defaultValue={p.version.startsWith('v3') ? (p as any).user : p.community} type="text"/>
              </div>
              <div className="form-group">
                <label className="form-label">Port</label>
                <input className="form-input" type="number" defaultValue={p.port}/>
              </div>
            </div>
            {p.version.startsWith('v3') && (
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'12px', marginTop:'12px'}}>
                <div className="form-group"><label className="form-label">Auth Protocol</label><select className="form-input form-select"><option>MD5</option><option>SHA</option><option>SHA-256</option></select></div>
                <div className="form-group"><label className="form-label">Auth Password</label><input className="form-input" type="password" placeholder="••••••"/></div>
                <div className="form-group"><label className="form-label">Privacy Protocol</label><select className="form-input form-select"><option>DES</option><option>AES128</option><option>AES256</option></select></div>
                <div className="form-group"><label className="form-label">Privacy Password</label><input className="form-input" type="password" placeholder="••••••"/></div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function DiscoveryTab() {
  const [ranges, setRanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchRanges = async () => {
      const token = localStorage.getItem('kas_token');
      const res = await fetch('http://localhost:8000/api/discovery_ranges', { headers: { 'Authorization': `Bearer ${token}` }});
      if(res.ok) setRanges(await res.json());
      setLoading(false);
    };
    fetchRanges();
  }, []);

  const handleSave = async () => {
    const token = localStorage.getItem('elm_token');
    await fetch('http://localhost:8000/api/discovery_ranges', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(ranges) });
    alert("Discovery Ranges saved to DB");
  };

  if(loading) return <div>Loading...</div>;

  return (
    <div>
      <p style={{color:'var(--c-text-dim)',fontSize:'13px',marginBottom:'12px'}}>Define subnet ranges to scan. The poller will sweep each range using the assigned SNMP profile.</p>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Discovery Ranges</span>
          <div style={{display:'flex', gap:'8px'}}>
            <button className="header-btn" onClick={()=>setRanges(r=>[...r,{id:Date.now(),subnet:'',profile:'Default v2c',enabled:true,label:''}])}><Plus size={14}/> Add Range</button>
            <button className="header-btn primary" onClick={handleSave}>Save Ranges</button>
          </div>
        </div>
        <table className="data-table">
          <thead><tr><th>Enabled</th><th>Label</th><th>Subnet / CIDR</th><th>SNMP Profile</th><th>Poll Interval</th><th></th></tr></thead>
          <tbody>
            {ranges.map(r => (
              <tr key={r.id}>
                <td><div className={`toggle ${r.enabled ? 'on' : ''}`} onClick={()=>setRanges(prev=>prev.map(x=>x.id===r.id?{...x,enabled:!x.enabled}:x))}/></td>
                <td><input className="form-input" defaultValue={r.label} style={{width:'120px'}}/></td>
                <td><input className="form-input" defaultValue={r.subnet} style={{width:'160px', fontFamily:'monospace'}}/></td>
                <td><select className="form-input form-select" defaultValue={r.profile}><option>Default v2c</option><option>Secure v3</option></select></td>
                <td><select className="form-input form-select"><option>60s</option><option>120s</option><option>300s</option><option>600s</option></select></td>
                <td><button className="header-btn" onClick={()=>setRanges(prev=>prev.filter(x=>x.id!==r.id))}><Trash2 size={12}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReceiversTab() {
  return (
    <div className="grid grid-3">
      <div className="card">
        <div className="card-header"><span className="card-title">Syslog Receiver</span></div>
        <div className="card-body">
          <div className="form-group"><label className="form-label">UDP Port</label><input className="form-input" type="number" defaultValue={514}/></div>
          <div className="form-group"><label className="form-label">TCP Port</label><input className="form-input" type="number" defaultValue={1514}/></div>
          <div className="form-group"><label className="form-label">Max Queue Size</label><input className="form-input" type="number" defaultValue={10000}/></div>
          <div className="config-row"><span className="config-key">Status</span><span style={{color:'var(--c-green)',fontWeight:600}}>● Listening</span></div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">SNMP Trap Receiver</span></div>
        <div className="card-body">
          <div className="form-group"><label className="form-label">UDP Port</label><input className="form-input" type="number" defaultValue={162}/></div>
          <div className="form-group"><label className="form-label">Community Filter</label><input className="form-input" defaultValue="public"/></div>
          <div className="form-group"><label className="form-label">MIB Path</label><input className="form-input" defaultValue="/opt/kaswinds/mibs"/></div>
          <div className="config-row"><span className="config-key">Status</span><span style={{color:'var(--c-green)',fontWeight:600}}>● Listening</span></div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">NetFlow / IPFIX Collector</span></div>
        <div className="card-body">
          <div className="form-group"><label className="form-label">UDP Port</label><input className="form-input" type="number" defaultValue={2055}/></div>
          <div className="form-group"><label className="form-label">Protocol</label>
            <select className="form-input form-select"><option>NetFlow v5</option><option>NetFlow v9</option><option>IPFIX</option><option>sFlow</option></select>
          </div>
          <div className="form-group"><label className="form-label">Storage Backend</label>
            <select className="form-input form-select"><option>Local DB (SQLite)</option><option>PostgreSQL</option><option>Elasticsearch</option><option>ClickHouse</option></select>
          </div>
          <div className="config-row"><span className="config-key">Status</span><span style={{color:'var(--c-green)',fontWeight:600}}>● Listening</span></div>
        </div>
      </div>
    </div>
  );
}

function ADTab() {
  return (
    <div className="grid grid-2">
      <div className="card">
        <div className="card-header"><span className="card-title">Active Directory / LDAP</span></div>
        <div className="card-body">
          <div className="form-group"><label className="form-label">Server URL</label><input className="form-input" placeholder="ldap://dc01.company.local:389"/></div>
          <div className="form-group"><label className="form-label">Base DN</label><input className="form-input" placeholder="DC=company,DC=local"/></div>
          <div className="form-group"><label className="form-label">Bind DN (Service Account)</label><input className="form-input" placeholder="CN=svc_kaswinds,OU=ServiceAccounts,DC=company,DC=local"/></div>
          <div className="form-group"><label className="form-label">Bind Password</label><input className="form-input" type="password" placeholder="••••••"/></div>
          <div className="form-group"><label className="form-label">User Search Filter</label><input className="form-input" defaultValue="(sAMAccountName={username})"/></div>
          <div className="form-group"><label className="form-label">Group Search Filter</label><input className="form-input" defaultValue="(member={dn})"/></div>
          <div style={{display:'flex',gap:'8px'}}><button className="header-btn primary">Test Connection</button><button className="header-btn">Sync Users Now</button></div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">SAML / SSO Configuration</span></div>
        <div className="card-body">
          <div className="form-group"><label className="form-label">Identity Provider</label>
            <select className="form-input form-select"><option>Microsoft Entra ID (Azure AD)</option><option>Okta</option><option>PingIdentity</option><option>ADFS</option><option>Custom SAML 2.0</option></select>
          </div>
          <div className="form-group"><label className="form-label">Entity ID / Issuer</label><input className="form-input" placeholder="https://sts.company.com/adfs/services/trust"/></div>
          <div className="form-group"><label className="form-label">SSO Login URL</label><input className="form-input" placeholder="https://login.microsoftonline.com/.../saml2"/></div>
          <div className="form-group"><label className="form-label">Certificate (PEM)</label><textarea className="form-input" rows={3} placeholder="-----BEGIN CERTIFICATE-----" style={{resize:'vertical',fontFamily:'monospace',fontSize:'11px'}}/></div>
          <div className="config-row"><span className="config-key">Enforce SSO</span><div className="toggle on"/></div>
        </div>
      </div>
    </div>
  );
}

function RBACTab() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchRoles = async () => {
      const token = localStorage.getItem('kas_token');
      const res = await fetch('http://localhost:8000/api/roles', { headers: { 'Authorization': `Bearer ${token}` }});
      if(res.ok) setRoles(await res.json());
      setLoading(false);
    };
    fetchRoles();
  }, []);

  const handleSave = async () => {
    const token = localStorage.getItem('elm_token');
    await fetch('http://localhost:8000/api/roles', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(roles) });
    alert("Roles saved to DB");
  };

  const allPerms = ['view_dashboard','view_logs','view_reports','ack_alerts','resolve_alerts','run_rca','gen_reports','manage_nodes','manage_discovery','manage_connectors','manage_users','manage_settings'];
  
  const handleAddRole = () => {
    setRoles(prev => [...prev, { id: Date.now(), name: 'new_role', desc: 'New custom role', users: [], permissions: [] }]);
  };

  const handleDeleteRole = (id: number) => {
    setRoles(prev => prev.filter(r => r.id !== id));
  };

  const handleTogglePermission = (roleId: number, perm: string) => {
    setRoles(prev => prev.map(r => {
      if (r.id !== roleId) return r;
      if (r.permissions.includes('*')) return r; // admin override
      const newPerms = r.permissions.includes(perm) ? r.permissions.filter(p => p !== perm) : [...r.permissions, perm];
      return { ...r, permissions: newPerms };
    }));
  };

  const handleChange = (id: number, field: string, value: string) => {
    setRoles(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  if(loading) return <div>Loading...</div>;

  return (
    <div>
      <p style={{color:'var(--c-text-dim)',fontSize:'13px',marginBottom:'12px'}}>Define roles and map AD groups to platform permissions. Users inherit permissions from their assigned role.</p>
      <div style={{display:'flex',justifyContent:'flex-end',gap:'8px',marginBottom:'8px'}}>
        <button className="header-btn" onClick={handleAddRole}><Plus size={14}/> Add Role</button>
        <button className="header-btn primary" onClick={handleSave}>Save to Database</button>
      </div>
      {roles.map(r => (
        <div key={r.id} className="card" style={{marginBottom:'8px'}}>
          <div className="card-header">
            <span className="card-title" style={{display:'flex', alignItems:'center', gap:'8px'}}>
              <Shield size={14}/> 
              <input className="form-input" value={r.name} onChange={e => handleChange(r.id, 'name', e.target.value)} style={{width:'150px', background:'transparent', border:'none', padding:0, fontSize:'inherit', fontWeight:'inherit', color:'inherit'}}/>
            </span>
            <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
              <span style={{fontSize:'11px',color:'var(--c-text-dim)'}}>{r.users.length} user(s)</span>
              <button className="header-btn" onClick={() => handleDeleteRole(r.id)}><Trash2 size={12}/></button>
            </div>
          </div>
          <div className="card-body">
            <div style={{marginBottom:'8px',fontSize:'12px'}}>
              <input className="form-input" value={r.desc} onChange={e => handleChange(r.id, 'desc', e.target.value)} style={{width:'100%', background:'transparent', border:'none', padding:0, color:'var(--c-text-dim)'}}/>
            </div>
            <div style={{marginBottom:'8px'}}>
              <span className="form-label" style={{display:'inline'}}>Members: </span>
              {r.users.length === 0 ? <span style={{fontSize:'12px', color:'var(--c-text-dim)'}}>No users assigned</span> : r.users.map(u => <span key={u} className="badge badge-blue" style={{marginRight:'4px'}}>{u}</span>)}
            </div>
            <div>
              <span className="form-label" style={{display:'inline'}}>Permissions: </span>
              <div style={{display:'flex', flexWrap:'wrap', gap:'4px', marginTop:'4px'}}>
                {allPerms.map(p => {
                  const hasPerm = r.permissions.includes('*') || r.permissions.includes(p);
                  return (
                    <span key={p} 
                      className={`badge ${hasPerm ? 'badge-green' : ''}`}
                      onClick={() => handleTogglePermission(r.id, p)}
                      style={{cursor:'pointer', opacity: hasPerm ? 1 : 0.4, transition: 'all 0.2s'}}>
                      {p}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AlertPoliciesTab() {
  const [policies, setPolicies] = useState([
    { id: 1, name:'High CPU', metric:'cpu', op:'>', threshold:80, severity:'warning', notify:true, connectors: 'msteams, smax' },
    { id: 2, name:'Critical CPU', metric:'cpu', op:'>', threshold:95, severity:'critical', notify:true, connectors: 'msteams, jira' },
    { id: 3, name:'High Memory', metric:'memory', op:'>', threshold:90, severity:'warning', notify:true, connectors: 'msteams' },
    { id: 4, name:'Node Down', metric:'status', op:'==', threshold:'down', severity:'critical', notify:true, connectors: 'msteams, smax, email' },
    { id: 5, name:'Interface Down', metric:'if_oper_status', op:'==', threshold:2, severity:'warning', notify:true, connectors: 'msteams' },
  ]);

  const handleAddPolicy = () => {
    setPolicies(prev => [...prev, {
      id: Date.now(), name: 'New Policy', metric: 'cpu', op: '>', threshold: 0, severity: 'warning', notify: true, connectors: 'msteams'
    }]);
  };

  const handleToggleNotify = (id: number) => {
    setPolicies(prev => prev.map(p => p.id === id ? { ...p, notify: !p.notify } : p));
  };

  const handleDelete = (id: number) => {
    setPolicies(prev => prev.filter(p => p.id !== id));
  };

  const handleChange = (id: number, field: string, value: any) => {
    setPolicies(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  return (
    <div>
      <p style={{color:'var(--c-text-dim)',fontSize:'13px',marginBottom:'12px'}}>Configure alert thresholds. Matching conditions trigger alerts dispatched to all enabled connectors.</p>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Metric Alert Policies</span>
          <button className="header-btn primary" onClick={handleAddPolicy}><Plus size={14}/> Add Policy</button>
        </div>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Metric</th><th>Condition</th><th>Threshold</th><th>Severity</th><th>Connectors</th><th>Notify</th><th></th></tr></thead>
          <tbody>
            {policies.map((p) => (
              <tr key={p.id}>
                <td><input className="form-input" value={p.name} onChange={e => handleChange(p.id, 'name', e.target.value)} style={{width:'140px', fontWeight:600}}/></td>
                <td><input className="form-input" value={p.metric} onChange={e => handleChange(p.id, 'metric', e.target.value)} style={{width:'90px'}}/></td>
                <td>
                  <select className="form-input form-select" value={p.op} onChange={e => handleChange(p.id, 'op', e.target.value)} style={{width:'60px'}}>
                    <option value=">">&gt;</option>
                    <option value="<">&lt;</option>
                    <option value="==">==</option>
                    <option value="!=">!=</option>
                  </select>
                </td>
                <td><input className="form-input" value={p.threshold} onChange={e => handleChange(p.id, 'threshold', e.target.value)} style={{width:'60px'}}/></td>
                <td>
                  <select className="form-input form-select" value={p.severity} onChange={e => handleChange(p.id, 'severity', e.target.value)}>
                    <option value="info">info</option>
                    <option value="warning">warning</option>
                    <option value="critical">critical</option>
                  </select>
                </td>
                <td><input className="form-input" value={p.connectors} onChange={e => handleChange(p.id, 'connectors', e.target.value)} style={{width:'120px'}} placeholder="msteams, jira"/></td>
                <td><div className={`toggle ${p.notify ? 'on' : ''}`} onClick={() => handleToggleNotify(p.id)}/></td>
                <td><button className="header-btn" onClick={() => handleDelete(p.id)}><Trash2 size={12}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <LogAlertBuilder />
    </div>
  );
}

function LogAlertBuilder() {
  const [query, setQuery] = useState('');
  const [webhookJson, setWebhookJson] = useState(`[
  {
    "type": "keephq",
    "project_id": "network_ops",
    "actions": {
      "firing": {"endpoint": "https://api.keephq.dev/v1/trigger"},
      "recover": {"endpoint": "https://api.keephq.dev/v1/resolve"}
    }
  }
]`);
  const [script, setScript] = useState(`# Dynamically modify payload before firing
if log.get('severity') == 'info':
    payload['actions']['status'] = 'resolved'
else:
    payload['actions']['status'] = 'triggered'`);
  const [testLogs, setTestLogs] = useState<any[]>([]);
  const [webhookResults, setWebhookResults] = useState<any>(null);

  const handleTestQuery = async () => {
    try {
      const token = localStorage.getItem('kas_token');
      const res = await fetch('http://localhost:8000/api/alerts/test_query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ query_string: query })
      });
      const data = await res.json();
      setTestLogs(data.matches || []);
    } catch (e) {
      alert("Error testing query");
    }
  };

  const handleTestWebhook = async () => {
    try {
      const mockLog = testLogs.length > 0 ? testLogs[0] : { source: 'TEST-NODE', severity: 'critical', facility: 'SYS', msg: 'Mock test log', enriched: {} };
      const token = localStorage.getItem('kas_token');
      const res = await fetch('http://localhost:8000/api/alerts/test_webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          connectors: JSON.parse(webhookJson),
          transform_script: script,
          mock_log: mockLog
        })
      });
      const data = await res.json();
      setWebhookResults(data.results);
    } catch (e) {
      alert("Error testing webhook: " + String(e));
    }
  };

  const handleSavePolicy = async () => {
    if (!query) { alert("Need a query."); return; }
    try {
      const token = localStorage.getItem('kas_token');
      const res = await fetch('http://localhost:8000/api/alerts/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: 'Log Policy ' + Date.now(), query_string: query, connectors: JSON.parse(webhookJson), transform_script: script })
      });
      if (res.ok) alert("Saved Log Alert Policy!");
      else alert("Failed to save.");
    } catch (e) {
      alert("Error: " + String(e));
    }
  };

  return (
    <div className="card" style={{marginTop: '24px'}}>
      <div className="card-header"><span className="card-title">Advanced Log Alert Builder</span></div>
      <div className="card-body">
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px'}}>
          <div>
            <div className="form-group">
              <label className="form-label">Kibana Query</label>
              <div style={{display:'flex', gap:'8px'}}>
                <input className="form-input" style={{flex:1}} value={query} onChange={e => setQuery(e.target.value)} placeholder="severity:critical facility:JVM"/>
                <button className="header-btn primary" onClick={handleTestQuery}>Test Query</button>
              </div>
            </div>
            
            {testLogs.length > 0 && (
              <div style={{background:'var(--c-bg)', padding:'8px', borderRadius:'4px', marginTop:'8px', fontSize:'11px', maxHeight:'200px', overflowY:'auto'}}>
                <div style={{fontWeight:600, marginBottom:'4px'}}>Live Search Matched {testLogs.length} logs (Top 1 shown):</div>
                <pre style={{margin:0, overflowX:'auto', color:'var(--c-text-dim)'}}>{JSON.stringify(testLogs[0], null, 2)}</pre>
              </div>
            )}
            
            <div className="form-group" style={{marginTop:'16px'}}>
              <label className="form-label">Transformation Script (Python)</label>
              <textarea className="form-input" rows={6} value={script} onChange={e => setScript(e.target.value)} style={{width:'100%', fontFamily:'monospace', fontSize:'11px', resize:'vertical', background:'#1e1e1e', color:'#d4d4d4', border:'1px solid #333'}}/>
              <p style={{fontSize:'11px', color:'var(--c-text-dim)', marginTop:'4px'}}>Vars: <code>log</code>, <code>payload</code>. Modify <code>payload</code> in-place.</p>
            </div>
          </div>

          <div>
            <div className="form-group">
              <label className="form-label">Webhook JSON Definition</label>
              <textarea className="form-input" rows={8} value={webhookJson} onChange={e => setWebhookJson(e.target.value)} style={{width:'100%', fontFamily:'monospace', fontSize:'11px', resize:'vertical'}}/>
            </div>
            
            <div style={{display:'flex', justifyContent:'flex-end', marginTop:'8px'}}>
              <button className="header-btn" onClick={handleTestWebhook}>Test Webhook & Script</button>
            </div>

            {webhookResults && (
              <div style={{background:'var(--c-bg)', padding:'8px', borderRadius:'4px', marginTop:'16px', fontSize:'11px', maxHeight:'200px', overflowY:'auto'}}>
                <div style={{fontWeight:600, marginBottom:'4px', color:'var(--c-green)'}}>Simulated Dispatch Result:</div>
                <pre style={{margin:0, overflowX:'auto'}}>{JSON.stringify(webhookResults, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>

        <div style={{borderTop:'1px solid var(--c-border)', marginTop:'24px', paddingTop:'16px', display:'flex', justifyContent:'flex-end'}}>
           <button className="header-btn primary" onClick={handleSavePolicy}>Save Log Alert Policy</button>
        </div>
      </div>
    </div>
  );
}

function AITab() {
  return (
    <div className="grid grid-2">
      <div className="card">
        <div className="card-header"><span className="card-title">Local LLM Engine</span></div>
        <div className="card-body">
          <div className="form-group"><label className="form-label">Inference Endpoint</label><input className="form-input" defaultValue="http://localhost:11434"/></div>
          <div className="form-group"><label className="form-label">Model</label>
            <select className="form-input form-select"><option>llama3:8b</option><option>qwen3:4b</option><option>mistral:7b</option><option>codellama:13b</option></select>
          </div>
          <div className="form-group"><label className="form-label">Context Window</label><input className="form-input" type="number" defaultValue={8192}/></div>
          <div className="config-row"><span className="config-key">Auto-Correlate Alerts</span><div className="toggle on"/></div>
          <div className="config-row"><span className="config-key">Auto-Generate RCA on Critical</span><div className="toggle on"/></div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">Anomaly Detection (ML)</span></div>
        <div className="card-body">
          <div className="form-group"><label className="form-label">Baseline Algorithm</label>
            <select className="form-input form-select"><option>Isolation Forest</option><option>Prophet (Time Series)</option><option>Z-Score (Statistical)</option><option>DBSCAN</option></select>
          </div>
          <div className="form-group"><label className="form-label">Training Window</label>
            <select className="form-input form-select"><option>7 days</option><option>14 days</option><option>30 days</option></select>
          </div>
          <div className="form-group"><label className="form-label">Sensitivity</label>
            <select className="form-input form-select"><option>Low (fewer alerts)</option><option>Medium</option><option>High (more alerts)</option></select>
          </div>
          <div className="config-row"><span className="config-key">Dynamic Baselines</span><div className="toggle on"/></div>
        </div>
      </div>
    </div>
  );
}

function ConnectorsTab() {
  const [connectors, setConnectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('keephq');
  const [newJson, setNewJson] = useState('{\n  "endpoint": "https://...",\n  "api_key": "..."\n}');

  React.useEffect(() => {
    fetchConnectors();
  }, []);

  const fetchConnectors = async () => {
    try {
      const token = localStorage.getItem('kas_token');
      const res = await fetch('http://localhost:8000/api/connectors', { headers: { 'Authorization': `Bearer ${token}` }});
      const data = await res.json();
      setConnectors(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newName) return alert("Name required");
    try {
      const token = localStorage.getItem('kas_token');
      const res = await fetch('http://localhost:8000/api/connectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newName, connector_type: newType, config_json: JSON.parse(newJson) })
      });
      if (res.ok) {
        setIsAdding(false);
        setNewName('');
        fetchConnectors();
      } else {
        alert("Failed to save connector");
      }
    } catch (e) {
      alert("Error saving: " + String(e));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('kas_token');
      await fetch(`http://localhost:8000/api/connectors/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      fetchConnectors();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div>Loading registry...</div>;

  return (
    <div>
      <p style={{color:'var(--c-text-dim)',fontSize:'13px',marginBottom:'12px'}}>Define reusable enterprise webhook and API configurations here. You can reference these profiles dynamically in your Alert Policies.</p>
      
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'12px'}}>
        <button className="header-btn primary" onClick={() => setIsAdding(!isAdding)}><Plus size={14}/> {isAdding ? 'Cancel' : 'Add Connector'}</button>
      </div>

      {isAdding && (
        <div className="card" style={{marginBottom: '16px', border:'1px solid var(--c-primary)'}}>
          <div className="card-header"><span className="card-title">New Connector Profile</span></div>
          <div className="card-body">
            <div style={{display:'flex', gap:'16px'}}>
              <div className="form-group" style={{flex:1}}><label className="form-label">Profile Name</label><input className="form-input" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. SMAX IT Queue"/></div>
              <div className="form-group" style={{flex:1}}><label className="form-label">Type</label>
                <select className="form-input form-select" value={newType} onChange={e=>setNewType(e.target.value)}>
                  <option value="keephq">KeepHQ</option><option value="msteams">MS Teams</option><option value="smax">SMAX</option><option value="jira">Jira</option><option value="webhook">Generic Webhook</option>
                </select>
              </div>
            </div>
            <div className="form-group" style={{marginTop:'12px'}}>
              <label className="form-label">Configuration Payload (JSON)</label>
              <textarea className="form-input" rows={6} value={newJson} onChange={e=>setNewJson(e.target.value)} style={{width:'100%', fontFamily:'monospace', fontSize:'11px'}}/>
            </div>
            <div style={{display:'flex', justifyContent:'flex-end', marginTop:'12px'}}>
              <button className="header-btn primary" onClick={handleSave}>Save to Database</button>
            </div>
          </div>
        </div>
      )}

      {connectors.map(c => (
        <div key={c.id} className="card" style={{marginBottom:'8px'}}>
          <div className="card-header">
            <span className="card-title">{c.name} <span className="badge badge-blue" style={{marginLeft:'8px'}}>{c.connector_type}</span></span>
            <button className="header-btn" onClick={() => handleDelete(c.id)}><Trash2 size={12}/></button>
          </div>
          <div className="card-body">
            <pre style={{margin:0, overflowX:'auto', fontSize:'11px', color:'var(--c-text-dim)'}}>{JSON.stringify(c.config_json, null, 2)}</pre>
          </div>
        </div>
      ))}
      
      {connectors.length === 0 && !isAdding && (
        <div style={{padding:'24px', textAlign:'center', color:'var(--c-text-dim)'}}>No connector profiles configured.</div>
      )}
    </div>
  );
}

function LogPipelinesTab() {
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMatch, setNewMatch] = useState('^CUSTOM-APP');
  const [newExtract, setNewExtract] = useState('(?P<severity>\\w+)\\s+(?P<msg>.*)');
  
  const [testLog, setTestLog] = useState('CUSTOM-APP error Something went wrong');
  const [testResult, setTestResult] = useState<any>(null);

  React.useEffect(() => {
    fetchPipelines();
  }, []);

  const fetchPipelines = async () => {
    try {
      const token = localStorage.getItem('kas_token');
      const res = await fetch('http://localhost:8000/api/pipelines', { headers: { 'Authorization': `Bearer ${token}` }});
      const data = await res.json();
      setPipelines(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = () => {
    try {
      const matchRegex = new RegExp(newMatch);
      if (!matchRegex.test(testLog)) {
        setTestResult({ error: "Match condition failed." });
        return;
      }
      const extractRegex = new RegExp(newExtract);
      const match = extractRegex.exec(testLog);
      if (match && match.groups) {
        setTestResult({ success: true, parsed: match.groups });
      } else {
        setTestResult({ error: "Extraction failed or no named groups found." });
      }
    } catch (e) {
      setTestResult({ error: String(e) });
    }
  };

  const handleSave = async () => {
    if (!newName) return alert("Name required");
    try {
      const token = localStorage.getItem('kas_token');
      const res = await fetch('http://localhost:8000/api/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newName, match_condition: newMatch, extraction_regex: newExtract })
      });
      if (res.ok) {
        setIsAdding(false);
        setNewName('');
        fetchPipelines();
      } else {
        alert("Failed to save pipeline");
      }
    } catch (e) {
      alert("Error saving: " + String(e));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('kas_token');
      await fetch(`http://localhost:8000/api/pipelines/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      fetchPipelines();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div>Loading registry...</div>;

  return (
    <div>
      <p style={{color:'var(--c-text-dim)',fontSize:'13px',marginBottom:'12px'}}>Define custom Grok/Regex extraction pipelines. These execute before AI inference for lightning-fast parsing.</p>
      
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'12px'}}>
        <button className="header-btn primary" onClick={() => setIsAdding(!isAdding)}><Plus size={14}/> {isAdding ? 'Cancel' : 'Add Pipeline'}</button>
      </div>

      {isAdding && (
        <div className="card" style={{marginBottom: '16px', border:'1px solid var(--c-primary)'}}>
          <div className="card-header"><span className="card-title">New Ingestion Pipeline</span></div>
          <div className="card-body">
            <div className="form-group"><label className="form-label">Pipeline Name</label><input className="form-input" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. F5 Load Balancer"/></div>
            
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
              <div className="form-group"><label className="form-label">Match Condition (Regex)</label><input className="form-input" value={newMatch} onChange={e=>setNewMatch(e.target.value)} style={{fontFamily:'monospace'}}/>
              <p style={{fontSize:'11px', color:'var(--c-text-dim)', marginTop:'4px'}}>Regex to identify if this pipeline should run.</p>
              </div>
              <div className="form-group"><label className="form-label">Extraction Pipeline (Regex with Named Groups)</label><input className="form-input" value={newExtract} onChange={e=>setNewExtract(e.target.value)} style={{fontFamily:'monospace'}}/>
               <p style={{fontSize:'11px', color:'var(--c-text-dim)', marginTop:'4px'}}>Use <code>(?P&lt;name&gt;...)</code> to extract fields like severity, host, msg.</p>
              </div>
            </div>

            <div style={{marginTop:'16px', padding:'12px', background:'var(--c-bg)', borderRadius:'4px'}}>
               <label className="form-label">Live Test Log</label>
               <div style={{display:'flex', gap:'8px'}}>
                 <input className="form-input" style={{flex:1, fontFamily:'monospace'}} value={testLog} onChange={e=>setTestLog(e.target.value)}/>
                 <button className="header-btn" onClick={handleTest}>Test Regex</button>
               </div>
               {testResult && (
                 <div style={{marginTop:'8px', fontSize:'11px'}}>
                   {testResult.error ? <span style={{color:'var(--c-red)'}}>{testResult.error}</span> : 
                    <div><span style={{color:'var(--c-green)'}}>Match Success! Extracted:</span> <pre style={{margin:0}}>{JSON.stringify(testResult.parsed, null, 2)}</pre></div>}
                 </div>
               )}
            </div>

            <div style={{display:'flex', justifyContent:'flex-end', marginTop:'12px'}}>
              <button className="header-btn primary" onClick={handleSave}>Save Pipeline</button>
            </div>
          </div>
        </div>
      )}

      {pipelines.map(c => (
        <div key={c.id} className="card" style={{marginBottom:'8px'}}>
          <div className="card-header">
            <span className="card-title">{c.name}</span>
            <button className="header-btn" onClick={() => handleDelete(c.id)}><Trash2 size={12}/></button>
          </div>
          <div className="card-body">
            <div className="form-group" style={{marginBottom:'8px'}}><label className="form-label">Match</label><code style={{fontSize:'11px', background:'#2d2d2d', padding:'2px 4px'}}>{c.match_condition}</code></div>
            <div className="form-group"><label className="form-label">Extract</label><code style={{fontSize:'11px', background:'#2d2d2d', padding:'2px 4px'}}>{c.extraction_regex}</code></div>
          </div>
        </div>
      ))}
      
      {pipelines.length === 0 && !isAdding && (
        <div style={{padding:'24px', textAlign:'center', color:'var(--c-text-dim)'}}>No custom pipelines configured.</div>
      )}
    </div>
  );
}
