# TaskFlow

A production-ready Full Stack Team Task Manager Web Application similar to Trello/Asana.

## Tech Stack

### Frontend
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS (v4)
- Zustand (State management)
- React Hook Form + Zod (Validation)
- Axios (API Client)
- @hello-pangea/dnd (Drag and drop)
- Recharts (Analytics)
- Lucide React (Icons)
- Sonner (Toasts)

### Backend
- Node.js & Express.js
- TypeScript
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs (Password hashing)
- Socket.IO (Real-time updates)
- Zod (Validation)

## Features

- **Authentication**: JWT-based secure signup/login.
- **Role-Based Access Control**: Admins can manage projects and members; Members can manage their assigned tasks.
- **Project Management**: Create projects, add members, and manage team collaboration.
- **Task Management**: Create tasks, set priorities, due dates, and track estimated hours.
- **Kanban Board**: Drag and drop tasks across columns to update their status.
- **Real-time Updates**: Real-time syncing using WebSockets (Socket.IO).
- **Dashboard Analytics**: Visualize task distribution, completion rates, and recent activities.
- **Task Comments**: Collaborate with team members by adding comments on tasks.
- **Responsive UI**: Fully responsive design with dark mode support.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (Local or Atlas)

### 1. Clone the repository
```bash
git clone <repository-url>
cd Ethara.AI
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
```
Update `.env` with your MongoDB URI and JWT Secret.
```bash
npm run dev
```

### 3. Setup Frontend
```bash
cd frontend
npm install --legacy-peer-deps
cp .env.example .env.local
```
Update `.env.local` if your backend is running on a different port.
```bash
npm run dev
```

## Deployment on Railway

This project is configured for easy deployment on Railway.

1. Connect your GitHub repository to Railway.
2. Create an empty project and add a MongoDB database.
3. Add two Services from the repository: one for the `backend` folder and one for the `frontend` folder.
4. Set the `Root Directory` for each service appropriately.
5. Add the necessary Environment Variables for each service (e.g., `MONGODB_URI`, `JWT_SECRET`, `NEXT_PUBLIC_API_URL`).
6. Railway will use the `railway.json` configuration to automatically build and deploy the app.

## Screenshots
*(Add screenshots here)*
