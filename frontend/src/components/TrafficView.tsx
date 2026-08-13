import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

function formatBytes(b: number) {
  if (b >= 1e9) return (b/1e9).toFixed(1) + ' GB';
  if (b >= 1e6) return (b/1e6).toFixed(1) + ' MB';
  return (b/1e3).toFixed(1) + ' KB';
}

export default function TrafficView({ traffic, topTalkers, hasData }: any) {
  const Empty = () => <div className="empty-state"><Zap size={40} style={{opacity:0.4}}/><h3>No Flow Data</h3><p>Configure NetFlow/sFlow collectors or load sample data.</p></div>;

  if (!hasData) return <div className="card" style={{height:'100%'}}><Empty/></div>;

  return (
    <div>
      <div className="workspace-title">NetFlow Traffic Analyzer (NTA)</div>

      <div className="grid grid-2" style={{marginBottom:'12px'}}>
        <div className="card">
          <div className="card-header"><span className="card-title">Bandwidth Over Time (Mbps)</span></div>
          <div className="card-body">
            <div className="chart-container-lg">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={traffic} margin={{top:5,right:20,left:0,bottom:5}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)"/>
                  <XAxis dataKey="time" stroke="var(--c-text-dim)" tick={{fontSize:10}}/>
                  <YAxis stroke="var(--c-text-dim)" tick={{fontSize:10}}/>
                  <Tooltip contentStyle={{background:'var(--c-surface)',border:'1px solid var(--c-border)',fontSize:'12px'}}/>
                  <Area type="monotone" dataKey="inbound" stroke="var(--c-accent)" fill="var(--c-accent-dim)" strokeWidth={2} name="Inbound"/>
                  <Area type="monotone" dataKey="outbound" stroke="var(--c-green)" fill="var(--c-green-dim)" strokeWidth={2} name="Outbound"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Top Talkers by Volume</span></div>
          <div className="card-body">
            <div className="chart-container-lg">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topTalkers} layout="vertical" margin={{top:5,right:20,left:10,bottom:5}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" horizontal={false}/>
                  <XAxis type="number" stroke="var(--c-text-dim)" tick={{fontSize:10}} tickFormatter={(v:number) => formatBytes(v)}/>
                  <YAxis dataKey="hostname" type="category" stroke="var(--c-text-dim)" width={90} tick={{fontSize:11}}/>
                  <Tooltip contentStyle={{background:'var(--c-surface)',border:'1px solid var(--c-border)',fontSize:'12px'}} formatter={(v:number) => formatBytes(v)}/>
                  <Bar dataKey="bytes" fill="var(--c-purple)" radius={[0,3,3,0]} barSize={16}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Flow Details</span></div>
        <div style={{overflowX:'auto'}}>
          <table className="data-table">
            <thead><tr><th>Rank</th><th>Source IP</th><th>Hostname</th><th>Total Bytes</th><th>% of Total</th><th>Bar</th></tr></thead>
            <tbody>
              {topTalkers.map((t:any, i:number) => (
                <tr key={i}>
                  <td style={{fontWeight:600}}>#{i+1}</td>
                  <td style={{fontFamily:'monospace', color:'var(--c-text-dim)'}}>{t.ip}</td>
                  <td style={{fontWeight:500}}>{t.hostname}</td>
                  <td>{formatBytes(t.bytes)}</td>
                  <td>{t.pct}%</td>
                  <td style={{width:'120px'}}>
                    <div style={{width:'100px', height:'6px', background:'var(--c-border)', borderRadius:'3px', overflow:'hidden'}}>
                      <div style={{width:`${t.pct * 3}%`, height:'100%', background:'var(--c-purple)', borderRadius:'3px'}}/>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
