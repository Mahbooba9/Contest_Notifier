# 🚀 DevCompete (Automated Coding Contest Notifier)

DevCompete is a full-stack MERN application designed to help developers stay updated on upcoming coding contests across various platforms (LeetCode, Codeforces, CodeChef, etc.). 

The platform features a modern React dashboard for viewing live contest schedules and subscribing to alerts. A Node.js background worker runs daily cron jobs to fetch global contest data, filter upcoming events, and automatically dispatch beautifully formatted HTML email alerts to registered users.

![DevCompete Dashboard Preview](https://i.imgur.com/example-dashboard-image.png) *(Note: Add a real screenshot link here later)*

---

## ✨ Key Features

- **Live Dashboard:** Fetches and displays real-time data from public contest APIs in a sleek, dark-mode UI.
- **Automated Cron Jobs:** Backend server automatically wakes up at 8:00 AM daily to process data without human intervention.
- **Instant Email Delivery:** Dispatches a welcome email instantly upon registration, and daily digests using `nodemailer`.
- **Data Privacy:** Broadcast emails are strictly sent using `bcc` (Blind Carbon Copy) to ensure the privacy of subscriber email addresses.
- **Robust Validation:** Enforces strict regex email validation and duplicate checking at the database level.
- **Resilient Architecture:** Implements fallback mock-data handling on the frontend in the event of third-party API outages.

---

## 🛠️ Technology Stack

**Frontend:**
- React.js (Vite)
- Custom CSS (Glassmorphism, CSS Grid, Micro-animations)
- Fetch API & AbortControllers (for timeout handling)

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose (Cloud Atlas)
- `node-cron` (Task Scheduling)
- `nodemailer` (SMTP Email Dispatcher)
- `axios` (Data Fetching)

---

## 📁 Repository Structure

This project follows a monorepo structure separating the client and server concerns:

```text
Contest_Notifier/
├── frontend/                 # React UI Dashboard
│   ├── src/                  # React Components & CSS
│   ├── package.json          # Frontend Dependencies
│   └── vite.config.js        # Vite Configuration
│
└── backend/                  # Node.js Background Engine
    ├── index.js              # Server, API routes, and Cron Jobs
    ├── test_email.js         # SMTP Diagnostics utility
    └── package.json          # Backend Dependencies
```

---

## 🚀 Local Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) installed
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (or local instance)
- A Gmail account with 2-Step Verification and an generated **App Password**.

### 1. Clone the Repository
```bash
git clone https://github.com/Mahbooba9/Contest_Notifier.git
cd Contest_Notifier
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file inside the `backend` directory with the following variables:
```env
PORT=4000
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_digit_app_password
MONGO_URI=your_mongodb_connection_string
```
Start the backend server:
```bash
node index.js
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```
Create a `.env` file inside the `frontend` directory:
```env
VITE_API_URL=http://localhost:4000
```
Start the frontend development server:
```bash
npm run dev
```

---

## ☁️ Deployment Architecture

This application is engineered for modern cloud hosting:
- **Frontend (Vercel):** The React application is deployed to Vercel, optimized for static delivery and fast edge-networking.
- **Backend (Render):** The Node server is deployed as a Web Service on Render, allowing it to persistently run the daily `node-cron` timer and communicate seamlessly with MongoDB Atlas.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

## 📝 License
This project is open-source.
