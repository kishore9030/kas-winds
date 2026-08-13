import React, { useState, useRef } from 'react';
import { UploadCloud, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export default function CSVUploaderModal({ onClose, onUpload }: { onClose: () => void, onUpload: (mappings: any[]) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const parseFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Invalid file type. Please upload a .csv file.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      processCSV(text);
    };
    reader.onerror = () => setError('Error reading the file.');
    reader.readAsText(file);
  };

  const processCSV = (csvText: string) => {
    try {
      const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length < 2) throw new Error('CSV is empty or missing headers.');

      // Normalize headers to lowercase and remove spaces
      const rawHeaders = lines[0].split(',').map(h => h.toLowerCase().trim().replace(/['"]/g, ''));
      
      const getIndex = (aliases: string[]) => {
        return rawHeaders.findIndex(h => aliases.some(a => h.includes(a)));
      };

      // Robust header mapping using aliases
      const idxHost = getIndex(['host', 'device', 'name', 'node']);
      const idxIp = getIndex(['ip', 'address']);
      const idxLoc = getIndex(['loc', 'floor', 'room', 'building']);

      if (idxHost === -1 || idxLoc === -1) {
        throw new Error('CSV must contain at least a Hostname and Location column.');
      }

      const parsedMappings = [];
      for (let i = 1; i < lines.length; i++) {
        // Handle basic quoted CSV fields splitting
        const cols = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(c => c.replace(/(^"|"$)/g, '').trim()) || lines[i].split(',').map(c => c.trim());
        
        if (cols.length < 2) continue;

        parsedMappings.push({
          hostname: cols[idxHost],
          ip: idxIp !== -1 ? cols[idxIp] : null,
          location: cols[idxLoc]
        });
      }

      if (parsedMappings.length === 0) throw new Error('No valid location mappings found.');
      
      // Success! Pass to parent
      onUpload(parsedMappings);

    } catch (err: any) {
      setError(err.message || 'Failed to parse CSV file.');
    }
  };

  return (
    <div style={{
      position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', 
      backdropFilter:'blur(4px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center'
    }}>
      <div style={{
        background:'var(--c-surface)', width:'500px', borderRadius:'12px', border:'1px solid var(--c-border)',
        boxShadow:'0 20px 60px rgba(0,0,0,0.5)', overflow:'hidden'
      }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', borderBottom:'1px solid var(--c-border)'}}>
          <div style={{fontWeight:600, fontSize:'16px', display:'flex', alignItems:'center', gap:'8px'}}>
            <FileText size={18} color="var(--c-blue)"/> Upload Device Topology (CSV)
          </div>
          <button onClick={onClose} style={{background:'none', border:'none', color:'var(--c-text-dim)', cursor:'pointer'}}><X size={20}/></button>
        </div>

        <div style={{padding:'24px'}}>
          <p style={{fontSize:'13px', color:'var(--c-text-dim)', marginBottom:'20px'}}>
            Upload a CSV file containing your network devices. The parser will automatically search for column headers like <b>Hostname</b>, <b>IP</b>, and <b>Location</b> regardless of case formatting.
          </p>

          {error && (
            <div style={{background:'rgba(220,38,38,0.1)', border:'1px solid var(--c-red)', color:'var(--c-red)', padding:'12px', borderRadius:'8px', fontSize:'13px', display:'flex', alignItems:'center', gap:'8px', marginBottom:'20px'}}>
              <AlertCircle size={16}/> {error}
            </div>
          )}

          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? 'var(--c-blue)' : 'var(--c-border)'}`,
              borderRadius:'12px', padding:'40px', textAlign:'center', cursor:'pointer',
              background: isDragging ? 'rgba(59,130,246,0.05)' : 'rgba(255,255,255,0.02)',
              transition:'all 0.2s'
            }}
          >
            <UploadCloud size={48} color={isDragging ? 'var(--c-blue)' : 'var(--c-text-dim)'} style={{margin:'0 auto 16px', opacity: isDragging ? 1 : 0.5}}/>
            <div style={{fontSize:'16px', fontWeight:600, color: isDragging ? 'var(--c-blue)' : 'var(--c-text-bright)'}}>
              {isDragging ? 'Drop CSV here' : 'Click or drag CSV file to upload'}
            </div>
            <div style={{fontSize:'12px', color:'var(--c-text-dim)', marginTop:'8px'}}>Supports .csv files only</div>
          </div>
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} style={{display:'none'}}/>
          
          <div style={{marginTop:'24px', padding:'16px', background:'rgba(255,255,255,0.02)', borderRadius:'8px', fontSize:'12px', color:'var(--c-text-dim)'}}>
            <div style={{fontWeight:600, marginBottom:'8px'}}>Example CSV Format:</div>
            <code style={{display:'block', background:'#000', padding:'8px', borderRadius:'4px', color:'#a5b4fc'}}>
              Hostname, IP Address, Location<br/>
              FW-EDGE-01, 10.0.0.1, DC-1 Rack B<br/>
              DIST-SW-01, 10.0.1.1, Floor-2
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
