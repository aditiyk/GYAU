# GYAU

GYAU is a full-stack application featuring a powerful AI-driven backend and a modern, responsive frontend.

## Project Structure

The repository is divided into two main parts:

- `backend/`: A FastAPI-based REST API that handles tasks, calendar integration, analytics, voice processing, AI agent orchestration, payments, and focus modes. It connects to a MongoDB database.
- `frontend/`: A React frontend application built with Vite, TypeScript, and TailwindCSS for a modern user interface.

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js & npm
- MongoDB (running locally or a remote cluster URI)

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Activate the virtual environment (if it exists):
   ```bash
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```
   *Note: If you don't have a virtual environment yet, create one using `python -m venv venv`.*
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Make sure your `backend/.env` file is properly configured with your MongoDB credentials.
5. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend will be available at `http://127.0.0.1:8000`.

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173` (or another port provided by Vite).

## Features

- **Tasks & Calendar**: Manage your daily tasks and events.
- **Analytics**: Keep track of your productivity.
- **AI Agents**: Utilize AI personas and orchestrators to assist with various actions.
- **Voice Integration**: Voice processing capabilities.
- **Focus Mode**: Minimize distractions to enhance workflow.

## Technologies Used

- **Backend**: FastAPI, MongoDB, Python
- **Frontend**: React, Vite, TypeScript, TailwindCSS, Framer Motion, Lucide React
