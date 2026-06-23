# How To Run

This guide explains how to run the backend, web frontend, and mobile app.

## 1. Backend Setup

Open a terminal in the project root and run:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

Backend API:

```text
http://localhost:8000
```

API documentation:

```text
http://localhost:8000/docs
```

Deployed backend:

```text
https://drive-transparency.onrender.com
```

Deployed API documentation:

```text
https://drive-transparency.onrender.com/docs
```

## 2. Web Frontend Setup

Open another terminal and run:

```bash
cd frontend-web
npm install
copy .env.example .env
npm.cmd start
```

Web app:

```text
http://127.0.0.1:3000
```

Use `npm.cmd start` on Windows if PowerShell blocks `npm start`.

Main routes:

- `/` - Home page
- `/login` - Login page
- `/input` - Vehicle details form
- `/dashboard` - Vehicle health dashboard
- `/history` - Service history
- `/car-mode` - Car infotainment display mode

## 3. Mobile App Setup

Open another terminal and run:

```bash
cd mobile
npm install
npx expo start
```

Then choose one option:

- Press `a` for Android emulator.
- Press `i` for iOS simulator.
- Scan the QR code using Expo Go on a physical phone.

Mobile API URL is set in:

```text
mobile/src/services/api.js
```

Common API URLs:

- Android emulator: `http://10.0.2.2:8000`
- iOS simulator: `http://localhost:8000`
- Physical device: `http://YOUR_PC_IP:8000`
- Deployed backend: `https://drive-transparency.onrender.com`

## 4. Database

Local development uses SQLite by default:

```text
sqlite:///./drivetransparency.db
```

The database URL can be changed in `backend/.env`.

Example:

```text
DATABASE_URL=sqlite:///./drivetransparency.db
```

The backend creates tables automatically when it starts.

## 5. Recommended Opening Order

1. Start backend first.
2. Start web frontend.
3. Open `http://127.0.0.1:3000`.
4. Open `http://localhost:8000/docs` to test API endpoints.
