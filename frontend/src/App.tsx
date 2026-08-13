import React, { useState, useRef, useEffect } from 'react';
import { Activity, Server, Network, Zap, Wifi, Shield, Settings, Bell, Search, FileText, Database, Link2, FileBarChart, LogOut, User, ChevronDown, Compass, UploadCloud } from 'lucide-react';
import LoginPage from './components/LoginPage';
import SummaryView from './components/SummaryView';
import InventoryView from './components/InventoryView';
import LogView from './components/LogView';
import TrafficView from './components/TrafficView';
import WirelessView from './components/WirelessView';
import RCAView from './components/RCAView';
import DigitalTwinView from './components/DigitalTwinView';
import SpatialLiveView from './components/SpatialLiveView';
import SettingsView from './components/SettingsView';
import ConnectorsView from './components/ConnectorsView';
import ReportsView from './components/ReportsView';
import OmniAI from './components/OmniAI';
import TemporalRewind from './components/TemporalRewind';
import IntentPalette from './components/IntentPalette';
import CSVUploaderModal from './components/CSVUploaderModal';
import { sampleNodes, sampleLogs, sampleAlerts, sampleWifiAPs, sampleTraffic, sampleTopTalkers } from './data/samples';
import './index.css';

type View = 'summary' | 'inventory' | 'logs' | 'nta' | 'wireless' | 'rca' | 'twin' | 'spatial-live' | 'connectors' | 'reports' | 'settings';

const navItems: { id: View; icon: React.ReactNode; label: string; section?: string }[] = [
  { id: 'summary', icon: <Network size={18}/>, label: 'Summary', section: 'Monitor' },
  { id: 'inventory', icon: <Server size={18}/>, label: 'Nodes' },
  { id: 'spatial-live', icon: <Compass size={18}/>, label: '3D Spatial Map' },
  { id: 'logs', icon: <FileText size={18}/>, label: 'Logs' },
  { id: 'nta', icon: <Zap size={18}/>, label: 'Traffic' },
  { id: 'wireless', icon: <Wifi size={18}/>, label: 'Wireless' },
  { id: 'rca', icon: <Shield size={18}/>, label: 'AI RCA', section: 'AI Ops' },
  { id: 'twin', icon: <Activity size={18}/>, label: 'Digital Twin' },
  { id: 'reports', icon: <FileBarChart size={18}/>, label: 'Reports', section: 'System' },
  { id: 'connectors', icon: <Link2 size={18}/>, label: 'Connectors' },
  { id: 'settings', icon: <Settings size={18}/>, label: 'Config' },
];

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [view, setView] = useState<View>('summary');
  const [hasData, setHasData] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [timeOffset, setTimeOffset] = useState(0); // For Temporal Rewind
  const [showIntent, setShowIntent] = useState(false); // For Intent Palette
  const [showCSVUploader, setShowCSVUploader] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [nodes, setNodes] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [aps, setAPs] = useState<any[]>([]);
  const [traffic, setTraffic] = useState<any[]>([]);
  const [topTalkers, setTopTalkers] = useState<any[]>([]);

  // Apply time offset mutation to nodes
  const currentNodes = React.useMemo(() => {
    if (timeOffset === 0) return nodes;
    
    // Simulate past state: if we go back more than 30 mins, DIST-SW-02 was UP and CORE CPU was low.
    return nodes.map(n => {
      let mut = {...n};
      if (timeOffset < -30 && mut.hostname === 'DIST-SW-02') {
        mut.status = 'up';
      }
      if (timeOffset < -60 && mut.hostname?.includes('CORE-RTR')) {
        mut.cpu = Math.max(10, mut.cpu - 30);
      }
      return mut;
    });
  }, [nodes, timeOffset]);

  const currentAlerts = React.useMemo(() => {
    if (timeOffset === 0) return alerts;
    if (timeOffset < -30) return alerts.filter(a => !a.msg?.includes('unreachable')); // The critical outage hadn't happened yet
    return alerts;
  }, [alerts, timeOffset]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadSample = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      await fetch('http://localhost:8000/api/logs/seed', { method: 'POST', headers });
      const res = await fetch('http://localhost:8000/api/logs', { headers });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      } else {
        setLogs(sampleLogs);
      }
    } catch (e) {
      console.error("Backend fetch failed, falling back to local samples", e);
      setLogs(sampleLogs);
    }
    setNodes(sampleNodes); setAlerts(sampleAlerts);
    setAPs(sampleWifiAPs); setTraffic(sampleTraffic); setTopTalkers(sampleTopTalkers);
    setHasData(true);
  };
  const clearData = () => {
    setNodes([]); setLogs([]); setAlerts([]); setAPs([]); setTraffic([]); setTopTalkers([]);
    setHasData(false);
    setTimeOffset(0);
  };

  if (!loggedIn) return <LoginPage onLogin={() => setLoggedIn(true)} />;

  const renderView = () => {
    switch (view) {
      case 'summary': return <SummaryView nodes={currentNodes} alerts={currentAlerts} traffic={traffic} hasData={hasData} />;
      case 'inventory': return <InventoryView nodes={currentNodes} />;
      case 'logs': return <LogView logs={logs} />;
      case 'nta': return <TrafficView traffic={traffic} topTalkers={topTalkers} hasData={hasData} />;
      case 'wireless': return <WirelessView aps={aps} hasData={hasData} />;
      case 'rca': return <RCAView alerts={currentAlerts} logs={logs} hasData={hasData} />;
      case 'twin': return <DigitalTwinView nodes={currentNodes} hasData={hasData} />;
      case 'spatial-live': return <SpatialLiveView nodes={currentNodes} alerts={currentAlerts} hasData={hasData} />;
      case 'connectors': return <ConnectorsView />;
      case 'reports': return <ReportsView nodes={currentNodes} alerts={currentAlerts} logs={logs} hasData={hasData} />;
      case 'settings': return <SettingsView />;
    }
  };

  let lastSection = '';
  return (
    <div className="app-shell">
      <nav className="nav-rail">
        <div className="nav-rail-logo"><Activity size={24}/></div>
        {navItems.map(item => {
          const showSection = item.section && item.section !== lastSection;
          if (item.section) lastSection = item.section;
          return (
            <React.Fragment key={item.id}>
              {showSection && <div className="nav-rail-section"><span className="nav-rail-section-label">{item.section}</span></div>}
              <div className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => setView(item.id)} title={item.label}>
                {item.icon}
              </div>
            </React.Fragment>
          );
        })}
      </nav>
      <div className="main-area">
        <header className="header-bar">
          <div className="header-left">
            <span className="header-brand">KAS WINDS</span>
            <span className="header-edition">Enterprise</span>
          </div>
          <div className="header-right">
            <button className="header-btn default" onClick={() => setShowCSVUploader(true)}>
              <UploadCloud size={14}/> Upload CSV
            </button>
            <button className={`header-btn ${hasData ? 'danger' : 'primary'}`} onClick={hasData ? clearData : loadSample}>
              <Database size={14}/> {hasData ? 'Clear Data' : 'Load Sample Data'}
            </button>
            <div className="search-box" onClick={() => setShowIntent(true)} style={{cursor: 'pointer'}} title="Click to open AI Intent Command Palette">
              <Search size={14}/>
              <input type="text" readOnly placeholder="Predictive Blast Radius... (⌘K)" style={{cursor: 'pointer'}} />
            </div>
            <Bell size={16} style={{cursor:'pointer', color:'var(--c-text-dim)'}}/>
            {/* User Avatar Dropdown */}
            <div ref={userMenuRef} style={{position:'relative'}}>
              <div style={{display:'flex', alignItems:'center', gap:'6px', cursor:'pointer'}} onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <div className="user-avatar">AD</div>
                <span style={{fontSize:'12px', color:'var(--c-text)'}}>Admin</span>
                <ChevronDown size={12} color="var(--c-text-dim)"/>
              </div>
              {userMenuOpen && (
                <div style={{
                  position:'absolute', top:'40px', right:0, width:'220px', background:'var(--c-surface)',
                  border:'1px solid var(--c-border)', borderRadius:'var(--radius)', zIndex:1000,
                  boxShadow:'0 8px 24px rgba(0,0,0,0.4)'
                }}>
                  <div style={{padding:'12px 14px', borderBottom:'1px solid var(--c-border)'}}>
                    <div style={{fontWeight:600, fontSize:'13px', color:'var(--c-text-bright)'}}>admin</div>
                    <div style={{fontSize:'11px', color:'var(--c-text-dim)'}}>Role: Administrator</div>
                    <div style={{fontSize:'11px', color:'var(--c-text-dim)'}}>Source: AD / LDAP</div>
                  </div>
                  <div style={{padding:'4px'}}>
                    <div style={{padding:'8px 10px', cursor:'pointer', borderRadius:'4px', display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'var(--c-text)'}}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-surface-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => { setView('settings'); setUserMenuOpen(false); }}>
                      <User size={14}/> My Profile
                    </div>
                    <div style={{padding:'8px 10px', cursor:'pointer', borderRadius:'4px', display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'var(--c-text)'}}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-surface-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => { setView('settings'); setUserMenuOpen(false); }}>
                      <Settings size={14}/> Settings
                    </div>
                    <div style={{borderTop:'1px solid var(--c-border)', margin:'4px 0'}}/>
                    <div style={{padding:'8px 10px', cursor:'pointer', borderRadius:'4px', display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'var(--c-red)'}}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-surface-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => { setLoggedIn(false); setUserMenuOpen(false); }}>
                      <LogOut size={14}/> Sign Out
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="workspace">{renderView()}</div>
      </div>
      {/* Network DVR */}
      {loggedIn && <TemporalRewind onTimeChange={setTimeOffset} />}
      {/* Global Omni-AI Assistant */}
      <OmniAI currentView={view} globalData={{nodes, logs, alerts, traffic}} />
      {/* Zero-Touch Intent Palette */}
      {showIntent && <IntentPalette onClose={() => setShowIntent(false)} />}
      
      {/* CSV Uploader */}
      {showCSVUploader && (
        <CSVUploaderModal 
          onClose={() => setShowCSVUploader(false)} 
          onUpload={(parsedMappings) => {
            setNodes(prev => prev.map(n => {
              const mapped = parsedMappings.find((m:any) => m.hostname === n.hostname || m.ip === n.ip);
              return mapped ? { ...n, location: mapped.location } : n;
            }));
            setShowCSVUploader(false);
            setView('spatial-live'); // Auto-navigate to 3D map
          }} 
        />
      )}
    </div>
  );
}

class GlobalErrorBoundary extends React.Component<any, { hasError: boolean, error: any, info: any }> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null, info: null }; }
  componentDidCatch(error: any, info: any) { this.setState({ hasError: true, error, info }); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding:'20px', background:'#222', color:'#ff8888', height:'100vh', width:'100vw', overflow:'auto'}}>
          <h2>App Crashed!</h2>
          <pre>{this.state.error?.toString()}</pre>
          <pre>{this.state.info?.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppWithBoundary() {
  return <GlobalErrorBoundary><App /></GlobalErrorBoundary>;
}

export default AppWithBoundary;
