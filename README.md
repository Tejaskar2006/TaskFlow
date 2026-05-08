<div align="center">
  <h1>✨ Ethara.AI (TaskFlow)</h1>
  <p><strong>A production-ready Full Stack Team Task Manager Web Application, supercharged with AI capabilities.</strong></p>
</div>

<div align="center">
  
  ![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)
  ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
  ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)
  ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white)
  ![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=flat&logo=socket.io&logoColor=white)
  ![Gemini AI](https://img.shields.io/badge/Gemini_AI-8E75B2?style=flat&logo=googlebard&logoColor=white)
</div>

---

## 📑 Table of Contents
- [✨ Features](#-features)
- [🛠 Tech Stack](#-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [☁️ Deployment](#️-deployment-on-railway)
- [📸 Screenshots](#-screenshots)

---

## ✨ Features

- 🤖 **AI Capabilities**: Leverage Gemini AI to automatically generate subtasks, suggest priorities, and summarize task discussions.
- 🔒 **Authentication**: JWT-based secure signup/login.
- 👥 **Role-Based Access Control**: Admins can manage projects and members; Members can manage their assigned tasks.
- 📂 **Project Management**: Create projects, add members, and manage team collaboration.
- ✅ **Task Management**: Create tasks, set priorities, due dates, and track estimated hours.
- 📋 **Kanban Board**: Drag and drop tasks across columns to update their status seamlessly.
- ⚡ **Real-time Updates**: Real-time syncing across clients using WebSockets (Socket.IO).
- 📊 **Dashboard Analytics**: Visualize task distribution, completion rates, and recent activities.
- 💬 **Task Comments**: Collaborate with team members by adding comments on tasks.
- 📱 **Responsive UI**: Fully responsive design with beautiful dark mode support.

## 🛠 Tech Stack

### 🎨 Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (v4)
- **State Management**: Zustand
- **Validation**: React Hook Form + Zod
- **API Client**: Axios
- **Drag & Drop**: @hello-pangea/dnd
- **Analytics**: Recharts
- **Icons & UI**: Lucide React, Sonner (Toasts)

### ⚙️ Backend
- **Framework**: Node.js & Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT & bcryptjs
- **Real-time**: Socket.IO
- **Validation**: Zod
- **AI Integration**: Google Generative AI (Gemini)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (Local or Atlas)
- Gemini API Key

### 1️⃣ Clone the repository
```bash
git clone <repository-url>
cd Ethara.AI
```

### 2️⃣ Setup Backend
```bash
cd backend
npm install
cp .env.example .env
```
> **Note**: Update `.env` with your `MONGODB_URI`, `JWT_SECRET`, and `GEMINI_API_KEY`.
```bash
npm run dev
```

### 3️⃣ Setup Frontend
```bash
cd frontend
npm install --legacy-peer-deps
cp .env.example .env.local
```
> **Note**: Update `.env.local` if your backend is running on a different port.
```bash
npm run dev
```

## ☁️ Deployment on Railway

This project is configured for easy deployment on Railway:

1. Connect your GitHub repository to Railway.
2. Create an empty project and add a MongoDB database.
3. Add two Services from the repository: one for the `backend` folder and one for the `frontend` folder.
4. Set the `Root Directory` for each service appropriately.
5. Add the necessary Environment Variables for each service (e.g., `MONGODB_URI`, `JWT_SECRET`, `NEXT_PUBLIC_API_URL`, `GEMINI_API_KEY`).
6. Railway will use the `railway.json` configuration to automatically build and deploy the app.

## 📸 Screenshots
*(Add screenshots here)*
