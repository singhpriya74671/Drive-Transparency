# AI-Powered Vehicle Service Transparency

AI-Powered Vehicle Service Transparency is a full-stack vehicle health and service transparency platform. It helps users enter vehicle details, view health analysis, track service history, and understand possible maintenance risks through an AI/ML-backed API.

The project is divided into three clear parts:

- `backend/` - FastAPI backend, database models, authentication, and ML-based maintenance APIs.
- `frontend-web/` - React web app for dashboard, vehicle input, service history, and car display mode.
- `mobile/` - React Native Expo mobile app for phone-based access.

## Main Features

- User login and authentication
- Vehicle details management
- AI-based quick vehicle health analysis
- Component-wise maintenance risk report
- Service history tracking
- Web dashboard with charts and health indicators
- Car Mode interface for infotainment-style display
- Mobile app using React Native and Expo
- Backend deployed on Render

## Tech Stack

| Layer | Technology |
| --- | --- |
| Backend | Python, FastAPI, Uvicorn |
| Database | SQLAlchemy, SQLite for local development, PostgreSQL-ready setup |
| Authentication | JWT, python-jose, passlib, bcrypt |
| Machine Learning | Scikit-learn, XGBoost, SHAP, Pandas, NumPy |
| Web Frontend | React 18, React Router, Axios |
| Web UI | Tailwind CSS, Framer Motion, Recharts |
| Mobile | React Native, Expo, React Navigation |
| Deployment | Render for backend API |

## Project URLs

Backend API:

```text
https://drive-transparency.onrender.com
```

API documentation:

```text
https://drive-transparency.onrender.com/docs
```

Local web app:

```text
http://127.0.0.1:3000
```

## Quick Start

Start the backend locally:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Start the web frontend:

```bash
cd frontend-web
npm install
npm.cmd start
```

Start the mobile app:

```bash
cd mobile
npm install
npx expo start
```

## Important Files

- `backend/app/main.py` - FastAPI application entry point.
- `backend/app/routes/` - API routes for auth, vehicles, and maintenance.
- `backend/app/models/` - Database models.
- `backend/app/schemas/` - Request and response validation schemas.
- `backend/app/ml/predictor.py` - ML prediction and health analysis logic.
- `frontend-web/src/App.jsx` - Main React routing file.
- `frontend-web/src/pages/` - Main web pages.
- `frontend-web/src/components/` - Reusable UI components.
- `frontend-web/src/services/api.js` - Frontend API connection.
- `mobile/App.js` - Mobile app entry point.
- `mobile/src/` - Mobile screens, navigation, context, and API service.

For a detailed folder explanation, see `PROJECT_STRUCTURE.md`.
