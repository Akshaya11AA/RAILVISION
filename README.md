# RailGuard AI — 3 Portal Railway Operations Platform

Professional Vite + React + TypeScript frontend with an Express backend, JWT role access, REST APIs, Socket.IO live updates, image upload, issue workflow and a simulated robot telemetry layer.

## Portals
- **Admin Portal:** live robot status, camera-feed placeholder, telemetry, Auto/Manual control, Start/Stop/Return to Dock, active incidents, images, GPS location, priority and status.
- **Worker Portal:** prioritized field queue, incident evidence and location, Accept/In Progress, Mark Completed. Completion immediately updates the admin view.
- **Public Portal:** citizens can upload a track-issue photo, description and location. Browser GPS can be captured; landmark text can also be supplied.

## Demo accounts
- Admin: `admin@railguard.local` / `admin123`
- Worker: `worker@railguard.local` / `worker123`
- Public: choose Public on login or open `/#public`

## Run in VS Code
1. Extract the ZIP.
2. Open the extracted folder in VS Code.
3. Open Terminal and run `npm install`.
4. Run `npm run dev`.
5. Open the Vite URL shown in the terminal (normally `http://localhost:5173`).

**Do not use Live Server.** This project needs both the Vite client and Express backend, and `npm run dev` starts both.

## Hardware intentionally left as the integration point
The ESP32/ESP32-CAM, sensors, motor driver, GPS and docking electronics are **not required to run this demo**. The backend already exposes the control and telemetry boundary:
- `GET /api/robot/status`
- `POST /api/robot/command`
- Socket.IO events: `telemetry:update`, `robot:command`

Later, connect the physical robot through MQTT/serial/Wi-Fi to these backend services. The UI does not need to be redesigned.

## Backend notes
Data is persisted in `server/data/db.json` for easy demonstration. Uploaded evidence is stored in `server/uploads/`. For deployment, replace the JSON store with PostgreSQL/MySQL and add proper password hashing, HTTPS, role policies and object storage.

## Suggested next hardware bridge
ESP32/ESP32-CAM → MQTT → backend gateway → Spark/Scala analytics → database/API → these portals.
