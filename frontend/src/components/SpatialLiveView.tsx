import React, { useState, useRef, useMemo } from 'react';
import { Cpu, Server, Network, ShieldAlert, X, Activity, HardDrive, FilterX } from 'lucide-react';

class SpatialErrorBoundary extends React.Component<any, { error: any }> {
  constructor(props: any) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error: any) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{padding:'40px', color:'red', background:'#111', height:'100%', whiteSpace:'pre-wrap'}}>
          <h2>SpatialLiveView Crashed</h2>
          <div>{this.state.error.toString()}</div>
          <div style={{color:'#aaa', marginTop:'20px'}}>{this.state.error.stack}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function SpatialLiveViewWrapper(props: any) {
  return <SpatialErrorBoundary><SpatialLiveView {...props} /></SpatialErrorBoundary>;
}

function SpatialLiveView({ nodes, alerts, hasData }: any) {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [rotX, setRotX] = useState(55);
  const [rotZ, setRotZ] = useState(-35);
  const [scale, setScale] = useState(0.5); // Start zoomed out to see wide campus
  const [isUserZoomed, setIsUserZoomed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  
  const lastMouse = useRef({ x: 0, y: 0, isDragMove: false });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastMouse.current = { x: e.clientX, y: e.clientY, isDragMove: false };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) lastMouse.current.isDragMove = true;
    
    lastMouse.current.x = e.clientX;
    lastMouse.current.y = e.clientY;
    setRotZ(prev => prev + dx * 0.5);
    setRotX(prev => Math.max(10, Math.min(85, prev - dy * 0.5)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasClick = () => {
    if (!lastMouse.current.isDragMove) {
      setSelectedNode(null); // Clicked background, zoom out to all
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    setIsUserZoomed(true);
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.1, Math.min(3, prev * zoomFactor)));
  };

  // 1. Extract extra floors and procedurally calculate node coordinates
  const { extraFloors, spatialNodes } = useMemo(() => {
    if (!nodes || nodes.length === 0) return { extraFloors: [], spatialNodes: [] };

    const knownKeys = ['dc-1', 'basement', 'data center', 'floor-1', 'floor 1', '1st floor', 'floor-2', 'floor 2', '2nd floor', 'floor-3', 'floor 3', '3rd floor'];
    const uniqueLocs = Array.from(new Set(nodes.map((n:any) => String(n.location || 'Unknown Location'))));
    
    const extras = uniqueLocs.filter(loc => {
      const l = loc.toLowerCase().trim();
      return !knownKeys.some(k => l.includes(k));
    }).sort((a: string, b: string) => {
      const numA = parseInt(a.match(/\d+/)?.join('') || '0');
      const numB = parseInt(b.match(/\d+/)?.join('') || '0');
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });

    const nodesPerExtraFloor: Record<string, any[]> = {};

    const spNodes = nodes.map((n:any) => {
      let l = String(n.location || 'Unknown Location').toLowerCase().trim();
      let coords = { x: 600, y: 200, room: 'Network Closet', isExtra: false };

      if (l.includes('dc-1') || l.includes('basement') || l.includes('data center')) {
        coords = { x: 200, y: 150, room: 'Data Center 1 (Basement)', isExtra: false };
      } else if (l.includes('floor-1') || l.includes('floor 1') || l.includes('1st floor')) {
        coords = { x: 600, y: 100, room: '1st Floor (Lobby)', isExtra: false };
      } else if (l.includes('floor-2') || l.includes('floor 2') || l.includes('2nd floor')) {
        coords = { x: 600, y: 200, room: '2nd Floor (Open Office)', isExtra: false };
      } else if (l.includes('floor-3') || l.includes('floor 3') || l.includes('3rd floor')) {
        coords = { x: 600, y: 300, room: '3rd Floor (Exec Suites)', isExtra: false };
      } else {
        const extraIdx = extras.indexOf(n.location);
        if (extraIdx >= 0) {
           if (!nodesPerExtraFloor[n.location]) nodesPerExtraFloor[n.location] = [];
           const nodeIdx = nodesPerExtraFloor[n.location].length;
           nodesPerExtraFloor[n.location].push(n);

           const cols = 3;
           const row = Math.floor(nodeIdx / cols);
           const col = nodeIdx % cols;
           
           // Extra floors start after 800px width. Each is 300px wide.
           const baseX = 800 + (extraIdx * 300) + 50 + (col * 80);
           const baseY = 150 + (row * 80);

           coords = { x: baseX, y: baseY, room: n.location, isExtra: true };
        }
      }

      return { ...n, coords };
    });

    return { extraFloors: extras, spatialNodes: spNodes };
  }, [nodes]);

  const baseWidth = 800 + (extraFloors.length * 300);
  const gridCols = `400px 400px ${extraFloors.map(() => '300px').join(' ')}`;

  // Camera tracking logic
  let cameraTransform = `translate(-50%,-50%) rotateX(${rotX}deg) rotateZ(${rotZ}deg) scale(${scale})`;
  
  const calcCounterRotation = (zoomed: boolean) => {
    const rx = zoomed ? Math.max(10, rotX - 10) : rotX;
    const rz = zoomed ? rotZ + 10 : rotZ;
    return `rotateZ(${-rz}deg) rotateX(${-rx}deg)`;
  };

  // Find the live version of the selected node to ensure timeline scrubs update its status
  const liveSelectedNode = selectedNode ? spatialNodes.find((n:any) => n.id === selectedNode.id) : null;
  
  // Find the primary anomalous node for autonomous camera tracking
  const anomalousNodesAll = spatialNodes.filter((n:any) => n.status !== 'up');
  const autoFocusNode = anomalousNodesAll.length > 0 ? anomalousNodesAll[0] : null;
  
  // The camera and AI panel focus on the manually selected node, or autonomously follow incidents
  const focusNode = liveSelectedNode || autoFocusNode;

  if (focusNode && focusNode.coords) {
    const offsetX = (baseWidth / 2) - focusNode.coords.x;
    const offsetY = 250 - focusNode.coords.y;
    // When focusing, we can use a slightly higher scale than the global scale if the global is too small
    // But if the user manually zoomed, respect their zoom level so they can zoom out
    const targetScale = isUserZoomed ? scale : Math.max(scale, 1.3);
    cameraTransform = `translate(calc(-50% + ${offsetX * targetScale}px), calc(-50% + ${offsetY * targetScale}px)) rotateX(${Math.max(10, rotX - 10)}deg) rotateZ(${rotZ + 10}deg) scale(${targetScale})`;
  }

  const getNodeColor = (status: string) => {
    if (status === 'critical' || status === 'down') return '#dc2626';
    if (status === 'warning') return '#d97706';
    return '#059669';
  };

  const getZHeight = (room: string, isExtra: boolean) => {
    if (isExtra) return 50;
    if (room.includes('Basement')) return 60;
    if (room.includes('3rd')) return 160;
    if (room.includes('2nd')) return 110;
    if (room.includes('1st')) return 60;
    return 60; // fallback
  };

  if (!hasData) {
    return (
      <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
        <div className="workspace-title">Live 3D Spatial Map</div>
        <div className="card" style={{height:'100%'}}>
          <div className="empty-state">
            <Activity size={40} style={{opacity:0.4}}/>
            <h3>Spatial Telemetry Offline</h3>
            <p>Load network data to activate the 3D Digital Twin.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:'flex', flexDirection:'column', height:'100%', position:'relative'}}>
      
      {/* Header overlay */}
      <div style={{position:'absolute', top:24, left:24, zIndex:100}}>
        <div className="workspace-title" style={{margin:0}}>Live Spatial Twin</div>
        <div style={{fontSize:'13px', color:'var(--c-text-dim)', marginTop:'4px'}}>Interactive physical and logical layer monitoring.</div>
        
        <div style={{display:'flex', gap:'8px', marginTop:'16px'}}>
          <button className={`header-btn ${viewMode === '3d' ? 'primary' : ''}`} onClick={() => setViewMode('3d')}>
            <Activity size={14}/> 3D Spatial View
          </button>
          <button className={`header-btn ${viewMode === '2d' ? 'primary' : ''}`} onClick={() => setViewMode('2d')}>
            <Network size={14}/> Logical Topology
          </button>
        </div>

        {focusNode && (
          <button 
            className="header-btn danger" 
            style={{marginTop:'12px'}}
            onClick={() => setSelectedNode(null)}
          >
            <FilterX size={14}/> {selectedNode ? 'Clear Manual Selection' : 'Autonomous Tracking Active'}
          </button>
        )}
      </div>

      {viewMode === '2d' ? (
        <div style={{
          position:'absolute',top:0,left:0,right:0,bottom:0,
          background:'radial-gradient(ellipse at center, #0a0f1d 0%, #030712 100%)',
          overflow:'hidden', borderRadius:'var(--radius)', border:'1px solid var(--c-border)'
        }}>
          <svg style={{width:'100%', height:'100%', position:'absolute', top:0, left:0, pointerEvents:'none'}}>
            {/* Compute Logical Layout */}
            {(() => {
              const cores = spatialNodes.filter((n:any) => n.hostname.includes('CORE') || n.hostname.includes('RTR'));
              const dists = spatialNodes.filter((n:any) => n.hostname.includes('DIST'));
              const accs = spatialNodes.filter((n:any) => n.hostname.includes('ACC') || (n.hostname.includes('SW') && !n.hostname.includes('DIST')));
              const others = spatialNodes.filter((n:any) => !cores.includes(n) && !dists.includes(n) && !accs.includes(n));
              
              const levels = [cores, dists, accs, others];
              const logicalNodes: any[] = [];
              const svgWidth = 800; // rough view width
              
              levels.forEach((levelNodes, levelIdx) => {
                const y = 150 + (levelIdx * 120);
                const spacing = svgWidth / (levelNodes.length + 1);
                levelNodes.forEach((node: any, nodeIdx: number) => {
                  const x = spacing * (nodeIdx + 1);
                  logicalNodes.push({ ...node, logicalX: x, logicalY: y, level: levelIdx });
                });
              });

              // Generate connections (simple hierarchical)
              const links: any[] = [];
              logicalNodes.forEach(node => {
                if (node.level > 0) {
                  // Connect to a parent in the level above
                  const parents = logicalNodes.filter(n => n.level === node.level - 1);
                  if (parents.length > 0) {
                    // connect to a random parent for demo, or first based on index
                    const parent = parents[node.logicalX % parents.length] || parents[0];
                    links.push({ source: parent, target: node });
                    // Also connect to a second parent for redundancy if possible
                    if (parents.length > 1) {
                        links.push({ source: parents[1], target: node });
                    }
                  }
                }
              });

              return (
                <>
                  {links.map((link, i) => (
                    <line key={`link-${i}`} x1={link.source.logicalX} y1={link.source.logicalY} x2={link.target.logicalX} y2={link.target.logicalY} stroke="rgba(255,255,255,0.1)" strokeWidth={2}/>
                  ))}
                  {logicalNodes.map(node => {
                    const isSelected = liveSelectedNode?.id === node.id;
                    const nodeColor = getNodeColor(node.status);
                    return (
                      <g key={node.id} style={{transform: `translate(${node.logicalX}px, ${node.logicalY}px)`, pointerEvents:'auto', cursor:'pointer'}} onClick={() => setSelectedNode(node)}>
                        <circle r="18" fill="var(--c-surface)" stroke={nodeColor} strokeWidth={isSelected ? 3 : 1} />
                        {node.status === 'down' && <circle r="25" fill="none" stroke="var(--c-red)" strokeWidth="2" opacity="0.6"><animate attributeName="r" values="20;35" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.8;0" dur="2s" repeatCount="indefinite"/></circle>}
                        <text y="30" textAnchor="middle" fill={nodeColor} fontSize="11px" fontWeight="bold">{node.hostname}</text>
                        <text y="42" textAnchor="middle" fill="var(--c-text-dim)" fontSize="9px">{node.location}</text>
                      </g>
                    );
                  })}
                </>
              );
            })()}
          </svg>
        </div>
      ) : (
      <div 
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          position:'absolute',top:0,left:0,right:0,bottom:0,
          background:'radial-gradient(ellipse at center, #0a0f1d 0%, #030712 100%)',
          overflow:'hidden',perspective:'1500px', cursor: isDragging ? 'grabbing' : 'grab',
          borderRadius:'var(--radius)', border:'1px solid var(--c-border)'
        }}
      >
        <div style={{
          position:'absolute',top:14,right:24,zIndex:100,
          color:'var(--c-text-dim)',fontSize:'11px',display:'flex',gap:'12px',alignItems:'center'
        }}>
          <div>Scroll to Zoom: {(scale*100).toFixed(0)}%</div>
          <button onClick={() => { setScale(0.5); setIsUserZoomed(false); }} className="header-btn">Reset View</button>
        </div>

        <div style={{
          position:'absolute',top:'55%',left:'50%',
          transform: cameraTransform,
          transformStyle:'preserve-3d', width:`${baseWidth}px`, height:'500px',
          transition: isDragging ? 'none' : 'transform 1.5s cubic-bezier(0.25, 1, 0.5, 1)'
        }}>
          {/* Base Grid Plate / Foundation */}
          <div style={{
            position:'absolute',top:0,left:0,right:0,bottom:0,
            background:'rgba(2,132,199,0.05)',border:'2px solid rgba(2,132,199,0.2)',
            borderRadius:'12px',boxShadow:'0 20px 50px rgba(0,0,0,0.8), inset 0 0 100px rgba(2,132,199,0.1)',
            display:'grid',gridTemplateColumns: gridCols,gap:'4px',padding:'4px',
            transformStyle:'preserve-3d', pointerEvents:'none', transition:'width 0.5s'
          }}>
            
            {/* DC Room (Extruded) */}
            <div style={{background: selectedNode?.coords.room.includes('Basement') ? 'rgba(220,38,38,0.15)' : 'rgba(2,6,23,0.8)',border:'1px solid rgba(2,132,199,0.4)',position:'relative',transform:'translateZ(10px)',boxShadow:'-5px 5px 15px rgba(0,0,0,0.5)',transition:'background 1s', transformStyle:'preserve-3d'}}>
              <div style={{position:'absolute',top:'10px',left:'10px',fontSize:'16px',fontWeight:700,color:'rgba(2,132,199,0.6)',transform:'translateZ(1px)'}}>HQ Data Center (Basement)</div>
              {/* 3D Rack A3 */}
              <div style={{position:'absolute',top:'120px',left:'120px',width:'60px',height:'120px',background:'rgba(255,255,255,0.03)',border: selectedNode?.coords.room.includes('Basement') ? '1px solid #dc2626' : '1px solid rgba(2,132,199,0.5)',transform:'translateZ(40px)',boxShadow:'inset 0 0 10px rgba(2,132,199,0.2), -10px 10px 20px rgba(0,0,0,0.6)'}}>
                <div style={{textAlign:'center',color:'#94a3b8',fontSize:'10px',fontWeight:700,marginTop:'10px',letterSpacing:'1px'}}>RACK A3</div>
                <div style={{position:'absolute',top:'40px',left:'10px',right:'10px',height:'4px',background:'rgba(220,38,38,0.8)',boxShadow:'0 0 8px #dc2626'}}/>
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
                <div style={{background: selectedNode?.coords.room.includes('3rd') ? 'rgba(2,132,199,0.2)' : 'rgba(2,6,23,0.7)',border:'1px solid rgba(2,132,199,0.5)',position:'relative',transform:'translateZ(150px)',boxShadow:'0 10px 30px rgba(0,0,0,0.6), inset 0 0 20px rgba(2,132,199,0.1)',transition:'background 1s'}}>
                  <div style={{position:'absolute',top:'10px',right:'10px',fontSize:'14px',fontWeight:700,color:'rgba(2,132,199,0.8)'}}>3rd Floor (Exec)</div>
                  <div style={{position:'absolute',top:'30px',left:'30px',bottom:'30px',right:'30px',border:'1px dashed rgba(2,132,199,0.2)'}}/>
                </div>
                <div style={{background: selectedNode?.coords.room.includes('2nd') ? 'rgba(2,132,199,0.2)' : 'rgba(2,6,23,0.7)',border:'1px solid rgba(2,132,199,0.5)',position:'relative',transform:'translateZ(100px)',boxShadow:'0 10px 30px rgba(0,0,0,0.6), inset 0 0 20px rgba(2,132,199,0.1)',transition:'background 1s'}}>
                  <div style={{position:'absolute',top:'10px',right:'10px',fontSize:'14px',fontWeight:700,color:'rgba(2,132,199,0.8)'}}>2nd Floor (Open Office)</div>
                  <div style={{position:'absolute',top:'30px',left:'30px',bottom:'30px',right:'30px',border:'1px dashed rgba(2,132,199,0.2)'}}/>
                </div>
                <div style={{background: selectedNode?.coords.room.includes('1st') ? 'rgba(2,132,199,0.2)' : 'rgba(2,6,23,0.7)',border:'1px solid rgba(2,132,199,0.5)',position:'relative',transform:'translateZ(50px)',boxShadow:'0 10px 30px rgba(0,0,0,0.6), inset 0 0 20px rgba(2,132,199,0.1)',transition:'background 1s'}}>
                  <div style={{position:'absolute',top:'10px',right:'10px',fontSize:'14px',fontWeight:700,color:'rgba(2,132,199,0.8)'}}>1st Floor (Lobby)</div>
                  <div style={{position:'absolute',top:'30px',left:'30px',bottom:'30px',right:'30px',border:'1px dashed rgba(2,132,199,0.2)'}}/>
                </div>
              </div>
            </div>

            {/* Extra Floors */}
            {extraFloors.map((floorName) => {
              const isFocused = focusNode?.coords.room === floorName;
              return (
                <div key={floorName} style={{position:'relative', transformStyle:'preserve-3d'}}>
                  <div style={{
                    position:'absolute', top:0, left:0, right:0, bottom:0,
                    background: isFocused ? 'rgba(2,132,199,0.2)' : 'rgba(2,6,23,0.7)',
                    border:'1px solid rgba(2,132,199,0.5)',
                    transform:'translateZ(50px)',
                    boxShadow:'0 10px 30px rgba(0,0,0,0.6), inset 0 0 20px rgba(2,132,199,0.1)',
                    transition:'background 1s',
                    transformStyle:'preserve-3d'
                  }}>
                    <div style={{position:'absolute',top:'10px',right:'10px',fontSize:'14px',fontWeight:700,color:'rgba(2,132,199,0.8)'}}>{floorName}</div>
                    <div style={{position:'absolute',top:'30px',left:'30px',bottom:'30px',right:'30px',border:'1px dashed rgba(2,132,199,0.2)'}}/>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Autonomous AI Blast Radius SVG Overlay (Floor Level) */}
          <svg style={{position:'absolute', top:0, left:0, width:`${baseWidth}px`, height:'500px', transform:'translateZ(2px)', pointerEvents:'none'}}>
            {spatialNodes.filter((n:any) => n.status !== 'up').map((sourceNode:any) => {
              // Find affected nodes for this specific source node
              const affectedNodes = spatialNodes.filter((n:any) => n.id !== sourceNode.id && (n.coords.room === sourceNode.coords.room || n.hostname.includes('SW')));
              
              return affectedNodes.map((affected:any) => (
                <g key={`link-${sourceNode.id}-${affected.id}`}>
                  <line 
                    x1={sourceNode.coords.x} y1={sourceNode.coords.y} 
                    x2={affected.coords.x} y2={affected.coords.y}
                    stroke="var(--c-yellow)" strokeWidth="2" strokeDasharray="5,5" opacity="0.6"
                  />
                  {/* Animated laser pulse */}
                  <circle r="4" fill="var(--c-red)" opacity="0.8">
                    <animateMotion dur="1.5s" repeatCount="indefinite" path={`M ${sourceNode.coords.x},${sourceNode.coords.y} L ${affected.coords.x},${affected.coords.y}`} />
                  </circle>
                  <circle cx={affected.coords.x} cy={affected.coords.y} r="15" fill="none" stroke="var(--c-yellow)" strokeWidth="2">
                    <animate attributeName="r" values="15; 30" dur="1s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="1; 0" dur="1s" repeatCount="indefinite"/>
                  </circle>
                </g>
              ));
            })}
          </svg>

          {/* Plot Live Nodes */}
          {spatialNodes.map((node: any) => {
            const isSelected = liveSelectedNode?.id === node.id;
            
            // A node is in the blast radius if ANY downed/warning node affects it
            const anomalousNodes = spatialNodes.filter((n:any) => n.status !== 'up' && n.id !== node.id);
            const isAffected = anomalousNodes.some((source:any) => 
               node.coords.room === source.coords.room || node.hostname.includes('SW')
            );
            
            const nodeColor = isAffected ? '#d97706' : getNodeColor(node.status); // Turn affected nodes yellow
            const isFaded = selectedNode && !isSelected && !isAffected;

            return (
              <div 
                key={node.id} 
                style={{
                  position:'absolute', left:`${node.coords.x}px`, top:`${node.coords.y}px`,
                  transform:`translate(-50%, -50%) translateZ(${getZHeight(node.coords.room, node.coords.isExtra)}px)`,
                  transformStyle:'preserve-3d', zIndex: isSelected || isAffected ? 20 : 5,
                  opacity: isFaded ? 0.2 : 1, transition:'all 0.5s', cursor:'pointer'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!lastMouse.current.isDragMove) {
                    setSelectedNode(node);
                  }
                }}
              >
                {node.status === 'down' && (
                  <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%) translateZ(-1px)',width:'80px',height:'80px',borderRadius:'50%',background:`radial-gradient(circle, ${nodeColor} 0%, transparent 70%)`,opacity:0.6,animation:'pulseRed 2s infinite'}}/>
                )}
                {isAffected && (
                  <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%) translateZ(-1px)',width:'60px',height:'60px',borderRadius:'50%',background:`radial-gradient(circle, var(--c-yellow) 0%, transparent 70%)`,opacity:0.4,animation:'pulseYellow 1.5s infinite'}}/>
                )}
                {/* Device Icon */}
                <div style={{
                  transform: isSelected || isAffected ? `${calcCounterRotation(true)} scale(${isSelected ? 1.3 : 1.1})` : calcCounterRotation(false),
                  transition:'transform 1.5s cubic-bezier(0.25, 1, 0.5, 1)',
                  width:'36px',height:'36px',borderRadius:'8px',
                  background: `${nodeColor}22`,
                  border:`2px solid ${nodeColor}`,display:'flex',alignItems:'center',justifyContent:'center',
                  color: nodeColor, position:'relative',
                  boxShadow: `0 0 15px ${nodeColor}66, -5px 10px 15px rgba(0,0,0,0.5)`
                }}>
                  {node.hostname?.includes('SW') ? <Network size={18}/> : node.hostname?.includes('RTR') ? <Activity size={18}/> : <Server size={18}/>}
                </div>
                {/* Label */}
                <div style={{
                  position:'absolute',top:'20px',left:'30px',
                  transform: isSelected || isAffected ? `${calcCounterRotation(true)} scale(1.1)` : calcCounterRotation(false),
                  transition:'transform 1.5s cubic-bezier(0.25, 1, 0.5, 1)',
                  width:'140px',background:'rgba(15,23,42,0.85)',padding:'4px 8px',borderRadius:'4px',
                  border:`1px solid ${nodeColor}66`
                }}>
                  <div style={{fontSize:'11px',fontWeight:700,color:nodeColor}}>{node.hostname}</div>
                  {isSelected && <div style={{fontSize:'9px',color:'var(--c-text-dim)',marginTop:'2px'}}>{node.ip}</div>}
                  {isAffected && <div style={{fontSize:'9px',color:'var(--c-yellow)',marginTop:'2px'}}>AT RISK (Blast Radius)</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Selected Node Metrics Side-Panel */}
      {focusNode && (
        <div style={{
          position:'absolute', top:'16px', right:'24px', width:'340px', zIndex:100,
          background:'rgba(15,23,42,0.85)', backdropFilter:'blur(16px)', border:`1px solid ${getNodeColor(focusNode.status)}`,
          borderRadius:'12px', boxShadow:`0 24px 64px rgba(0,0,0,0.6), 0 0 20px ${getNodeColor(focusNode.status)}33`,
          animation:'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)', padding:'20px'
        }}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', borderBottom:'1px solid rgba(255,255,255,0.1)', paddingBottom:'12px', marginBottom:'16px'}}>
            <div>
              <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                <div style={{width:'10px', height:'10px', borderRadius:'50%', background:getNodeColor(focusNode.status), boxShadow:`0 0 10px ${getNodeColor(focusNode.status)}`}}/>
                <h3 style={{margin:0, fontSize:'16px', color:'var(--c-text-bright)'}}>{focusNode.hostname}</h3>
              </div>
              <div style={{fontSize:'12px', color:'var(--c-text-dim)', marginTop:'4px'}}>{focusNode.ip} • {(focusNode.model || 'DEVICE').toUpperCase()}</div>
            </div>
            <button onClick={() => setSelectedNode(null)} style={{background:'none', border:'none', color:'var(--c-text-dim)', cursor:'pointer'}}><X size={16}/></button>
          </div>

          <div className="grid grid-2" style={{gap:'12px', marginBottom:'16px'}}>
            <div style={{background:'rgba(255,255,255,0.05)', padding:'10px', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.05)'}}>
              <div style={{fontSize:'11px', color:'var(--c-text-dim)', display:'flex', alignItems:'center', gap:'6px'}}><Cpu size={12}/> CPU</div>
              <div style={{fontSize:'18px', fontWeight:600, color: focusNode.cpu > 80 ? 'var(--c-red)' : 'var(--c-text-bright)', marginTop:'4px'}}>{focusNode.cpu}%</div>
            </div>
            <div style={{background:'rgba(255,255,255,0.05)', padding:'10px', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.05)'}}>
              <div style={{fontSize:'11px', color:'var(--c-text-dim)', display:'flex', alignItems:'center', gap:'6px'}}><HardDrive size={12}/> RAM</div>
              <div style={{fontSize:'18px', fontWeight:600, color:'var(--c-text-bright)', marginTop:'4px'}}>{focusNode.mem || 0}%</div>
            </div>
          </div>

          <div style={{background:'rgba(255,255,255,0.05)', padding:'12px', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.05)', marginBottom: '16px'}}>
            <div style={{fontSize:'11px', color:'var(--c-text-dim)', marginBottom:'8px', fontWeight:600}}>SPATIAL LAYER</div>
            <div style={{fontSize:'13px', color:'var(--c-text)'}}>{focusNode.coords.room}</div>
            <div style={{fontSize:'11px', color:'var(--c-text-dim)', marginTop:'4px'}}>Grid: X:{focusNode.coords.x} Y:{focusNode.coords.y} Z:{getZHeight(focusNode.coords.room, focusNode.coords.isExtra)}</div>
          </div>

          {/* AI Insights Engine */}
          <div style={{background:'linear-gradient(145deg, rgba(124,58,237,0.1), rgba(79,70,229,0.05))', padding:'12px', borderRadius:'8px', border:'1px solid rgba(124,58,237,0.2)'}}>
            <div style={{fontSize:'11px', fontWeight:700, color:'var(--c-accent)', display:'flex', alignItems:'center', gap:'6px', marginBottom:'12px'}}>
              <Activity size={14} style={{animation:'pulseBlue 2s infinite'}}/> OMNI-AI DIAGNOSTICS
            </div>
            
            {focusNode.status === 'up' ? (
              <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                <div style={{fontSize:'12px', color:'var(--c-green)', display:'flex', gap:'6px', alignItems:'flex-start'}}>
                  <span style={{color:'var(--c-green)', marginTop:'2px'}}>✓</span> Baseline telemetry is nominal.
                </div>
                <div style={{fontSize:'12px', color:'var(--c-text-dim)', display:'flex', gap:'6px', alignItems:'flex-start'}}>

                  <span style={{color:'var(--c-accent)', marginTop:'2px'}}>✦</span> Predictive Analysis: 99.8% stability forecast for next 24h.
                </div>
              </div>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                <div style={{padding:'8px', background:'rgba(220,38,38,0.15)', borderLeft:'2px solid var(--c-red)', borderRadius:'4px'}}>
                  <div style={{fontSize:'12px', fontWeight:700, color:'var(--c-red)', display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px'}}>
                    <ShieldAlert size={12}/> CRITICAL ANOMALY
                  </div>
                  <div style={{fontSize:'12px', color:'var(--c-text-bright)'}}>
                    {alerts.find((a:any) => a.node === focusNode.hostname)?.msg || 'Device unresponsive. SNMP Timeout detected.'}
                  </div>
                </div>
                
                <div>
                  <div style={{fontSize:'11px', color:'var(--c-text-dim)', marginBottom:'4px'}}>AI BLAST RADIUS PREDICTION</div>
                  <div style={{fontSize:'12px', color:'var(--c-yellow)'}}>
                    Cascading failure risk to <strong>{focusNode.coords.room}</strong> edge switches.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
