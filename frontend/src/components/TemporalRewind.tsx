import React, { useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause, SkipBack, FastForward } from 'lucide-react';

export default function TemporalRewind({ onTimeChange }: { onTimeChange: (offsetMinutes: number) => void }) {
  const [offset, setOffset] = useState(0); // 0 is now, negative is past
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 5x, 10x
  
  const offsetRef = useRef(offset);
  useEffect(() => { offsetRef.current = offset; }, [offset]);

  useEffect(() => {
    if (!isPlaying) return;
    
    // Every 1 second, advance by playbackSpeed minutes
    const interval = setInterval(() => {
      if (offsetRef.current >= 0) {
        setIsPlaying(false);
        setOffset(0);
        onTimeChange(0);
      } else {
        const newOffset = Math.min(0, offsetRef.current + playbackSpeed);
        setOffset(newOffset);
        onTimeChange(newOffset);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, onTimeChange]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setOffset(val);
    onTimeChange(val);
  };

  const cycleSpeed = () => {
    if (playbackSpeed === 1) setPlaybackSpeed(5);
    else if (playbackSpeed === 5) setPlaybackSpeed(10);
    else setPlaybackSpeed(1);
  };

  const formatOffset = (mins: number) => {
    if (mins === 0) return 'Live Now';
    const absMins = Math.abs(mins);
    if (absMins < 60) return `-${absMins} mins`;
    const hrs = Math.floor(absMins / 60);
    const rem = absMins % 60;
    return `-${hrs}h ${rem}m`;
  };

  const getCurrentTimeStr = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + offset);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{
      position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
      width: '600px', background: 'var(--c-surface)', borderRadius: '30px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '1px solid var(--c-border)',
      display: 'flex', alignItems: 'center', padding: '12px 24px', gap: '20px', zIndex: 9000
    }}>
      {/* Controls */}
      <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--c-accent)'}}>
        <button className="header-btn" style={{padding: '6px', borderRadius: '50%'}} onClick={() => { setOffset(-120); onTimeChange(-120); }} title="Rewind 2 Hours">
          <SkipBack size={14}/>
        </button>
        <button className="header-btn primary" style={{padding: '8px', borderRadius: '50%'}} onClick={() => setIsPlaying(!isPlaying)} title={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <Pause size={16}/> : <Play size={16}/>}
        </button>
        <button className={`header-btn ${playbackSpeed > 1 ? 'active' : ''}`} style={{padding: '6px', borderRadius: '50%', position: 'relative'}} onClick={cycleSpeed} title="Fast Forward Speed">
          <FastForward size={14}/>
          {playbackSpeed > 1 && (
            <span style={{position:'absolute', top:'-4px', right:'-4px', background:'var(--c-accent)', color:'#fff', fontSize:'8px', fontWeight:700, padding:'1px 4px', borderRadius:'10px'}}>
              {playbackSpeed}x
            </span>
          )}
        </button>
      </div>

      {/* Slider */}
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '4px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--c-text-dim)', fontWeight: 600}}>
          <span>-2 Hours</span>
          <span style={{color: offset < 0 ? 'var(--c-yellow)' : 'var(--c-green)'}}>
            <Clock size={12} style={{display:'inline', verticalAlign:'middle', marginRight:'4px'}}/>
            {formatOffset(offset)} ({getCurrentTimeStr()})
          </span>
          <span>Live</span>
        </div>
        <input 
          type="range" min="-120" max="0" value={offset} onChange={handleSliderChange}
          style={{
            width: '100%', cursor: 'pointer', appearance: 'none', height: '4px', background: 'var(--c-border)', borderRadius: '2px', outline: 'none'
          }}
        />
      </div>

      <div style={{fontSize: '11px', fontWeight: 600, color: 'var(--c-text-dim)', borderLeft: '1px solid var(--c-border)', paddingLeft: '16px'}}>
        TEMPORAL DVR
      </div>
    </div>
  );
}
