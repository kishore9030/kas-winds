// Sample data templates for ELM Winds
export const sampleNodes = [
  { id: 1, hostname: 'CORE-RTR-01', ip: '10.10.0.1', vendor: 'Cisco', model: 'ISR4451', status: 'up', cpu: 42, mem: 68, uptime: '142d 8h', snmpVer: 'v3', location: 'DC-1 Rack A3' },
  { id: 2, hostname: 'CORE-RTR-02', ip: '10.10.0.2', vendor: 'Cisco', model: 'ISR4451', status: 'up', cpu: 38, mem: 55, uptime: '142d 8h', snmpVer: 'v3', location: 'DC-1 Rack A4' },
  { id: 3, hostname: 'FW-EDGE-01', ip: '10.10.0.10', vendor: 'Palo Alto', model: 'PA-5260', status: 'up', cpu: 72, mem: 81, uptime: '89d 3h', snmpVer: 'v2c', location: 'DC-1 Rack B1' },
  { id: 4, hostname: 'DIST-SW-01', ip: '10.10.1.1', vendor: 'Cisco', model: 'C9300-48P', status: 'up', cpu: 25, mem: 44, uptime: '201d 14h', snmpVer: 'v2c', location: 'Floor-2' },
  { id: 5, hostname: 'DIST-SW-02', ip: '10.10.1.2', vendor: 'Cisco', model: 'C9300-48P', status: 'down', cpu: 0, mem: 0, uptime: '0d 0h', snmpVer: 'v2c', location: 'Floor-3' },
  { id: 6, hostname: 'ACC-SW-F1-01', ip: '10.10.2.1', vendor: 'Aruba', model: 'CX6300', status: 'up', cpu: 18, mem: 32, uptime: '310d 2h', snmpVer: 'v2c', location: 'Floor-1' },
  { id: 7, hostname: 'WLC-01', ip: '10.10.5.1', vendor: 'Cisco', model: 'C9800-40', status: 'up', cpu: 55, mem: 63, uptime: '67d 19h', snmpVer: 'v3', location: 'DC-1 Rack C2' },
  { id: 8, hostname: 'LB-PROD-01', ip: '10.10.8.1', vendor: 'F5', model: 'BIG-IP i5800', status: 'warning', cpu: 88, mem: 91, uptime: '45d 6h', snmpVer: 'v2c', location: 'DC-1 Rack D1' },
  { id: 9, hostname: 'ACC-SW-F4-01', ip: '10.10.4.1', vendor: 'Aruba', model: 'CX6300', status: 'up', cpu: 15, mem: 28, uptime: '110d 2h', snmpVer: 'v2c', location: 'Floor-4' },
  { id: 10, hostname: 'ACC-SW-F5-01', ip: '10.10.5.2', vendor: 'Aruba', model: 'CX6300', status: 'up', cpu: 12, mem: 25, uptime: '110d 2h', snmpVer: 'v2c', location: 'Floor-5' },
  { id: 11, hostname: 'ACC-SW-F6-01', ip: '10.10.6.1', vendor: 'Aruba', model: 'CX6300', status: 'up', cpu: 19, mem: 33, uptime: '110d 2h', snmpVer: 'v2c', location: 'Floor-6' },
  { id: 12, hostname: 'ACC-SW-F7-01', ip: '10.10.7.1', vendor: 'Aruba', model: 'CX6300', status: 'up', cpu: 11, mem: 21, uptime: '110d 2h', snmpVer: 'v2c', location: 'Floor-7' },
  { id: 13, hostname: 'ACC-SW-F8-01', ip: '10.10.8.2', vendor: 'Aruba', model: 'CX6300', status: 'up', cpu: 16, mem: 30, uptime: '110d 2h', snmpVer: 'v2c', location: 'Floor-8' },
  { id: 14, hostname: 'ACC-SW-F9-01', ip: '10.10.9.1', vendor: 'Aruba', model: 'CX6300', status: 'up', cpu: 14, mem: 26, uptime: '110d 2h', snmpVer: 'v2c', location: 'Floor-9' },
  { id: 15, hostname: 'ACC-SW-F10-01', ip: '10.10.10.1', vendor: 'Aruba', model: 'CX6300', status: 'up', cpu: 22, mem: 38, uptime: '110d 2h', snmpVer: 'v2c', location: 'Floor-10' },
];

export const sampleLogs = [
  { ts: '2026-06-26 23:42:18', severity: 'critical', source: 'DIST-SW-02', facility: 'SYS', msg: 'Interface GigabitEthernet1/0/1 changed state to down', enriched_data: { tags: ["network", "interface"], status: "unreviewed" } },
  { ts: '2026-06-26 23:42:15', severity: 'critical', source: 'DIST-SW-02', facility: 'LINK', msg: 'UPLINK_FAILURE: All uplinks to CORE-RTR-01 are down', enriched_data: { tags: ["network", "uplink", "critical"], status: "unreviewed" } },
  { ts: '2026-06-26 23:41:50', severity: 'warning', source: 'LB-PROD-01', facility: 'LTM', msg: 'Pool member 10.10.20.5:443 monitor status down', enriched_data: { tags: ["loadbalancer", "health_check"], status: "unreviewed" } },
  { ts: '2026-06-26 23:40:22', severity: 'warning', source: 'FW-EDGE-01', facility: 'THREAT', msg: 'Spyware detected from 192.168.1.105 to 203.0.113.45', enriched_data: { tags: ["security", "spyware"], status: "unreviewed" } },
  { ts: '2026-06-26 23:39:10', severity: 'info', source: 'WLC-01', facility: 'DOT11', msg: 'AP AP-F3-WEST associated with controller, slot 0', enriched_data: { tags: ["wireless"], status: "unreviewed" } },
  { ts: '2026-06-26 23:38:45', severity: 'info', source: 'CORE-RTR-01', facility: 'OSPF', msg: 'OSPF-5-ADJCHG: Neighbor 10.10.0.2 changed to FULL state', enriched_data: { tags: ["routing", "ospf"], status: "unreviewed" } },
  { ts: '2026-06-26 23:37:33', severity: 'warning', source: 'FW-EDGE-01', facility: 'SYSTEM', msg: 'CPU utilization exceeded 70% threshold (current: 72%)', enriched_data: { tags: ["performance", "cpu"], status: "unreviewed" } },
  { ts: '2026-06-26 23:36:01', severity: 'info', source: 'ACC-SW-F1-01', facility: 'AUTH', msg: 'User admin logged in via SSH from 10.10.100.5', enriched_data: { tags: ["security", "auth"], status: "unreviewed" } },
  { ts: '2026-06-26 23:34:55', severity: 'info', source: 'CORE-RTR-02', facility: 'BGP', msg: 'BGP-5-ADJCHANGE: neighbor 172.16.0.1 Up', enriched_data: { tags: ["routing", "bgp"], status: "unreviewed" } },
  { ts: '2026-06-26 23:33:20', severity: 'critical', source: 'LB-PROD-01', facility: 'LTM', msg: 'Virtual server /Common/app_https has no available pool members', enriched_data: { tags: ["loadbalancer", "outage"], status: "unreviewed" } },
];

export const sampleAlerts = [
  { id: 1, node: 'DIST-SW-02', message: 'Node unreachable — all ICMP probes failed', severity: 'critical', time: '2 mins ago', ack: false },
  { id: 2, node: 'LB-PROD-01', message: 'CPU utilization at 88% (threshold: 80%)', severity: 'warning', time: '5 mins ago', ack: false },
  { id: 3, node: 'FW-EDGE-01', message: 'Threat log: spyware callback detected', severity: 'warning', time: '8 mins ago', ack: true },
  { id: 4, node: 'LB-PROD-01', message: 'Pool /Common/app_https — 0 active members', severity: 'critical', time: '12 mins ago', ack: false },
];

export const sampleWifiAPs = [
  { name: 'AP-F1-EAST', ip: '10.10.6.11', clients: 32, channel: '36/149', signal: -45, status: 'up', band: '5GHz', ssid: 'CORP-SECURE' },
  { name: 'AP-F1-WEST', ip: '10.10.6.12', clients: 28, channel: '1/44', signal: -52, status: 'up', band: 'Dual', ssid: 'CORP-SECURE' },
  { name: 'AP-F2-EAST', ip: '10.10.6.21', clients: 41, channel: '6/149', signal: -48, status: 'up', band: 'Dual', ssid: 'CORP-SECURE' },
  { name: 'AP-F2-WEST', ip: '10.10.6.22', clients: 15, channel: '11/153', signal: -60, status: 'up', band: '2.4GHz', ssid: 'GUEST' },
  { name: 'AP-F3-EAST', ip: '10.10.6.31', clients: 22, channel: '36/157', signal: -55, status: 'up', band: '5GHz', ssid: 'CORP-SECURE' },
  { name: 'AP-F3-WEST', ip: '10.10.6.32', clients: 0, channel: '-', signal: 0, status: 'down', band: '-', ssid: '-' },
];

export const sampleTraffic = [
  { time: '23:00', inbound: 1200, outbound: 890 }, { time: '23:05', inbound: 1350, outbound: 920 },
  { time: '23:10', inbound: 1100, outbound: 850 }, { time: '23:15', inbound: 1500, outbound: 1100 },
  { time: '23:20', inbound: 1800, outbound: 1300 }, { time: '23:25', inbound: 2100, outbound: 1500 },
  { time: '23:30', inbound: 1900, outbound: 1400 }, { time: '23:35', inbound: 1700, outbound: 1250 },
  { time: '23:40', inbound: 2200, outbound: 1600 }, { time: '23:45', inbound: 2400, outbound: 1800 },
];

export const sampleTopTalkers = [
  { ip: '10.10.20.5', hostname: 'APP-SRV-01', bytes: 4200000000, pct: 28 },
  { ip: '10.10.20.8', hostname: 'DB-PROD-01', bytes: 2800000000, pct: 19 },
  { ip: '10.10.20.12', hostname: 'FILE-SRV-01', bytes: 1900000000, pct: 13 },
  { ip: '10.10.100.5', hostname: 'ADMIN-WS', bytes: 850000000, pct: 6 },
  { ip: '10.10.1.1', hostname: 'DIST-SW-01', bytes: 750000000, pct: 5 },
];

// === Incident Autopsy: Cascading Failure Forensics Data ===

export interface AutopsyEvent {
  time: number;          // seconds from root cause
  nodeId: string;        // which node is affected
  event: string;         // event code
  severity: 'critical' | 'warning' | 'info' | 'impact';
  narration: string;     // AI forensic narration text
  metrics?: { cpu?: number; mem?: number };
  businessImpact?: string | null;
}

export interface BlameChainNode {
  id: string;
  label: string;
  node: string;
  confidence: number;
  parentId: string | null;
  severity: 'critical' | 'warning' | 'info' | 'impact';
}

// Topology positions for the autopsy SVG canvas
export const autopsyTopology = [
  { id: 'CORE-RTR-01', x: 400, y: 80, type: 'router' },
  { id: 'CORE-RTR-02', x: 600, y: 80, type: 'router' },
  { id: 'FW-EDGE-01', x: 500, y: 30, type: 'firewall' },
  { id: 'DIST-SW-01', x: 300, y: 200, type: 'switch' },
  { id: 'DIST-SW-02', x: 500, y: 200, type: 'switch' },
  { id: 'ACC-SW-F1-01', x: 700, y: 200, type: 'switch' },
  { id: 'WLC-01', x: 300, y: 320, type: 'wireless' },
  { id: 'LB-PROD-01', x: 500, y: 320, type: 'loadbalancer' },
];

export const autopsyEdges = [
  { from: 'FW-EDGE-01', to: 'CORE-RTR-01' },
  { from: 'FW-EDGE-01', to: 'CORE-RTR-02' },
  { from: 'CORE-RTR-01', to: 'DIST-SW-01' },
  { from: 'CORE-RTR-01', to: 'DIST-SW-02' },
  { from: 'CORE-RTR-02', to: 'ACC-SW-F1-01' },
  { from: 'CORE-RTR-02', to: 'DIST-SW-02' },
  { from: 'DIST-SW-01', to: 'WLC-01' },
  { from: 'DIST-SW-02', to: 'LB-PROD-01' },
];

export const sampleAutopsyTimeline: AutopsyEvent[] = [
  {
    time: 0,
    nodeId: 'DIST-SW-02',
    event: 'SFP_DEGRADATION',
    severity: 'warning',
    narration: 'PRECURSOR DETECTED: SFP transceiver Tx bias current on Gi1/0/1 increased 14% over 72 hours. Laser diode degradation pattern matches vendor failure profile PA-2847.',
    metrics: { cpu: 25, mem: 44 },
    businessImpact: null
  },
  {
    time: 1.2,
    nodeId: 'DIST-SW-02',
    event: 'LINK_FAILURE',
    severity: 'critical',
    narration: 'PHYSICAL FAILURE: Interface GigabitEthernet1/0/1 transitioned to down state. Optical signal loss confirmed — SFP module has completely failed. Both uplinks to CORE-RTR-01 are severed.',
    metrics: { cpu: 0, mem: 0 },
    businessImpact: null
  },
  {
    time: 2.0,
    nodeId: 'CORE-RTR-01',
    event: 'NEIGHBOR_LOSS',
    severity: 'warning',
    narration: 'PROPAGATION: CORE-RTR-01 detected OSPF neighbor 10.10.1.2 (DIST-SW-02) has gone dead. Adjacency removed from LSDB. Redistributing topology change via LSA Type-1 flood.',
    metrics: { cpu: 58, mem: 68 },
    businessImpact: null
  },
  {
    time: 3.5,
    nodeId: 'DIST-SW-02',
    event: 'NODE_ISOLATED',
    severity: 'critical',
    narration: 'ISOLATION COMPLETE: DIST-SW-02 is now fully unreachable. All ICMP probes have failed. 47 downstream devices on Floor-3 have lost connectivity. SNMP polling returns timeout.',
    metrics: { cpu: 0, mem: 0 },
    businessImpact: 'Floor-3 network segment offline — 47 endpoints affected'
  },
  {
    time: 5.0,
    nodeId: 'LB-PROD-01',
    event: 'HEALTH_CHECK_FAIL',
    severity: 'warning',
    narration: 'CASCADING EFFECT: LB-PROD-01 health monitor for pool member 10.10.20.5:443 (routed via DIST-SW-02) has failed 3 consecutive checks. Pool member marked DOWN.',
    metrics: { cpu: 65, mem: 85 },
    businessImpact: null
  },
  {
    time: 6.8,
    nodeId: 'LB-PROD-01',
    event: 'POOL_EXHAUSTED',
    severity: 'critical',
    narration: 'SERVICE FAILURE: Virtual server /Common/app_https has ZERO active pool members. All incoming HTTPS connections are being queued. TCP SYN backlog growing exponentially.',
    metrics: { cpu: 78, mem: 89 },
    businessImpact: null
  },
  {
    time: 8.2,
    nodeId: 'LB-PROD-01',
    event: 'CPU_SPIKE',
    severity: 'critical',
    narration: 'RESOURCE EXHAUSTION: CPU utilization spiked from 42% to 88% in 2.4 seconds. Root cause: aggressive health check retries (every 250ms) combined with TCP connection queuing. Connection table at 94% capacity.',
    metrics: { cpu: 88, mem: 91 },
    businessImpact: null
  },
  {
    time: 10.0,
    nodeId: 'LB-PROD-01',
    event: 'BUSINESS_IMPACT',
    severity: 'impact',
    narration: 'BUSINESS IMPACT: E-Commerce portal is completely unreachable. Customer-facing HTTP 503 errors confirmed. Estimated revenue loss: $12,400/hour. Customer support ticket volume increased 340%.',
    metrics: { cpu: 88, mem: 91 },
    businessImpact: 'E-Commerce portal DOWN — $12,400/hr revenue loss'
  },
];

export const sampleBlameChain: BlameChainNode[] = [
  { id: 'sfp', label: 'SFP Transceiver Failure', node: 'DIST-SW-02', confidence: 99, parentId: null, severity: 'critical' },
  { id: 'link', label: 'Uplink Gi1/0/1 Down', node: 'DIST-SW-02', confidence: 99, parentId: 'sfp', severity: 'critical' },
  { id: 'ospf', label: 'OSPF Neighbor Loss', node: 'CORE-RTR-01', confidence: 96, parentId: 'link', severity: 'warning' },
  { id: 'isolation', label: 'Node Fully Isolated', node: 'DIST-SW-02', confidence: 98, parentId: 'link', severity: 'critical' },
  { id: 'health', label: 'LB Health Check Timeout', node: 'LB-PROD-01', confidence: 91, parentId: 'isolation', severity: 'warning' },
  { id: 'pool', label: 'Pool Members Exhausted', node: 'LB-PROD-01', confidence: 94, parentId: 'health', severity: 'critical' },
  { id: 'cpu', label: 'CPU Spike (Connection Queue)', node: 'LB-PROD-01', confidence: 87, parentId: 'pool', severity: 'critical' },
  { id: 'biz', label: 'E-Commerce Portal Down', node: 'LB-PROD-01', confidence: 99, parentId: 'pool', severity: 'impact' },
];
