import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Microscope, GitBranch, Radio, Skull, DollarSign, ChevronRight, Compass, Network, Cpu, Thermometer, AlertCircle } from 'lucide-react';
import { sampleAutopsyTimeline, sampleBlameChain, autopsyTopology, autopsyEdges, sampleNodes } from '../data/samples';
import type { AutopsyEvent, BlameChainNode } from '../data/samples';

const SEV_COLORS: Record<string, string> = {
  critical: '#dc2626', warning: '#d97706', info: '#0284c7', impact: '#7c3aed'
};
// Use AlertCircle instead of AlertTriangle just in case of Lucide version deprecations
const SEV_ICONS: Record<string, React.ReactNode> = {
  critical: <Skull size={13}/>, warning: <AlertCircle size={13}/>,
  info: <Radio size={13}/>, impact: <DollarSign size={13}/>
};
const SPEEDS = [0.5, 1, 2, 4];

export default function IncidentAutopsy({ onClose }: { onClose: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(-0.1);
  const [speed, setSpeed] = useState(1);
  const [viewMode, setViewMode] = useState<'logical' | 'spatial'>('spatial'); // Default to spatial as per user focus
  const [aiSpatialActive, setAiSpatialActive] = useState(true); // Default to on for demo
  const [visibleEvents, setVisibleEvents] = useState<AutopsyEvent[]>([]);
  const [typingIdx, setTypingIdx] = useState(-1);
  const [typedChars, setTypedChars] = useState(0);
  const [affectedNodes, setAffectedNodes] = useState<Map<string, string>>(new Map());
  const [visibleBlame, setVisibleBlame] = useState<BlameChainNode[]>([]);
  const narrationRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const typeTimerRef = useRef<number | null>(null);

  const [rotX, setRotX] = useState(55);
  const [rotZ, setRotZ] = useState(-35);
  const [isDragging, setIsDragging] = useState(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const safeTimeline = Array.isArray(sampleAutopsyTimeline) && sampleAutopsyTimeline.length > 0 ? sampleAutopsyTimeline : [];
  const maxTime = safeTimeline.length > 0 ? safeTimeline[safeTimeline.length - 1].time + 2 : 10;

  // Mouse handlers for 3D rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewMode !== 'spatial') return;
    setIsDragging(true);
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || viewMode !== 'spatial') return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setRotZ(prev => prev + dx * 0.5);
    setRotX(prev => Math.max(10, Math.min(85, prev - dy * 0.5)));
  };

  const handleMouseUp = () => setIsDragging(false);

  // Play/pause loop
  useEffect(() => {
    if (!isPlaying) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = window.setInterval(() => {
      setCurrentTime(prev => {
        const next = prev + 0.05 * speed;
        if (next >= maxTime) { setIsPlaying(false); return maxTime; }
        return next;
      });
    }, 50);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, speed, maxTime]);

  // Update visible events and affected nodes based on currentTime
  useEffect(() => {
    const visible = safeTimeline.filter(e => e.time <= currentTime);
    setVisibleEvents(visible);
    const nodeMap = new Map<string, string>();
    visible.forEach(e => {
      const existing = nodeMap.get(e.nodeId);
      if (!existing || e.severity === 'critical' || e.severity === 'impact') {
        nodeMap.set(e.nodeId, e.severity);
      }
    });
    setAffectedNodes(nodeMap);
    const blameVisible = sampleBlameChain ? sampleBlameChain.filter((_, i) => i < visible.length) : [];
    setVisibleBlame(blameVisible);
  }, [currentTime, safeTimeline]);

  // Typewriter effect
  useEffect(() => {
    const lastIdx = visibleEvents.length - 1;
    if (lastIdx < 0) { setTypingIdx(-1); setTypedChars(0); return; }
    if (lastIdx !== typingIdx) {
      setTypingIdx(lastIdx);
      setTypedChars(0);
    }
  }, [visibleEvents.length]);

  useEffect(() => {
    if (typingIdx < 0 || typingIdx >= visibleEvents.length) return;
    const fullText = visibleEvents[typingIdx].narration || '';
    if (typedChars >= fullText.length) return;
    typeTimerRef.current = window.setTimeout(() => {
      setTypedChars(prev => Math.min(prev + 2, fullText.length));
    }, 12);
    return () => { if (typeTimerRef.current) clearTimeout(typeTimerRef.current); };
  }, [typedChars, typingIdx, visibleEvents]);

  // Auto-scroll narration
  useEffect(() => {
    if (narrationRef.current) narrationRef.current.scrollTop = narrationRef.current.scrollHeight;
  }, [visibleEvents.length, typedChars]);

  if (safeTimeline.length === 0) {
    return <div className="autopsy-overlay"><div style={{padding:'40px',color:'#fff'}}>Error: Autopsy Data Missing</div><button onClick={onClose}>Close</button></div>;
  }

  const handleReset = () => { setIsPlaying(false); setCurrentTime(-0.1); setTypingIdx(-1); setTypedChars(0); };
  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPlaying(false);
    setCurrentTime(parseFloat(e.target.value));
  };
  const jumpToEvent = (idx: number) => {
    if (idx < 0 || idx >= safeTimeline.length) return;
    setIsPlaying(false);
    setCurrentTime(safeTimeline[idx].time + 0.01);
  };

  const getNodeColor = (nodeId: string) => {
    const sev = affectedNodes.get(nodeId);
    return sev ? (SEV_COLORS[sev] || '#1e293b') : '#1e293b';
  };
  
  const isEdgeDead = (from: string, to: string) => {
    const fromSev = affectedNodes.get(from);
    const toSev = affectedNodes.get(to);
    return (fromSev === 'critical' || fromSev === 'impact') || (toSev === 'critical' || toSev === 'impact');
  };

  const topoNode = (id: string) => autopsyTopology.find(n => n.id === id);

  // Spatial Mapping Logic
  const getSpatialCoordinates = (id: string) => {
    const nodeObj = (sampleNodes || []).find(n => n.hostname === id);
    const loc = nodeObj?.location || 'Unknown';
    const mapper = (locStr: string) => {
      if (!locStr) return { x: 500, y: 200, room: 'Network Closet' };
      const l = locStr.toLowerCase().trim();
      if (l.includes('dc-1') || l.includes('basement') || l.includes('data center')) return { x: 250, y: 150, room: 'HQ Data Center (Basement)' };
      if (l.includes('floor-1') || l.includes('floor 1') || l.includes('1st floor')) return { x: 700, y: 100, room: '1st Floor (Lobby)' };
      if (l.includes('floor-2') || l.includes('floor 2') || l.includes('2nd floor')) return { x: 700, y: 200, room: '2nd Floor (Open Office)' };
      if (l.includes('floor-3') || l.includes('floor 3') || l.includes('3rd floor')) return { x: 700, y: 300, room: '3rd Floor (Exec Suites)' };
      return { x: 500, y: 200, room: 'Network Closet' };
    };
    return mapper(loc);
  };

  const currentCriticalNode = typingIdx >= 0 && typingIdx < visibleEvents.length ? visibleEvents[typingIdx].nodeId : null;
  const criticalSpatial = currentCriticalNode ? getSpatialCoordinates(currentCriticalNode) : null;

  // Cinematic Zoom Calculation
  let cameraTransform = `translate(-50%,-50%) rotateX(${rotX}deg) rotateZ(${rotZ}deg) scale(0.9)`;
  const calcCounterRotation = (zoomed: boolean) => {
    const rx = zoomed ? Math.max(10, rotX - 10) : rotX;
    const rz = zoomed ? rotZ + 10 : rotZ;
    return `rotateZ(${-rz}deg) rotateX(${-rx}deg)`;
  };

  if (currentCriticalNode && criticalSpatial && isPlaying) {
    const offsetX = 400 - criticalSpatial.x;
    const offsetY = 200 - criticalSpatial.y;
    cameraTransform = `translate(calc(-50% + ${offsetX * 0.6}px), calc(-50% + ${offsetY * 0.6}px)) rotateX(${Math.max(10, rotX - 10)}deg) rotateZ(${rotZ + 10}deg) scale(1.3)`;
  }

  return (
    <div className="autopsy-overlay">
      {/* HEADER */}
      <div className="autopsy-header">
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <div style={{width:'36px',height:'36px',borderRadius:'8px',background:'rgba(220,38,38,0.15)',color:'#dc2626',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Microscope size={20}/>
          </div>
          <div>
            <div style={{fontWeight:700,fontSize:'15px',color:'#f1f5f9',letterSpacing:'-0.3px'}}>Incident Autopsy — Cascading Failure Forensics</div>
            <div style={{fontSize:'11px',color:'#64748b'}}>AI-Narrated Visual Replay • Root Cause: SFP Failure → E-Commerce Outage</div>
          </div>
        </div>
        
        {/* View Toggles */}
        <div style={{display:'flex',background:'rgba(0,0,0,0.4)',borderRadius:'8px',padding:'4px'}}>
          <button onClick={() => setViewMode('logical')} style={{
            background: viewMode === 'logical' ? 'rgba(255,255,255,0.1)' : 'transparent',
            border:'none',color: viewMode === 'logical' ? '#fff' : '#64748b',padding:'6px 12px',borderRadius:'6px',
            fontSize:'12px',fontWeight:600,display:'flex',alignItems:'center',gap:'6px',cursor:'pointer'
          }}><Network size={14}/> Logical Topology</button>
          
          <button onClick={() => setViewMode('spatial')} style={{
            background: viewMode === 'spatial' ? 'rgba(255,255,255,0.1)' : 'transparent',
            border:'none',color: viewMode === 'spatial' ? '#fff' : '#64748b',padding:'6px 12px',borderRadius:'6px',
            fontSize:'12px',fontWeight:600,display:'flex',alignItems:'center',gap:'6px',cursor:'pointer'
          }}><Compass size={14}/> Geo-Spatial Map</button>
        </div>

        <button onClick={onClose} style={{background:'none',border:'none',color:'#64748b',cursor:'pointer',padding:'8px'}}><X size={20}/></button>
      </div>

      {/* BODY */}
      <div className="autopsy-body">
        {/* CANVAS AREA */}
        <div className="autopsy-canvas">
          
          {/* LOGICAL TOPOLOGY VIEW */}
          {viewMode === 'logical' && (
            <svg width="100%" height="100%" viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid meet">
              <defs>
                <filter id="glow-red"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <filter id="glow-yellow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <filter id="glow-green"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <radialGradient id="bg-glow" cx="50%" cy="40%"><stop offset="0%" stopColor="rgba(2,132,199,0.06)"/><stop offset="100%" stopColor="transparent"/></radialGradient>
              </defs>
              <rect width="1000" height="400" fill="url(#bg-glow)"/>
              {Array.from({length:20}).map((_,i) => <line key={`gv${i}`} x1={i*50} y1={0} x2={i*50} y2={400} stroke="rgba(255,255,255,0.02)" strokeWidth={1}/>)}
              {Array.from({length:8}).map((_,i) => <line key={`gh${i}`} x1={0} y1={i*50} x2={1000} y2={i*50} stroke="rgba(255,255,255,0.02)" strokeWidth={1}/>)}

              {autopsyEdges.map((edge, i) => {
                const from = topoNode(edge.from);
                const to = topoNode(edge.to);
                if (!from || !to) return null;
                const dead = isEdgeDead(edge.from, edge.to);
                const mx = (from.x + to.x) / 2;
                const my = (from.y + to.y) / 2 - 20;
                return (
                  <g key={`e${i}`}>
                    <path d={`M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`}
                      fill="none" stroke={dead ? 'rgba(220,38,38,0.3)' : 'rgba(100,116,139,0.3)'}
                      strokeWidth={dead ? 1.5 : 2} strokeDasharray={dead ? '6 4' : 'none'}
                      style={dead ? {animation:'edgeFlicker 1.5s infinite'} : {}}
                    />
                    {!dead && (
                      <circle r="3" fill="#0284c7" opacity={0.7}>
                        <animateMotion dur={`${2 + i * 0.3}s`} repeatCount="indefinite" path={`M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`}/>
                      </circle>
                    )}
                  </g>
                );
              })}

              {autopsyTopology.map(node => {
                const sev = affectedNodes.get(node.id);
                const nodeColor = getNodeColor(node.id);
                const isAffected = !!sev;
                const isCrit = sev === 'critical' || sev === 'impact';
                return (
                  <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                    {isCrit && (
                      <>
                        <circle cx={0} cy={0} r={20} fill="none" stroke={nodeColor} strokeWidth={2} opacity={0.5}>
                          <animate attributeName="r" values="20;70;20" dur="2.5s" repeatCount="indefinite"/>
                          <animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" repeatCount="indefinite"/>
                        </circle>
                        <circle cx={0} cy={0} r={20} fill="none" stroke={nodeColor} strokeWidth={1} opacity={0.3}>
                          <animate attributeName="r" values="20;100;20" dur="3.5s" repeatCount="indefinite"/>
                          <animate attributeName="opacity" values="0.3;0;0.3" dur="3.5s" repeatCount="indefinite"/>
                        </circle>
                      </>
                    )}
                    {isAffected && <circle cx={0} cy={0} r={28} fill={nodeColor} opacity={0.08} filter={isCrit ? 'url(#glow-red)' : 'url(#glow-yellow)'}/>}
                    <circle cx={0} cy={0} r={22} fill={isAffected ? `${nodeColor}15` : '#0f172a'}
                      stroke={isAffected ? nodeColor : '#334155'} strokeWidth={isAffected ? 2.5 : 1.5}
                      filter={isCrit ? 'url(#glow-red)' : isAffected ? 'url(#glow-yellow)' : undefined}
                    />
                    {!isAffected && <circle cx={0} cy={0} r={22} fill="none" stroke="#059669" strokeWidth={1.5} filter="url(#glow-green)"/>}
                    <text x={0} y={1} textAnchor="middle" dominantBaseline="central" fontSize={14}
                      fill={isAffected ? nodeColor : '#059669'} fontWeight={600}>
                      {node.type === 'router' ? '⬡' : node.type === 'firewall' ? '🛡' : node.type === 'switch' ? '▦' :
                       node.type === 'wireless' ? '◉' : node.type === 'loadbalancer' ? '⚖' : '●'}
                    </text>
                    <text x={0} y={38} textAnchor="middle" fontSize={10} fontWeight={600}
                      fill={isAffected ? nodeColor : '#94a3b8'}>{node.id}</text>
                  </g>
                );
              })}
            </svg>
          )}

          {/* SPATIAL FLOORPLAN VIEW (3D ISOMETRIC with Cinematic Zoom) */}
          {viewMode === 'spatial' && (
            <div 
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{position:'absolute',top:0,left:0,right:0,bottom:0,background:'radial-gradient(ellipse at center, #0a0f1d 0%, #030712 100%)',overflow:'hidden',perspective:'1500px', cursor: isDragging ? 'grabbing' : 'grab'}}
            >
              
              {/* 3D Isometric Map Container - Animates Based on currentCriticalNode */}
              <div style={{
                position:'absolute',top:'55%',left:'50%',
                transform: cameraTransform,
                transformStyle:'preserve-3d', width:'800px', height:'500px',
                transition: isDragging ? 'none' : 'transform 1.5s cubic-bezier(0.25, 1, 0.5, 1)'
              }}>
                {/* Base Grid Plate / Foundation */}
                <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,background:'rgba(2,132,199,0.05)',border:'2px solid rgba(2,132,199,0.2)',borderRadius:'12px',boxShadow:'0 20px 50px rgba(0,0,0,0.8), inset 0 0 100px rgba(2,132,199,0.1)',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px',padding:'4px',transformStyle:'preserve-3d'}}>
                  
                  {/* DC Room (Extruded) */}
                  <div style={{background: criticalSpatial?.room.includes('Basement') && isPlaying ? 'rgba(220,38,38,0.15)' : 'rgba(2,6,23,0.8)',border:'1px solid rgba(2,132,199,0.4)',position:'relative',transform:'translateZ(10px)',boxShadow:'-5px 5px 15px rgba(0,0,0,0.5)',transition:'background 1s', transformStyle:'preserve-3d'}}>
                    <div style={{position:'absolute',top:'10px',left:'10px',fontSize:'16px',fontWeight:700,color:'rgba(2,132,199,0.6)',transform:'translateZ(1px)'}}>HQ Data Center (Basement)</div>
                    {/* 3D Rack */}
                    <div style={{position:'absolute',top:'120px',left:'120px',width:'60px',height:'120px',background:'rgba(255,255,255,0.03)',border: criticalSpatial?.room.includes('Basement') && isPlaying ? '1px solid #dc2626' : '1px solid rgba(2,132,199,0.5)',transform:'translateZ(40px)',boxShadow:'inset 0 0 10px rgba(2,132,199,0.2), -10px 10px 20px rgba(0,0,0,0.6)'}}>
                      <div style={{textAlign:'center',color:'#94a3b8',fontSize:'10px',fontWeight:700,marginTop:'10px',letterSpacing:'1px'}}>RACK A3</div>
                      <div style={{position:'absolute',top:'40px',left:'10px',right:'10px',height:'4px',background:'rgba(220,38,38,0.8)',boxShadow:'0 0 8px #dc2626',animation:'edgeFlicker 1s infinite'}}/>
                      <div style={{position:'absolute',top:'60px',left:'10px',right:'10px',height:'4px',background:'rgba(5,150,105,0.8)',boxShadow:'0 0 8px #059669'}}/>
                    </div>
                  </div>
                  
                  {/* Office Building Structure */}
                  <div style={{position:'relative', transformStyle:'preserve-3d'}}>
                    {/* Glass Walls connecting floors */}
                    <div style={{position:'absolute',top:0,left:0,bottom:0,width:'2px',background:'rgba(2,132,199,0.4)',transform:'translateZ(0) rotateY(-90deg)',transformOrigin:'left',height:'150px'}}/>
                    <div style={{position:'absolute',top:0,right:0,bottom:0,width:'2px',background:'rgba(2,132,199,0.4)',transform:'translateZ(0) rotateY(-90deg)',transformOrigin:'left',height:'150px'}}/>
                    <div style={{position:'absolute',bottom:0,left:0,right:0,height:'2px',background:'rgba(2,132,199,0.4)',transform:'translateZ(0) rotateX(90deg)',transformOrigin:'bottom',width:'100%'}}/>
                    
                    {/* 3 Floors */}
                    <div style={{display:'grid',gridTemplateRows:'1fr 1fr 1fr',gap:'4px',height:'100%',transformStyle:'preserve-3d'}}>
                      <div style={{background: criticalSpatial?.room.includes('3rd') && isPlaying ? 'rgba(220,38,38,0.15)' : 'rgba(2,6,23,0.7)',border:'1px solid rgba(2,132,199,0.5)',position:'relative',transform:'translateZ(150px)',boxShadow:'0 10px 30px rgba(0,0,0,0.6), inset 0 0 20px rgba(2,132,199,0.1)',transition:'background 1s'}}>
                        <div style={{position:'absolute',top:'10px',right:'10px',fontSize:'14px',fontWeight:700,color:'rgba(2,132,199,0.8)'}}>3rd Floor (Exec)</div>
                        {/* Floor layout lines */}
                        <div style={{position:'absolute',top:'30px',left:'30px',bottom:'30px',right:'30px',border:'1px dashed rgba(2,132,199,0.2)'}}/>
                      </div>
                      <div style={{background: criticalSpatial?.room.includes('2nd') && isPlaying ? 'rgba(220,38,38,0.15)' : 'rgba(2,6,23,0.7)',border:'1px solid rgba(2,132,199,0.5)',position:'relative',transform:'translateZ(100px)',boxShadow:'0 10px 30px rgba(0,0,0,0.6), inset 0 0 20px rgba(2,132,199,0.1)',transition:'background 1s'}}>
                        <div style={{position:'absolute',top:'10px',right:'10px',fontSize:'14px',fontWeight:700,color:'rgba(2,132,199,0.8)'}}>2nd Floor (Open Office)</div>
                        <div style={{position:'absolute',top:'30px',left:'30px',bottom:'30px',right:'30px',border:'1px dashed rgba(2,132,199,0.2)'}}/>
                      </div>
                      <div style={{background: criticalSpatial?.room.includes('1st') && isPlaying ? 'rgba(220,38,38,0.15)' : 'rgba(2,6,23,0.7)',border:'1px solid rgba(2,132,199,0.5)',position:'relative',transform:'translateZ(50px)',boxShadow:'0 10px 30px rgba(0,0,0,0.6), inset 0 0 20px rgba(2,132,199,0.1)',transition:'background 1s'}}>
                        <div style={{position:'absolute',top:'10px',right:'10px',fontSize:'14px',fontWeight:700,color:'rgba(2,132,199,0.8)'}}>1st Floor (Lobby)</div>
                        <div style={{position:'absolute',top:'30px',left:'30px',bottom:'30px',right:'30px',border:'1px dashed rgba(2,132,199,0.2)'}}/>
                      </div>
                    </div>
                  </div>
                </div>

                {autopsyTopology.map(node => {
                  const coords = getSpatialCoordinates(node.id);
                  const sev = affectedNodes.get(node.id);
                  const nodeColor = getNodeColor(node.id);
                  const isAffected = !!sev;
                  const isCrit = sev === 'critical' || sev === 'impact';
                  const isCurrentTarget = node.id === currentCriticalNode;
                  const zHeight = coords.room.includes('Basement') ? 60 : coords.room.includes('3rd') ? 160 : coords.room.includes('2nd') ? 110 : 60;
                  
                  return (
                    <div key={node.id} style={{
                      position:'absolute', left:`${coords.x}px`, top:`${coords.y}px`,
                      transform:`translate(-50%, -50%) translateZ(${zHeight}px)`,
                      transformStyle:'preserve-3d', zIndex: isCrit ? 10 : 5
                    }}>
                      {isCrit && (
                        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%) translateZ(-1px)',width:'120px',height:'120px',borderRadius:'50%',background:`radial-gradient(circle, ${nodeColor} 0%, transparent 70%)`,opacity:0.6,animation:'pulseRed 2s infinite'}}/>
                      )}
                      {/* Counter-rotate icon */}
                      <div style={{
                        transform: (isPlaying && isCurrentTarget) ? `${calcCounterRotation(true)} scale(1.3)` : calcCounterRotation(false),
                        transition:'transform 1.5s cubic-bezier(0.25, 1, 0.5, 1)',
                        width:'36px',height:'36px',borderRadius:'8px',
                        background:isAffected ? `${nodeColor}33` : 'rgba(15,23,42,0.8)',
                        border:`2px solid ${isAffected ? nodeColor : '#334155'}`,display:'flex',alignItems:'center',justifyContent:'center',
                        color:isAffected ? nodeColor : '#059669',position:'relative',
                        boxShadow: isAffected ? `0 0 20px ${nodeColor}, -5px 10px 15px rgba(0,0,0,0.5)` : '-5px 10px 15px rgba(0,0,0,0.5)'
                      }}>
                        <Cpu size={18}/>
                      </div>
                      <div style={{
                        position:'absolute',top:'20px',left:'30px',
                        transform: (isPlaying && isCurrentTarget) ? `${calcCounterRotation(true)} scale(1.1)` : calcCounterRotation(false),
                        transition:'transform 1.5s cubic-bezier(0.25, 1, 0.5, 1)',
                        width:'140px',background:'rgba(0,0,0,0.6)',padding:'4px 8px',borderRadius:'4px',
                        border:`1px solid ${isAffected ? nodeColor : 'rgba(255,255,255,0.1)'}`
                      }}>
                        <div style={{fontSize:'10px',fontWeight:700,color:isAffected ? nodeColor : '#e2e8f0'}}>{node.id}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* AI Spatial Insight Overlay */}
              <div style={{position:'absolute',top:'16px',right:'24px',width:'340px',zIndex:20}}>
                <button onClick={() => setAiSpatialActive(!aiSpatialActive)} style={{width:'100%',background:'linear-gradient(90deg, rgba(124,58,237,0.2), rgba(79,70,229,0.2))',border:'1px solid rgba(124,58,237,0.5)',color:'#c4b5fd',padding:'12px',borderRadius:'10px',fontSize:'13px',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',cursor:'pointer',boxShadow:'0 8px 32px rgba(0,0,0,0.5)',backdropFilter:'blur(8px)',transition:'all 0.3s'}}>
                  <Compass size={18}/> {aiSpatialActive ? 'Hide AI Sensor Report' : 'Generate AI Physical Report'}
                </button>
                
                {aiSpatialActive && criticalSpatial && (
                  <div style={{marginTop:'16px',background:'rgba(15,23,42,0.85)',backdropFilter:'blur(16px)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'12px',overflow:'hidden',animation:'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',boxShadow:'0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.2)'}}>
                    <div style={{background:'linear-gradient(90deg, rgba(220,38,38,0.15), transparent)',padding:'16px 20px',borderBottom:'1px solid rgba(255,255,255,0.05)',display:'flex',alignItems:'center',gap:'12px'}}>
                      <div className="dot dot-red" style={{animation:'pulse 1s infinite',width:'10px',height:'10px',boxShadow:'0 0 12px #dc2626'}}/>
                      <div>
                        <div style={{fontSize:'14px',fontWeight:700,color:'#f8fafc',letterSpacing:'-0.3px'}}>Physical Cascade Focus</div>
                        <div style={{fontSize:'11px',color:'#94a3b8',marginTop:'2px'}}>Tracking incident at {currentCriticalNode}</div>
                      </div>
                    </div>
                    
                    <div style={{padding:'20px'}}>
                      <div style={{display:'flex',gap:'12px',marginBottom:'20px'}}>
                        <div style={{width:'4px',background:'linear-gradient(to bottom, #d97706, #dc2626)',borderRadius:'2px'}}/>
                        <div style={{fontSize:'13px',color:'#cbd5e1',lineHeight:'1.6'}}>
                          AI has localized the <span style={{color: '#f8fafc', fontWeight: 600}}>active failure</span> to <b style={{color:'#f1f5f9'}}>{criticalSpatial.room}</b>. 
                          Cinematic focus is locked onto {currentCriticalNode}.
                        </div>
                      </div>
                      
                      <div style={{background:'rgba(0,0,0,0.4)',borderRadius:'8px',border:'1px solid rgba(255,255,255,0.05)',overflow:'hidden'}}>
                        <div style={{padding:'10px 14px',background:'rgba(217,119,6,0.1)',borderBottom:'1px solid rgba(255,255,255,0.05)',display:'flex',alignItems:'center',gap:'8px'}}>
                          <Thermometer size={14} color="#f59e0b"/>
                          <span style={{fontSize:'11px',fontWeight:700,color:'#fcd34d',textTransform:'uppercase',letterSpacing:'0.5px'}}>IoT Facility Telemetry</span>
                        </div>
                        <div style={{padding:'14px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
                          <div>
                            <div style={{fontSize:'10px',color:'#64748b',marginBottom:'4px',textTransform:'uppercase'}}>Rack Ambient</div>
                            <div style={{fontSize:'20px',fontWeight:700,color: criticalSpatial.room.includes('Basement') ? '#ef4444' : '#10b981',display:'flex',alignItems:'center',gap:'6px'}}>
                              {criticalSpatial.room.includes('Basement') ? '34°C' : '21°C'} 
                              {criticalSpatial.room.includes('Basement') && <span style={{fontSize:'12px',color:'#ef4444'}}>▲ +4°</span>}
                            </div>
                          </div>
                          <div>
                            <div style={{fontSize:'10px',color:'#64748b',marginBottom:'4px',textTransform:'uppercase'}}>Network Node</div>
                            <div style={{fontSize:'20px',fontWeight:700,color: '#38bdf8',display:'flex',alignItems:'center',gap:'6px'}}>
                              {currentCriticalNode}
                            </div>
                          </div>
                        </div>
                        <div style={{padding:'10px 14px',background:'rgba(0,0,0,0.2)',borderTop:'1px solid rgba(255,255,255,0.02)',fontSize:'11px',color:'#94a3b8',lineHeight:'1.5'}}>
                          <b style={{color:'#e2e8f0'}}>AI Conclusion:</b> The cascading logical failure maps directly to physical layout propagating outward from the initial hardware breakdown point.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Overlay timestamp */}
          <div style={{position:'absolute',top:'16px',left:'16px',padding:'6px 14px',borderRadius:'6px',background:'rgba(0,0,0,0.6)',border:'1px solid rgba(255,255,255,0.08)',fontSize:'13px',fontFamily:"'JetBrains Mono',monospace",color:'#94a3b8'}}>
            T+{Math.max(0, currentTime).toFixed(1)}s
          </div>
          {/* Impact counter */}
          <div style={{position:'absolute',top:'16px',left:'120px',display:'flex',gap:'8px'}}>
            <div style={{padding:'6px 12px',borderRadius:'6px',background:'rgba(220,38,38,0.1)',border:'1px solid rgba(220,38,38,0.2)',fontSize:'11px',color:'#dc2626',fontWeight:600}}>
              {affectedNodes.size} Nodes Affected
            </div>
          </div>
        </div>

        {/* SIDEBAR — Narration + Blame Chain */}
        <div className="autopsy-sidebar">
          {/* Narration Panel */}
          <div style={{flex:1,display:'flex',flexDirection:'column',borderBottom:'1px solid rgba(255,255,255,0.06)',minHeight:0}}>
            <div style={{padding:'14px 18px',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',gap:'8px',flexShrink:0}}>
              <Radio size={14} color="#0284c7"/>
              <span style={{fontSize:'12px',fontWeight:700,color:'#e2e8f0',textTransform:'uppercase',letterSpacing:'0.5px'}}>AI Forensic Narration</span>
              <span style={{marginLeft:'auto',fontSize:'10px',color:'#059669',display:'flex',alignItems:'center',gap:'4px'}}>
                <span style={{width:'6px',height:'6px',borderRadius:'50%',background:'#059669',display:'inline-block'}}/>LIVE
              </span>
            </div>
            <div ref={narrationRef} style={{flex:1,overflowY:'auto',padding:'14px 18px'}}>
              {visibleEvents.length === 0 && (
                <div style={{textAlign:'center',color:'#475569',fontSize:'12px',padding:'40px 20px'}}>
                  <Microscope size={32} style={{opacity:0.3,marginBottom:'12px'}}/>
                  <div>Press Play to begin forensic analysis</div>
                </div>
              )}
              {visibleEvents.map((evt, i) => {
                const isLast = i === visibleEvents.length - 1;
                const displayText = isLast && i === typingIdx ? evt.narration.substring(0, typedChars) : evt.narration;
                const isTyping = isLast && i === typingIdx && typedChars < evt.narration.length;
                return (
                  <div key={i} className={`autopsy-narration-entry sev-${evt.severity} ${isLast ? 'active' : ''}`}
                    style={{animationDelay:`${i*0.05}s`}}>
                    <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'6px'}}>
                      <span style={{color:SEV_COLORS[evt.severity]}}>{SEV_ICONS[evt.severity]}</span>
                      <span style={{fontSize:'10px',fontWeight:700,color:SEV_COLORS[evt.severity],textTransform:'uppercase'}}>{evt.severity}</span>
                      <span style={{fontSize:'10px',color:'#475569',fontFamily:"'JetBrains Mono',monospace"}}>T+{evt.time.toFixed(1)}s</span>
                      <span style={{fontSize:'10px',color:'#64748b',marginLeft:'auto',fontWeight:600}}>{evt.nodeId}</span>
                    </div>
                    <div style={{fontSize:'12px',color:'#cbd5e1',lineHeight:'1.6'}}>
                      {displayText}
                      {isTyping && <span className="autopsy-typing-cursor"/>}
                    </div>
                    {evt.businessImpact && (
                      <div style={{marginTop:'8px',padding:'6px 10px',borderRadius:'4px',background:'rgba(124,58,237,0.1)',border:'1px solid rgba(124,58,237,0.2)',fontSize:'11px',color:'#a78bfa',fontWeight:600}}>
                        💰 {evt.businessImpact}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Blame Chain Panel */}
          <div style={{height:'45%',display:'flex',flexDirection:'column',minHeight:0}}>
            <div style={{padding:'14px 18px',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',gap:'8px',flexShrink:0}}>
              <GitBranch size={14} color="#7c3aed"/>
              <span style={{fontSize:'12px',fontWeight:700,color:'#e2e8f0',textTransform:'uppercase',letterSpacing:'0.5px'}}>Causal Blame Chain</span>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'14px 18px'}}>
              {visibleBlame.length === 0 && (
                <div style={{textAlign:'center',color:'#475569',fontSize:'12px',padding:'20px'}}>Awaiting cascade data...</div>
              )}
              {visibleBlame.map((blame, i) => (
                <React.Fragment key={blame.id}>
                  {i > 0 && <div className="blame-chain-connector"/>}
                  <div className="blame-chain-node" style={{animationDelay:`${i*0.1}s`,marginLeft: blame.parentId ? `${Math.min(i * 8, 40)}px` : '0'}}
                    onClick={() => jumpToEvent(Math.min(i, safeTimeline.length - 1))}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'4px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                        <span style={{color:SEV_COLORS[blame.severity]}}>{SEV_ICONS[blame.severity]}</span>
                        <span style={{fontSize:'12px',fontWeight:600,color:'#e2e8f0'}}>{blame.label}</span>
                      </div>
                      <ChevronRight size={12} color="#475569"/>
                    </div>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <span style={{fontSize:'10px',color:'#64748b'}}>{blame.node}</span>
                      <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                        <div style={{width:'40px',height:'4px',borderRadius:'2px',background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
                          <div style={{width:`${blame.confidence}%`,height:'100%',borderRadius:'2px',
                            background: blame.confidence > 95 ? '#059669' : blame.confidence > 85 ? '#d97706' : '#dc2626'}}/>
                        </div>
                        <span style={{fontSize:'10px',fontWeight:600,color: blame.confidence > 95 ? '#059669' : blame.confidence > 85 ? '#d97706' : '#dc2626'}}>
                          {blame.confidence}%
                        </span>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* TIMELINE SCRUBBER */}
        <div className="autopsy-timeline">
          <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
            {/* Controls */}
            <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
              <button onClick={handleReset} style={{background:'none',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'6px',padding:'6px',cursor:'pointer',color:'#94a3b8',display:'flex'}}>
                <SkipBack size={14}/>
              </button>
              <button onClick={() => setIsPlaying(!isPlaying)} style={{
                background: isPlaying ? 'rgba(220,38,38,0.2)' : 'rgba(2,132,199,0.2)',
                border: `1px solid ${isPlaying ? 'rgba(220,38,38,0.3)' : 'rgba(2,132,199,0.3)'}`,
                borderRadius:'6px',padding:'6px 12px',cursor:'pointer',
                color: isPlaying ? '#dc2626' : '#0284c7',display:'flex',alignItems:'center',gap:'4px',fontSize:'12px',fontWeight:600
              }}>
                {isPlaying ? <><Pause size={14}/> Pause</> : <><Play size={14}/> {currentTime <= 0 ? 'Begin Autopsy' : 'Resume'}</>}
              </button>
              <button onClick={() => { if (visibleEvents.length < safeTimeline.length) jumpToEvent(visibleEvents.length); }}
                style={{background:'none',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'6px',padding:'6px',cursor:'pointer',color:'#94a3b8',display:'flex'}}>
                <SkipForward size={14}/>
              </button>
            </div>

            {/* Timeline slider */}
            <div style={{flex:1,position:'relative'}}>
              {/* Keyframe markers */}
              <div style={{position:'relative',height:'20px',marginBottom:'4px'}}>
                {safeTimeline.map((evt, i) => (
                  <div key={i} onClick={() => jumpToEvent(i)} style={{
                    position:'absolute', left:`${(evt.time / maxTime) * 100}%`, top:'0',
                    transform:'translateX(-50%)', cursor:'pointer', zIndex:1
                  }}>
                    <div style={{width:'8px',height:'8px',borderRadius:'50%',
                      background: evt.time <= currentTime ? SEV_COLORS[evt.severity] : '#334155',
                      border: `2px solid ${evt.time <= currentTime ? SEV_COLORS[evt.severity] : '#475569'}`,
                      boxShadow: evt.time <= currentTime ? `0 0 6px ${SEV_COLORS[evt.severity]}` : 'none',
                      transition:'all 0.3s ease'
                    }}/>
                  </div>
                ))}
              </div>
              <input type="range" min={-0.1} max={maxTime} step={0.05} value={currentTime} onChange={handleSlider}
                style={{width:'100%',cursor:'pointer',appearance:'none',height:'4px',
                  background:`linear-gradient(to right, #0284c7 ${(currentTime/maxTime)*100}%, #1e293b ${(currentTime/maxTime)*100}%)`,
                  borderRadius:'2px',outline:'none'
                }}
              />
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'10px',color:'#475569',marginTop:'4px'}}>
                <span>T+0.0s</span>
                <span>T+{maxTime.toFixed(1)}s</span>
              </div>
            </div>

            {/* Speed control */}
            <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
              <span style={{fontSize:'10px',color:'#475569',marginRight:'4px'}}>SPEED</span>
              {SPEEDS.map(s => (
                <button key={s} className={`autopsy-speed-btn ${speed === s ? 'active' : ''}`} onClick={() => setSpeed(s)}>
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
