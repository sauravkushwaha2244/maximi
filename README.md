# FlatMate Expense Splitter

A full-stack Flat Expense app built with React, Node.js, Express, and MongoDB.

## Features

- Add flatmates
- Add shared expenses
- Split expenses between members
- See who owes or gets money
- Category chart
- Member spending chart
- Download PDF report
- WhatsApp reminder message link
- Mark expense as settled
- Delete expense

## Run Backend

```bash
cd backend
npm install
cp .env.example .env  # or copy .env.example .env on Windows
npm run dev
```

Backend runs on:

```txt
http://localhost:5000
```

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```txt
http://localhost:5173
```

The frontend automatically proxies `/api/*` requests to the backend during local development.

## Storage

The backend uses file-based storage (data.json). No database setup required for local development.

Example `.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/flat-expense-app
FRONTEND_URL=http://localhost:5173
```

## Deployment

Backend: Render  
Frontend: Vercel  

For Vercel:
- Build command: `npm run build`
- Output directory: `dist`

For Render:
- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
