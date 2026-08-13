import React, { useState } from 'react';
import { Server, Plus, ChevronDown, Shield } from 'lucide-react';
import NodeProfiler from './NodeProfiler';

export default function InventoryView({ nodes }: { nodes: any[] }) {
  const [filter, setFilter] = useState('all');
  const [activeNode, setActiveNode] = useState<any>(null);
  const filtered = filter === 'all' ? nodes : nodes.filter(n => n.status === filter);

  if (nodes.length === 0) {
    return <div className="card" style={{height:'100%'}}><div className="empty-state"><Server size={40} style={{opacity:0.4}}/><h3>No Nodes Discovered</h3><p>Add sample data or configure SNMP discovery to begin monitoring.</p></div></div>;
  }

  return (
    <div>
      <div className="workspace-title">Node Inventory</div>
      {/* Filters */}
      <div style={{display:'flex', gap:'8px', marginBottom:'12px', alignItems:'center'}}>
        {['all','up','warning','down'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`header-btn ${filter === f ? 'primary' : ''}`} style={{textTransform:'capitalize'}}>
            {f === 'all' ? `All (${nodes.length})` : `${f} (${nodes.filter(n=>n.status===f).length})`}
          </button>
        ))}
      </div>
      {/* Table */}
      <div className="card">
        <div style={{overflowX:'auto'}}>
          <table className="data-table" style={{cursor: 'pointer'}}>
            <thead>
              <tr>
                <th>Status</th><th>Hostname</th><th>IP Address</th><th>Vendor</th><th>Model</th>
                <th>CPU %</th><th>Memory %</th><th>Uptime</th><th>Location</th><th>AI Prediction</th><th>SNMP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(n => (
                <tr key={n.id} onClick={() => setActiveNode(n)} title="Click for AI 360 Profiler">
                  <td><span className={`dot ${n.status==='up'?'dot-green':n.status==='down'?'dot-red':'dot-yellow'}`}/>{n.status}</td>
                  <td style={{fontWeight:600, color:'var(--c-accent)'}}>{n.hostname}</td>
                  <td style={{color:'var(--c-text-dim)', fontFamily:'monospace'}}>{n.ip}</td>
                  <td><span className="badge badge-blue">{n.vendor}</span></td>
                  <td>{n.model}</td>
                  <td>
                    <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
                      <div style={{width:'50px', height:'6px', background:'var(--c-border)', borderRadius:'3px', overflow:'hidden'}}>
                        <div style={{width:`${n.cpu}%`, height:'100%', background: n.cpu > 80 ? 'var(--c-red)' : n.cpu > 60 ? 'var(--c-yellow)' : 'var(--c-green)', borderRadius:'3px'}}/>
                      </div>
                      <span style={{fontSize:'12px'}}>{n.cpu}%</span>
                    </div>
                  </td>
                  <td>
                    <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
                      <div style={{width:'50px', height:'6px', background:'var(--c-border)', borderRadius:'3px', overflow:'hidden'}}>
                        <div style={{width:`${n.mem}%`, height:'100%', background: n.mem > 85 ? 'var(--c-red)' : n.mem > 65 ? 'var(--c-yellow)' : 'var(--c-green)', borderRadius:'3px'}}/>
                      </div>
                      <span style={{fontSize:'12px'}}>{n.mem}%</span>
                    </div>
                  </td>
                  <td style={{color:'var(--c-text-dim)', fontSize:'12px'}}>{n.uptime}</td>
                  <td style={{fontSize:'12px'}}>{n.location}</td>
                  <td>
                    {n.status === 'down' ? (
                      <span style={{color:'var(--c-red)', fontSize:'12px', display:'flex', alignItems:'center', gap:'4px'}}><Shield size={12}/> RCA Active</span>
                    ) : n.cpu > 70 ? (
                      <span style={{color:'var(--c-yellow)', fontSize:'12px', display:'flex', alignItems:'center', gap:'4px'}}><Shield size={12}/> Capacity Warning (7d)</span>
                    ) : (
                      <span style={{color:'var(--c-text-dim)', fontSize:'12px', display:'flex', alignItems:'center', gap:'4px'}}><Shield size={12}/> Stable</span>
                    )}
                  </td>
                  <td><span style={{fontSize:'10px', color:'var(--c-accent)', fontWeight:600}}>{n.id%2===0?'v3':'v2c'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Node Profiler Modal */}
      {activeNode && (
        <NodeProfiler node={activeNode} onClose={() => setActiveNode(null)} />
      )}
    </div>
  );
}
