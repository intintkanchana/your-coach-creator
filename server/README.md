# Life Coach AI Application

An AI-powered Life Coach application that helps users achieve their goals through personalized coaching conversations.

## Project Structure

- `src/`: Backend API (Fastify + TypeScript)
- `frontend/`: Frontend Application (Next.js + React + UI5 Web Components)

## Prerequisites

- Node.js (v18 or higher recommended)
- `pnpm` (recommended) or `npm`

## Getting Started

### 1. Backend Setup

The backend handles the API logic, database (SQLite), and AI integration.

1.  Navigate to the root directory.
2.  Install dependencies:
    ```bash
    pnpm install
    # or
    npm install
    ```
3.  Set up environment variables:
    - Create a `.env` file in the root directory.
    - Add the necessary keys (e.g., `GOOGLE_API_KEY`, `PORT`, `GOOGLE_CLIENT_ID` for auth).
4.  Run the development server:
    ```bash
    pnpm run dev
    # or
    npm run dev
    ```
    The server will start at `http://localhost:4000` (default).

### 2. Frontend Setup

The frontend provides the user interface for chatting with the coach.

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    pnpm install
    # or
    npm install
    ```
3.  Run the development server:
    ```bash
    pnpm run dev
    # or
    npm run dev
    ```
    The application will be accessible at `http://localhost:3000`.

## API Documentation (Swagger)

The backend provides interactive API documentation using Swagger UI.

Once the backend server is running, you can access the documentation at:

**URL:** `http://localhost:4000/documentation`

(Replace `4000` with your configured port if different)

This interface allows you to:
- View all available API endpoints (Auth, Coaches, Chat).
- Test endpoints directly from the browser.
- See request/response schemas.

## Key Features

- **Google Authentication**: Secure login flow.
- **Coach Creation Agent**: Interactive chat flow to create custom coach personas.
- **Real-time Chat**: Chat with your AI coach.
- **Coach Management**: Switch between multiple coaches.

## Technologies

- **Backend**: Fastify, TypeScript, SQLite, Google Gemini AI SDK.
- **Frontend**: Next.js, React, UI5 Web Components.
