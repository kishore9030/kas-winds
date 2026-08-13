import React, { useState } from 'react';
import { Wifi, Signal, Radio } from 'lucide-react';

export default function WirelessView({ aps, hasData }: { aps: any[], hasData: boolean }) {
  const [configOpen, setConfigOpen] = useState(false);

  if (!hasData) {
    return (
      <div>
        <div className="workspace-title">Wireless Network Manager</div>
        <div className="card">
          <div className="empty-state">
            <Wifi size={40} style={{opacity:0.4}}/>
            <h3>No Wireless Controllers Configured</h3>
            <p>Add a WLC to start tracking access points and client associations.</p>
            <button className="header-btn primary" style={{marginTop:'16px'}} onClick={() => setConfigOpen(true)}>Configure Controller</button>
          </div>
        </div>
        {configOpen && <ControllerConfig onClose={() => setConfigOpen(false)}/>}
      </div>
    );
  }

  const totalClients = aps.reduce((s:number, a:any) => s + a.clients, 0);
  const upAPs = aps.filter(a => a.status === 'up').length;
  const downAPs = aps.filter(a => a.status === 'down').length;

  return (
    <div>
      <div className="workspace-title">Wireless Network Manager</div>
      {/* KPIs */}
      <div className="grid grid-4" style={{marginBottom:'12px'}}>
        <div className="card kpi">
          <div className="kpi-label">Total APs</div>
          <div className="kpi-value" style={{color:'var(--c-accent)'}}>{aps.length}</div>
          <div className="kpi-sub"><Radio size={12}/> {upAPs} Online / {downAPs} Offline</div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">Connected Clients</div>
          <div className="kpi-value" style={{color:'var(--c-cyan)'}}>{totalClients}</div>
          <div className="kpi-sub"><Wifi size={12}/> Across all SSIDs</div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">Avg Signal</div>
          <div className="kpi-value" style={{color:'var(--c-green)'}}>{Math.round(aps.filter(a=>a.signal<0).reduce((s:number,a:any)=>s+a.signal,0)/aps.filter(a=>a.signal<0).length)} dBm</div>
          <div className="kpi-sub"><Signal size={12}/> Good coverage</div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">Controller</div>
          <div className="kpi-value" style={{fontSize:'18px', color:'var(--c-text-bright)'}}>WLC-01</div>
          <div className="kpi-sub">Cisco C9800-40</div>
        </div>
      </div>

      {/* AP Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><Wifi size={14}/> Access Point Inventory</span>
          <button className="header-btn" onClick={() => setConfigOpen(true)}>Configure</button>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="data-table">
            <thead><tr><th>Status</th><th>AP Name</th><th>IP Address</th><th>Clients</th><th>Channel</th><th>Signal (dBm)</th><th>Band</th><th>SSID</th></tr></thead>
            <tbody>
              {aps.map((ap:any, i:number) => (
                <tr key={i}>
                  <td><span className={`dot ${ap.status==='up'?'dot-green':'dot-red'}`}/>{ap.status}</td>
                  <td style={{fontWeight:600}}>{ap.name}</td>
                  <td style={{fontFamily:'monospace', color:'var(--c-text-dim)'}}>{ap.ip}</td>
                  <td style={{fontWeight:500}}>{ap.clients}</td>
                  <td>{ap.channel}</td>
                  <td>
                    {ap.signal !== 0 && (
                      <span style={{color: ap.signal > -50 ? 'var(--c-green)' : ap.signal > -65 ? 'var(--c-yellow)' : 'var(--c-red)'}}>
                        {ap.signal} dBm
                      </span>
                    )}
                    {ap.signal === 0 && <span style={{color:'var(--c-text-dim)'}}>—</span>}
                  </td>
                  <td><span className="badge badge-blue">{ap.band}</span></td>
                  <td>{ap.ssid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {configOpen && <ControllerConfig onClose={() => setConfigOpen(false)}/>}
    </div>
  );
}

function ControllerConfig({ onClose }: { onClose: () => void }) {
  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}} onClick={onClose}>
      <div className="card" style={{width:'480px', maxHeight:'80vh', overflow:'auto'}} onClick={e => e.stopPropagation()}>
        <div className="card-header"><span className="card-title">Wireless Controller Configuration</span></div>
        <div className="card-body">
          <div className="config-section">
            <h3>Connection Settings</h3>
            <div className="form-group"><label className="form-label">Controller IP / Hostname</label><input className="form-input" placeholder="e.g. 10.10.5.1"/></div>
            <div className="form-group"><label className="form-label">Controller Type</label>
              <select className="form-input form-select">
                <option>Cisco WLC (C9800)</option><option>Cisco WLC (5520)</option><option>Aruba Mobility Controller</option><option>Meraki Dashboard API</option><option>Ubiquiti UniFi</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">SNMP Community / API Key</label><input className="form-input" placeholder="e.g. public" type="password"/></div>
          </div>
          <div className="config-section">
            <h3>Polling Settings</h3>
            <div className="form-group"><label className="form-label">Poll Interval (seconds)</label><input className="form-input" type="number" defaultValue={60}/></div>
          </div>
          <div style={{display:'flex', gap:'8px', justifyContent:'flex-end'}}>
            <button className="header-btn" onClick={onClose}>Cancel</button>
            <button className="header-btn primary" onClick={onClose}>Save & Test</button>
          </div>
        </div>
      </div>
    </div>
  );
}
