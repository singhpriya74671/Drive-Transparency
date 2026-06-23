# Project Structure

This file explains the project folders in simple words, so a new developer can understand the code quickly.

## Root Folder

```text
AI-Powered Vehicle Service Transparency/
+-- backend/
+-- frontend-web/
+-- mobile/
+-- README.md
+-- HOW_TO_RUN.md
+-- PROJECT_STRUCTURE.md
```

## backend/

The backend is the main API server. It receives requests from the web app and mobile app, stores data in the database, and runs vehicle health analysis.

```text
backend/
+-- app/
|   +-- main.py
|   +-- config.py
|   +-- database.py
|   +-- models/
|   +-- schemas/
|   +-- routes/
|   +-- ml/
+-- requirements.txt
+-- render.yaml
+-- .env.example
```

Important backend files:

- `app/main.py` creates the FastAPI app and connects all routes.
- `app/config.py` loads settings such as database URL and secret key.
- `app/database.py` creates the SQLAlchemy database connection.
- `app/models/` contains database table models.
- `app/schemas/` contains Pydantic validation schemas.
- `app/routes/` contains API endpoints.
- `app/ml/predictor.py` contains vehicle health prediction logic.
- `requirements.txt` contains Python dependencies.
- `render.yaml` contains Render deployment settings.

## frontend-web/

The web frontend is the browser-based user interface. It shows pages like Home, Vehicle Input, Dashboard, Service History, Login, and Car Mode.

```text
frontend-web/
+-- public/
+-- src/
|   +-- components/
|   +-- context/
|   +-- pages/
|   +-- services/
|   +-- App.jsx
|   +-- index.jsx
|   +-- index.css
+-- package.json
+-- tailwind.config.js
+-- postcss.config.js
+-- .env.example
```

Important frontend files:

- `src/App.jsx` defines all web routes.
- `src/pages/` contains full pages.
- `src/components/` contains reusable UI components.
- `src/context/` stores shared app state like auth and vehicle data.
- `src/services/api.js` connects React to the backend API.
- `src/index.css` contains global styling and Tailwind setup.
- `package.json` contains frontend dependencies and scripts.

## mobile/

The mobile app is built with React Native and Expo. It provides a phone-friendly version of the vehicle transparency system.

```text
mobile/
+-- src/
|   +-- context/
|   +-- navigation/
|   +-- screens/
|   +-- services/
+-- App.js
+-- app.json
+-- babel.config.js
+-- package.json
```

Important mobile files:

- `App.js` is the mobile app entry point.
- `src/navigation/AppNavigator.js` controls screen navigation.
- `src/screens/` contains mobile screens.
- `src/context/VehicleContext.js` stores shared vehicle state.
- `src/services/api.js` connects the mobile app to the backend API.

## How The System Works

1. User opens the React web app or mobile app.
2. User enters vehicle details.
3. Frontend sends data to the FastAPI backend using Axios.
4. Backend validates the data using Pydantic schemas.
5. SQLAlchemy stores or reads records from the database.
6. ML logic analyzes vehicle condition and maintenance risk.
7. Backend returns the health report.
8. Frontend shows the result in dashboard, charts, cards, and Car Mode.

## Why The Project Is Unique

This is not just a normal vehicle service website. Normal platforms usually focus on booking service appointments or storing basic vehicle details. This project adds AI-based vehicle health analysis, component-level maintenance prediction, explainable ML support, service history tracking, and a car infotainment-style display mode.
