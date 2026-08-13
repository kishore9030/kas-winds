import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Zap, Cpu, Clock, ShieldAlert, Microscope } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import WarRoom from './WarRoom';
import IncidentAutopsy from './IncidentAutopsy';

class AutopsyErrorBoundary extends React.Component<any, { hasError: boolean, error: any }> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'#111',color:'red',padding:'40px',zIndex:99999,fontFamily:'monospace'}}>
          <h2>Autopsy Component Crashed</h2>
          <pre style={{whiteSpace:'pre-wrap',color:'#ff8888'}}>{this.state.error?.toString()}</pre>
          <pre style={{whiteSpace:'pre-wrap',color:'#aaaaaa'}}>{this.state.error?.stack}</pre>
          <button onClick={() => this.props.onClose()} style={{marginTop:'20px',padding:'10px'}}>Close</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function SummaryView({ nodes, alerts, traffic, hasData }: any) {
  const [showWarRoom, setShowWarRoom] = useState(false);
  const [showAutopsy, setShowAutopsy] = useState(false);
  const upCount = nodes.filter((n:any) => n.status === 'up').length;
  const downCount = nodes.filter((n:any) => n.status === 'down').length;
  const warnCount = nodes.filter((n:any) => n.status === 'warning').length;
  const healthPct = nodes.length ? Math.round((upCount / nodes.length) * 100) : 0;
  const critAlerts = alerts.filter((a:any) => a.severity === 'critical').length;
  const warnAlerts = alerts.filter((a:any) => a.severity === 'warning').length;
  const cpuTop = [...nodes].sort((a:any,b:any) => b.cpu - a.cpu).slice(0, 6);
  const healthData = [
    { name: 'Up', value: upCount, color: 'var(--c-green)' },
    { name: 'Warning', value: warnCount, color: 'var(--c-yellow)' },
    { name: 'Down', value: downCount, color: 'var(--c-red)' },
  ].filter(d => d.value > 0);

  const Empty = () => <div className="empty-state" style={{padding:'40px'}}><p>Load sample data to populate</p></div>;

  return (
    <div>
      <div className="workspace-title" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <span>Network Summary</span>
        <div style={{display: 'flex', gap: '12px'}}>
          {critAlerts > 0 && (
            <>
              <button className="header-btn danger" onClick={() => setShowAutopsy(true)} style={{background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', borderColor: 'transparent', boxShadow: '0 4px 12px rgba(124,58,237,0.3)'}}>
                <Microscope size={16}/> AI Incident Autopsy
              </button>
              <button className="header-btn danger" onClick={() => setShowWarRoom(true)}>
                <ShieldAlert size={16}/> Initialize AI War Room
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* KPIs */}
      <div className="grid grid-4" style={{marginBottom:'12px'}}>
        <div className="card kpi">
          <div className="kpi-label">Network Health</div>
          <div className="kpi-value" style={{color: hasData ? 'var(--c-green)' : 'var(--c-text-dim)'}}>{hasData ? `${healthPct}%` : '—'}</div>
          <div className="kpi-sub"><CheckCircle size={12}/> {hasData ? `${upCount} Up / ${downCount} Down` : 'Awaiting data'}</div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">Active Alerts</div>
          <div className="kpi-value" style={{color: hasData && alerts.length ? 'var(--c-red)' : 'var(--c-text-dim)'}}>{hasData ? alerts.length : '—'}</div>
          <div className="kpi-sub"><AlertTriangle size={12}/> {hasData ? `${critAlerts} Critical / ${warnAlerts} Warning` : 'No alerts'}</div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">Total Nodes</div>
          <div className="kpi-value" style={{color: hasData ? 'var(--c-accent)' : 'var(--c-text-dim)'}}>{hasData ? nodes.length : '—'}</div>
          <div className="kpi-sub"><Cpu size={12}/> {hasData ? 'SNMP Polling Active' : 'No pollers configured'}</div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">Avg Response</div>
          <div className="kpi-value" style={{color: hasData ? 'var(--c-cyan)' : 'var(--c-text-dim)'}}>{hasData ? '4ms' : '—'}</div>
          <div className="kpi-sub"><Zap size={12}/> {hasData ? 'ICMP Probe Healthy' : 'No probes'}</div>
        </div>
      </div>
      
      {showWarRoom && <WarRoom incident={alerts.find((a:any) => a.severity === 'critical')} onClose={() => setShowWarRoom(false)} />}
      
      {showAutopsy && (
        <AutopsyErrorBoundary onClose={() => setShowAutopsy(false)}>
          <IncidentAutopsy onClose={() => setShowAutopsy(false)} />
        </AutopsyErrorBoundary>
      )}

      {/* Charts Row */}
      <div className="grid grid-1-2" style={{marginBottom:'12px'}}>
        <div className="card">
          <div className="card-header"><span className="card-title">Device Health</span></div>
          <div className="card-body">
            {!hasData ? <Empty/> : (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={healthData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" label={({name,value})=>`${name}: ${value}`}>
                      {healthData.map((e:any,i:number)=>(<Cell key={i} fill={e.color}/>))}
                    </Pie>
                    <Tooltip contentStyle={{background:'var(--c-surface)',border:'1px solid var(--c-border)',fontSize:'12px'}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title"><Cpu size={14}/> Top CPU Utilization</span></div>
          <div className="card-body">
            {!hasData ? <Empty/> : (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cpuTop} layout="vertical" margin={{top:5,right:20,left:10,bottom:5}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" horizontal={false}/>
                    <XAxis type="number" domain={[0,100]} stroke="var(--c-text-dim)" tick={{fontSize:11}}/>
                    <YAxis dataKey="hostname" type="category" stroke="var(--c-text-dim)" width={100} tick={{fontSize:11}}/>
                    <Tooltip contentStyle={{background:'var(--c-surface)',border:'1px solid var(--c-border)',fontSize:'12px'}}/>
                    <Bar dataKey="cpu" fill="var(--c-red)" radius={[0,3,3,0]} barSize={16}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Traffic & Alerts Row */}
      <div className="grid grid-2" style={{marginBottom:'12px'}}>
        <div className="card">
          <div className="card-header"><span className="card-title"><Zap size={14}/> Bandwidth Utilization</span></div>
          <div className="card-body">
            {!hasData ? <Empty/> : (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={traffic} margin={{top:5,right:20,left:0,bottom:5}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)"/>
                    <XAxis dataKey="time" stroke="var(--c-text-dim)" tick={{fontSize:10}}/>
                    <YAxis stroke="var(--c-text-dim)" tick={{fontSize:10}}/>
                    <Tooltip contentStyle={{background:'var(--c-surface)',border:'1px solid var(--c-border)',fontSize:'12px'}}/>
                    <Area type="monotone" dataKey="inbound" stroke="var(--c-accent)" fill="var(--c-accent-dim)" strokeWidth={2}/>
                    <Area type="monotone" dataKey="outbound" stroke="var(--c-green)" fill="var(--c-green-dim)" strokeWidth={2}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title"><AlertTriangle size={14}/> Active Alerts</span></div>
          <div className="card-body" style={{overflowY:'auto', maxHeight:'200px'}}>
            {!hasData || alerts.length === 0 ? <Empty/> : (
              alerts.map((a:any) => (
                <div key={a.id} className="alert-row">
                  <div className="alert-left">
                    <span className={`dot ${a.severity === 'critical' ? 'dot-red' : 'dot-yellow'}`}/>
                    <div>
                      <div className="alert-node">{a.node}</div>
                      <div className="alert-msg">{a.message}</div>
                    </div>
                  </div>
                  <div className="alert-time"><Clock size={11}/> {a.time}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
