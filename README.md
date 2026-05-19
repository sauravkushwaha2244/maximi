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
copy .env.example .env
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

## MongoDB

Use local MongoDB or MongoDB Atlas.

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
