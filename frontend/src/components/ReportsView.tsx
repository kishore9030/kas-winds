import React, { useState } from 'react';
import { FileBarChart, Download, Calendar } from 'lucide-react';

export default function ReportsView({ nodes, alerts, logs, hasData }: any) {
  const [reportType, setReportType] = useState('health');
  const [dateRange, setDateRange] = useState('24h');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<{name:string, time:string, type:string}[]>([]);

  const generateReport = () => {
    setGenerating(true);
    setTimeout(() => {
      const name = `${reportType}_report_${new Date().toISOString().slice(0,10)}.pdf`;
      setGenerated(prev => [{ name, time: new Date().toLocaleTimeString(), type: reportType }, ...prev]);
      setGenerating(false);
    }, 1500);
  };

  if (!hasData) {
    return (
      <div>
        <div className="workspace-title"><FileBarChart size={18}/> Reports & Export</div>
        <div className="card"><div className="empty-state"><FileBarChart size={40} style={{opacity:0.4}}/><h3>No Data Available</h3><p>Load sample data or connect to live devices to generate reports.</p></div></div>
      </div>
    );
  }

  return (
    <div>
      <div className="workspace-title"><FileBarChart size={18}/> Reports & Export</div>

      <div className="grid grid-2" style={{marginBottom:'12px'}}>
        {/* Generate */}
        <div className="card">
          <div className="card-header"><span className="card-title">Generate Report</span></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Report Type</label>
              <select className="form-input form-select" value={reportType} onChange={e => setReportType(e.target.value)}>
                <option value="health">Network Health Summary</option>
                <option value="cpu">CPU & Memory Utilization</option>
                <option value="alerts">Alert History & Correlation</option>
                <option value="traffic">NetFlow Traffic Analysis</option>
                <option value="wireless">Wireless Client Report</option>
                <option value="inventory">Full Node Inventory</option>
                <option value="rca">AI RCA Incident Summary</option>
                <option value="compliance">GCC Compliance Audit</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Time Range</label>
              <select className="form-input form-select" value={dateRange} onChange={e => setDateRange(e.target.value)}>
                <option value="1h">Last 1 Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Format</label>
              <select className="form-input form-select">
                <option>PDF</option><option>CSV</option><option>Excel (XLSX)</option>
              </select>
            </div>
            <button className="header-btn primary" style={{width:'100%'}} onClick={generateReport} disabled={generating}>
              {generating ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>

        {/* Quick Stats for report context */}
        <div className="card">
          <div className="card-header"><span className="card-title">Report Data Preview</span></div>
          <div className="card-body">
            <div className="config-section">
              <h3>Scope</h3>
              <div className="config-row"><span className="config-key">Nodes in scope</span><span className="config-val">{nodes.length}</span></div>
              <div className="config-row"><span className="config-key">Active alerts</span><span className="config-val">{alerts.length}</span></div>
              <div className="config-row"><span className="config-key">Log entries</span><span className="config-val">{logs.length}</span></div>
              <div className="config-row"><span className="config-key">Nodes UP</span><span className="config-val" style={{color:'var(--c-green)'}}>{nodes.filter((n:any)=>n.status==='up').length}</span></div>
              <div className="config-row"><span className="config-key">Nodes DOWN</span><span className="config-val" style={{color:'var(--c-red)'}}>{nodes.filter((n:any)=>n.status==='down').length}</span></div>
              <div className="config-row"><span className="config-key">Avg CPU</span><span className="config-val">{nodes.length ? Math.round(nodes.reduce((s:number,n:any)=>s+n.cpu,0)/nodes.length) : 0}%</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Reports */}
      {generated.length > 0 && (
        <div className="card">
          <div className="card-header"><span className="card-title">Generated Reports</span></div>
          <div style={{overflowX:'auto'}}>
            <table className="data-table">
              <thead><tr><th>File</th><th>Type</th><th>Generated At</th><th>Action</th></tr></thead>
              <tbody>
                {generated.map((r, i) => (
                  <tr key={i}>
                    <td style={{fontWeight:500}}>{r.name}</td>
                    <td><span className="badge badge-blue">{r.type}</span></td>
                    <td style={{color:'var(--c-text-dim)', fontSize:'12px'}}>{r.time}</td>
                    <td><button className="header-btn"><Download size={12}/> Download</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
