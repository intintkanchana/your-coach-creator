# Life Coach API

This directory contains the backend API for the Your Coach application. It is built with Fastify, TypeScript, and SQLite, and integrates with Google's Gemini AI.

## Prerequisites

- Node.js (v18+)
- `npm`

## Setup

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Configuration**
    Create a `.env` file in this directory based on `.env.example`.
    Required keys:
    - `GOOGLE_API_KEY`: API key for Gemini models.
    - `PORT`: Server port (default: 4000).
    - `GOOGLE_CLIENT_ID`: For Google OAuth.

3.  **Run Development Server**
    ```bash
    npm run dev
    ```
    The server will start at `http://localhost:4000`.

## API Documentation

Interactive API documentation (Swagger UI) is available at:
`http://localhost:4000/documentation`

## Technologies

- **Framework**: Fastify
- **Language**: TypeScript
- **Database**: SQLite (via `better-sqlite3`)
- **AI**: Google Generative AI SDK (`@google/genai`)
