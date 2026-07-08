# 🚀 MockVerse — AI-Enhanced Mock Test Platform

> An AI-powered adaptive learning platform that combines intelligent mock tests, real-time difficulty adjustment, AI tutoring, live leaderboards, and analytics to create a personalized computer science learning experience.

---

## 📖 Overview

**MockVerse** is a modern hybrid learning platform designed to help students prepare for technical interviews and computer science examinations through adaptive mock tests.

The platform leverages **Google Gemini** orchestrated using **LangGraph** to dynamically generate questions, evaluate responses, adjust difficulty based on performance, and provide detailed AI-generated feedback.

The backend is built with **FastAPI** using asynchronous APIs, while the frontend is developed using **React + Vite** to deliver a responsive and interactive user experience.

---

# ✨ Features

## 🎯 Adaptive Mock Tests

- Generate computer science questions dynamically using **Google Gemini**
- Select topic and initial difficulty
- Difficulty automatically adapts based on:
  - ✅ Correct answers
  - ❌ Incorrect answers
  - ⏭️ Skipped questions
- Personalized learning path for every student

---

## 🤖 AI Evaluation & Feedback

Every submitted answer is evaluated using an AI workflow powered by **LangGraph**.

The evaluation pipeline provides:

- Automatic scoring
- Detailed explanation
- Correct solution
- Performance insights
- Improvement suggestions

---

## 💬 AI Tutor Chatbot

A floating AI assistant that helps students during learning.

Supports questions from topics such as:

- Data Structures
- Algorithms
- Operating Systems
- Computer Networks
- DBMS
- OOP
- System Design (extendable)

Powered entirely by **Google Gemini**.

---

## 🏆 Live Leaderboards

Students compete with others in real time.

Features include:

- Topic-wise rankings
- Room-wise rankings
- Fast score updates using Redis Sorted Sets
- Historical rankings stored in Firestore

---

## ⚡ Real-Time Session Updates

Uses **FastAPI WebSockets** to broadcast:

- User joined
- User left
- Test activity
- Session updates

without refreshing the page.

---

## 🔐 Secure Authentication

Authentication is handled using **Firebase Authentication**.

Features:

- Google Sign-In
- Email & Password login
- Bearer Token authentication
- Protected API endpoints

---

## 📊 Analytics & Audit Trail

Every answered question is stored inside **PostgreSQL**.

The stored analytics can later be used for:

- Student progress tracking
- Accuracy analysis
- Topic-wise performance
- Leaderboard statistics
- Future recommendations

---

## ⚙️ Continuous Integration

GitHub Actions automatically performs:

- Backend testing
- Frontend build
- Dependency installation
- PostgreSQL service startup
- Redis service startup

for every Push and Pull Request.

---

# 🛠 Tech Stack

| Layer | Technology |
|---------|------------|
| **Frontend** | React, Vite |
| **Backend** | FastAPI, Python |
| **ORM** | Async SQLAlchemy |
| **AI Engine** | Google Gemini |
| **AI Workflow** | LangGraph |
| **Authentication** | Firebase Authentication |
| **Database** | PostgreSQL |
| **Document Storage** | Firebase Firestore |
| **Caching** | Redis |
| **Leaderboards** | Redis Sorted Sets |
| **Realtime Communication** | FastAPI WebSockets |
| **CI/CD** | GitHub Actions |

---
