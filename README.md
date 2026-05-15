<div align="center">
  
# 🎓 Smart-AI Attendance System 🤖

**Automating classroom attendance using real-time Computer Vision and the MERN Stack.**

[![React](https://img.shields.io/badge/React-19-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-success.svg?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Face-API](https://img.shields.io/badge/AI-face--api.js-FF6F00.svg?style=for-the-badge)](https://github.com/vladmandic/face-api)

</div>

---

## 📖 Overview

This is a Smart Attendance System built with the MERN stack. Instead of manual roll calls, it uses a webcam kiosk and `face-api.js` to recognize students and automatically mark them present based on the active database timetable. Teachers can log in to a secure dashboard to manage class schedules and check daily attendance records.

---

## ✨ Key Features & Technical Highlights

### 🧠 AI-Powered Kiosk Scanner
- **In-Browser Machine Learning:** Utilizes `@vladmandic/face-api` (TensorFlow.js) to process webcam feeds directly in the browser, minimizing server payload.
- **Performance Optimization (Memory Vault):** Engineered a highly efficient React `useRef` "Memory Vault". This immediately caches recognized descriptors during continuous video streaming to prevent duplicate REST API calls and UI freezing.
- **Visual Feedback:** Provides students with an instant, color-coded, pop-up confirmation layered directly over the live video canvas.

### ⏳ Live Timetable Synchronization
- **Dynamic Validation:** The backend automatically intercepts the scan request and calculates the current Day and Time. It queries MongoDB to find the specific class happening *right now* for that student's batch.
- **Edge-Case Handling:** Safely handles edge cases like "Cancelled Classes", "No Active Classes", and strictly prevents "Double-Marking" for a single subject on the same day.

### 👨‍🏫 Secure Teacher Dashboard
- **RBAC & Authentication:** Robust security using **JSON Web Tokens (JWT)** and **bcryptjs** password hashing. Custom Express middleware acts as a "bouncer" to protect API endpoints.
- **CRUD Operations:** Teachers can easily add, view, and delete classes for specific student batches (A, B, C, D).
- **Real-Time Analytics:** Calculates total present, absent, and percentage attendance rates instantly.

---

## 🛠️ Technology Stack

### Frontend
- **React 19 & Vite:** Fast, modern UI development.
- **Tailwind CSS:** Fully responsive, utility-first styling with custom animations.
- **Lucide React:** Sleek, consistent iconography.
- **face-api.js:** Neural networks for face detection and 128-d face descriptor extraction.
- **React Router v7:** Modern, declarative routing.

### Backend
- **Node.js & Express.js:** RESTful API architecture following the MVC pattern.
- **MongoDB & Mongoose:** NoSQL database with normalized schemas for Students, Teachers, Timetables, and Attendance.
- **JWT & Bcrypt:** Secure authentication pipeline.

---

## 📂 Project Structure

```text
smart-attendance/
├── backend/
│   ├── config/          # MongoDB connection setup
│   ├── controllers/     # Route logic (Auth, Attendance, Timetable, Student)
│   ├── middleware/      # JWT Protection (Auth Middleware)
│   ├── models/          # Mongoose Schemas
│   ├── routes/          # Express API Endpoints
│   └── server.js        # Backend Entry Point
└── frontend/
    ├── public/
    │   └── models/      # Face-API Neural Network weights
    ├── src/
    │   ├── pages/       # React Views (Dashboard, Kiosk, Login, Register)
    │   ├── App.jsx      # Main Router & Navigation
    │   └── main.jsx     # Frontend Entry Point
    └── tailwind.config.js
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A MongoDB Atlas URI (or local MongoDB instance)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/smart-attendance.git
cd smart-attendance
```

### 2. Set up the Backend
```bash
cd backend
npm install
```
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key_123
```
Start the server:
```bash
npm run dev
# The server will run on http://localhost:5000
```

### 3. Set up the Frontend
Open a new terminal window:
```bash
cd frontend
npm install
```
*(Note: Ensure the face-api models are located in `frontend/public/models`)*

Start the Vite development server:
```bash
npm run dev
# The app will run on http://localhost:5173
```

---

## 🛣️ API Endpoints Reference

| Route | Method | Access | Description |
|-------|--------|--------|-------------|
| `/api/auth/login` | `POST` | Public | Authenticates teacher & returns JWT |
| `/api/attendance/scan` | `POST` | Public (Kiosk) | Evaluates live time & marks student present |
| `/api/attendance/batch/:batch`| `GET` | Private | Retrieves today's attendance for a batch |
| `/api/timetable` | `POST` | Private | Adds a new class to the database |
| `/api/timetable/:id` | `DELETE`| Private | Removes a class from the schedule |

---
*Built with ❤️ by [Your Name/Handle]*
