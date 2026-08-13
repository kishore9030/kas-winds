const lines = [
  'Hostname, IP Address, Location, Status, CPU, Ram',
  'DIST-SW-01, 10.10.1.1, floor-2, Up, 45, 60',
  'CORE-RTR-01, 10.10.0.1, BASEMENT, Down, 0, 0'
];
const rawHeaders = lines[0].split(',').map(h => h.toLowerCase().trim().replace(/['"]/g, ''));
const getIndex = (aliases) => rawHeaders.findIndex(h => aliases.some(a => h.includes(a)));
const idxHost = getIndex(['host', 'device', 'name', 'node']);
const idxIp = getIndex(['ip', 'address']);
const idxLoc = getIndex(['loc', 'floor', 'room', 'building']);
console.log('Headers mapping:', {idxHost, idxIp, idxLoc});

const parsedMappings = [];
for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(c => c.replace(/(^"|"$)/g, '').trim()) || lines[i].split(',').map(c => c.trim());
  parsedMappings.push({
    hostname: cols[idxHost],
    ip: idxIp !== -1 ? cols[idxIp] : null,
    location: cols[idxLoc]
  });
}
console.log('Parsed Mappings:', parsedMappings);
