<div align="center">

# 🎓 QuizSmart

### Smart Examination Platform for FCI Zagazig University

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com)
[![SQL Server](https://img.shields.io/badge/SQL_Server-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white)](https://www.microsoft.com/sql-server)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)

</div>

---

## 📋 Overview

**QuizSmart** is a full-stack smart examination platform designed for the Faculty of Computers & Information (FCI) at Zagazig University. It provides a complete exam lifecycle — from question bank management and exam creation to secure student exam sessions with anti-cheat mechanisms and real-time analytics.

---

## ✨ Features

### For Instructors
- **Course Management** — Create, update, and delete academic courses
- **Question Bank** — Add questions manually or import via Excel (MCQ, True/False, Written)
- **Exam Builder** — Create exams with manual selection or AI-powered random generation
- **Shuffle Options** — Randomize question order and answer options per student
- **Live Analytics Dashboard** — Real-time stats, leaderboards, and per-question success rates
- **Results Export** — Export student results to CSV/Excel
- **Written Grading** — Manual grading workflow for essay/written questions with handwriting capture support
- **Republish & Update** — Update exam windows and republish closed exams

### For Students
- **Course Enrollment** — Browse and enroll in available courses
- **Exam Portal** — Secure, timed exam environment with question navigator
- **Anti-Cheat System** — Tab-switch detection, right-click blocking, copy-paste prevention
- **Handwriting Capture** — Webcam-based solution upload for written questions with 60-second minimum timer
- **Auto-Submit** — Automatic submission when time expires
- **Grades & Progress** — Track scores, view attempt history, and review detailed answer breakdowns
- **Resume Capability** — Resume interrupted exam sessions

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, React Bootstrap, Framer Motion, Chart.js |
| **Backend** | ASP.NET Core 8 Web API |
| **Database** | SQL Server with Entity Framework Core |
| **Auth** | JWT Bearer Authentication |
| **Email** | SMTP Email Verification |
| **Styling** | Custom CSS, Google Fonts (Outfit, Inter) |

---

## 📁 Project Structure

```
QuizSmart_Project/
├── quizsmart-ui/                  # React Frontend (Vite)
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   │   ├── student/           # Student-specific components
│   │   │   ├── CreateExamForm.jsx
│   │   │   ├── ExamStatus.jsx
│   │   │   ├── MyNavbar.jsx
│   │   │   └── PendingCorrections.jsx
│   │   ├── pages/                 # Page-level components
│   │   │   ├── InstructorDashboard.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── StudentDashboard.jsx
│   │   ├── services/              # API service layer
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
└── QuizSmart Project/             # .NET Backend
    └── QuizSmart.API/
        └── QuizSmart.API/
            ├── Controllers/       # API endpoints
            ├── Models/            # EF Core entities & DbContext
            ├── DTOs/              # Data transfer objects
            ├── Services/          # Business logic services
            ├── Middlewares/       # Custom middleware
            ├── Migrations/        # Database migrations
            └── Program.cs         # Application entry point
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- **.NET SDK** 8.0+
- **SQL Server** (LocalDB or full instance)

### Backend Setup
```bash
cd "QuizSmart Project/QuizSmart.API/QuizSmart.API"
dotnet restore
dotnet ef database update
dotnet run
```

### Frontend Setup
```bash
cd quizsmart-ui
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and the API on `https://localhost:7194`.

---

## 🔐 Authentication

- University email domain restriction (`@fci.zu.edu.eg`)
- Email verification with OTP code
- JWT token-based session management
- Role-based access control (Student / Instructor)

---

## 📊 Analytics

Instructors get access to:
- **General Stats** — Participants, average score, success rate, pass/fail ratio
- **Leaderboard** — Top 10 students ranked by score and time
- **Question Analysis** — Per-question correct/incorrect percentage chart

---

## 👥 Team

Developed as a graduation project for FCI Zagazig University — 2026.

---

<div align="center">

**© 2026 QuizSmart — FCI Zagazig University. All rights reserved.**

</div>
