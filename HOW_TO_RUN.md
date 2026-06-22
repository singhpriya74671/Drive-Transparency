# DriveTransparency — How to Run

## Project Structure

```
AI-Powered Vehicle Service Transparency/
├── backend/          ← FastAPI + ML (Python)
├── frontend-web/     ← React Web App (Desktop + Car Display)
└── mobile/           ← React Native (iOS + Android)
```

---

## 1. Backend Setup

```bash
cd backend

# Virtual environment banao
python -m venv venv
venv\Scripts\activate     # Windows
# source venv/bin/activate  # Mac/Linux

# Dependencies install
pip install -r requirements.txt

# .env file banao
copy .env.example .env
# .env mein database URL set karo

# Server start karo
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

---

## 2. Web Frontend Setup

```bash
cd frontend-web

npm install
npm start
```

Web App: http://localhost:3000

### Pages:
- `/`           → Home page
- `/input`      → Vehicle details form
- `/dashboard`  → Full health report
- `/car-mode`   → **CAR INFOTAINMENT DISPLAY MODE**

---

## 3. Mobile App Setup

```bash
cd mobile

npm install

# Install Expo CLI if not already installed
npm install -g expo-cli

# Start karo
npx expo start
```

- **Android Emulator** mein chalane ke liye: `a` press karo
- **iOS Simulator** mein chalane ke liye: `i` press karo
- **Physical Phone** pe: Expo Go app download karo aur QR scan karo

### Android Emulator Note:
`mobile/src/services/api.js` mein BASE_URL:
- Android Emulator: `http://10.0.2.2:8000`
- Physical Device: `http://<your-PC-IP>:8000`
- iOS Simulator: `http://localhost:8000`

---

## Car Display Mode

`/car-mode` route par navigate karo ya "🚘 Car Mode" button tap karo.

Features:
- Full-screen dark display (car infotainment ke liye)
- Large text, high contrast
- Overall health score (ring gauge)
- Component status at a glance
- Critical/warning alerts highlighted
- Exit button always visible

---

## Database (PostgreSQL)

```sql
CREATE DATABASE vehicle_service_db;
```

Tables auto-create hoti hain jab backend start hota hai.

---

## Tech Stack

| Layer       | Technology                            |
|-------------|---------------------------------------|
| Backend     | FastAPI, Python, SQLAlchemy           |
| ML          | Scikit-learn, XGBoost, SHAP           |
| Database    | PostgreSQL                            |
| Web         | React 18, Tailwind CSS, Framer Motion |
| Mobile      | React Native, Expo                    |
| Car Display | React Web (special Car Mode view)     |
