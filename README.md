# KAS WINDS

**KAS WINDS** is an advanced, enterprise-grade **Network and Security Monitoring Platform** powered by AI. It is designed to provide complete observability, automated root cause analysis, and predictive network modeling.

## Core Features

### 1. Omni-AI Analyst
A global, context-aware AI chatbot built into the platform. Depending on the page you are viewing (Logs, Traffic, Inventory), Omni-AI understands your context. You can ask it to analyze bandwidth hogs, generate custom charts (like Top Talker bandwidth isolation), or even generate Ansible playbooks to isolate rogue devices on the spot.

### 2. Zero-Touch Intent Palette (⌘K)
A hidden command bar that allows for predictive network modeling. You can type natural language commands like *"Simulate Frankfurt link failure"*. The AI will analyze current BGP tables and live traffic loads, then output a predictive blast radius detailing what will fail and how much revenue could be lost before you actually touch the physical network.

### 3. Temporal Rewind (Network DVR)
A time-machine slider for your entire network dashboard. If an outage happens at 2:00 PM, you can scrub the timeline back to 1:30 PM. The entire UI (Node Status, CPU usage, Alerts) will physically revert to show you exactly what the state of the network was leading up to the crash.

### 4. 3D Spatial Live View & Digital Twin
Advanced physical mapping and simulation. Instead of standard flat lists, the 3D map visually plots routers and switches into their physical locations (e.g., "DC-1 Rack A3"). The Digital Twin component allows you to safely observe simulated network behaviors without affecting production.

### 5. AI Root Cause Analysis (RCA) & Incident Autopsy
Automated incident resolution. When a massive flood of red alerts hits the system, the RCA engine automatically correlates the logs to pinpoint the exact single root cause (ignoring the noise). The Incident Autopsy tool then generates a clean post-mortem report of what happened.

### 6. Core Infrastructure Modules
* **NTA (Network Traffic Analysis):** Deep packet inspection metrics showing Top Talkers and bandwidth saturation.
* **Wireless & Inventory:** Live tracking of Access Points, connected clients, and all hardware nodes.
* **Connectors:** A built-in configuration UI to directly ingest data from Elasticsearch, Kafka, Splunk, Filebeat, and SNMP.

## How to Start

### Prerequisites
* **Node.js** (for the frontend)
* **Python 3.8+** (for the backend)

### Backend Setup
1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   venv\Scripts\activate  # On Windows
   # source venv/bin/activate  # On Mac/Linux
   ```
3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI backend server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup
1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the required Node packages:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## How to Use

### Frontend Dashboard
1. Open your browser and navigate to the local URL provided by the Vite server (typically `http://localhost:5173`).
2. Explore the main dashboard to view the physical network state, live alerts, and topological maps.
3. Chat with the **Omni-AI Analyst** on different pages for contextual insights, log analysis, or custom chart generation.
4. Press `Cmd+K` (or `Ctrl+K` on Windows) to open the **Zero-Touch Intent Palette** and simulate network changes or failures without affecting production.
5. Use the **Temporal Rewind** slider to scrub backward in time and view historical network states to perform root cause analysis on past outages.

### Backend API & Polling
1. **Interactive API Docs:** With the FastAPI server running, open your browser to `http://localhost:8000/docs` to access the interactive Swagger UI. Here you can explore and test API endpoints for intents, node telemetry, and log retrieval.
2. **Network Poller:** The backend includes an active network polling script (`poller.py`) using ICMP and SNMP. To manually trigger a device polling cycle and update database statuses, run:
   ```bash
   cd backend
   python -m poller
   ```
