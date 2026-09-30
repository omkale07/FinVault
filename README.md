# 🏦 FinVault

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19-blue.svg)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Supported-blue.svg)](https://www.docker.com/)

**FinVault** is a production-oriented digital wallet platform featuring a robust Node.js backend and a modern React frontend. It leverages a microservices-inspired architecture with background workers, message queuing, and caching to ensure high performance, reliability, and security for financial transactions.

---

## ✨ Key Features

- **Robust Transaction Engine**: Secure and ACID-compliant wallet transactions backed by PostgreSQL.
- **Asynchronous Processing**: Uses RabbitMQ for event-driven architecture, offloading heavy tasks to dedicated background workers.
- **Transactional Outbox Pattern**: Ensures reliable message delivery and data consistency between the database and the message broker.
- **Real-time Notifications**: Integrated with Resend for transactional email notifications.
- **Modern User Interface**: A responsive, fast frontend built with React 19, Vite, and Tailwind CSS v4, featuring interactive charts (Recharts).
- **Secure by Default**: Implements JWT authentication, bcrypt password hashing, rate limiting, and Helmet for HTTP header security.
- **Containerized Environment**: Full Docker Compose setup for seamless local development and easy deployment.

---

## 🛠️ Tech Stack

### Frontend (`/client`)
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4 + clsx + tailwind-merge
- **Routing**: React Router v7
- **Data Visualization**: Recharts
- **Icons**: Lucide React
- **Network & State**: Axios

### Backend (`/src`)
- **Runtime**: Node.js
- **Framework**: Express v5
- **Database**: PostgreSQL (pg 18)
- **Cache**: Redis
- **Message Broker**: RabbitMQ
- **Auth & Security**: JSON Web Tokens (JWT), bcrypt, Express Rate Limit, Helmet
- **Email Service**: Resend

### Infrastructure & Operations
- Docker & Docker Compose
- Jest & Supertest (Testing)

---

## 🏗️ Architecture & Background Workers

FinVault employs a modular architecture where the main API server handles synchronous requests, while background workers process asynchronous tasks via RabbitMQ:

1. **API Server**: Handles incoming HTTP requests, authentication, and core wallet operations.
2. **Outbox Worker**: Implements the transactional outbox pattern to reliably publish domain events from the database to RabbitMQ.
3. **Notification Worker**: Consumes notification events and sends emails via Resend.
4. **Expiration Worker**: Monitors and processes pending or expired transactions to maintain data integrity.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
- Node.js (v18 or higher)
- Docker & Docker Compose
- Git

### 1. Clone the repository
git clone https://github.com/omkale07/FinVault.git
cd FinVault

### 2. Environment Variables
Create a `.env` file in the root directory and configure your environment variables. At a minimum, you may need to configure your database credentials and `RESEND_API_KEY` for notifications.

### 3. Start the Backend Infrastructure (Docker)
The easiest way to run the backend (Postgres, Redis, RabbitMQ, API, and Workers) is using Docker Compose:

docker-compose up -d --build

This will spin up:
- PostgreSQL database (`5433:5432`)
- Redis cache (`6379:6379`)
- RabbitMQ broker + Management UI (`5672`, `15672`)
- FinVault API Server (`5000`)
- Outbox, Notification, and Expiration Workers

### 4. Run the Frontend (Local Development)
Open a new terminal window, navigate to the client directory, install dependencies, and start the Vite dev server:

cd client
npm install
npm run dev

The frontend should now be running at `http://localhost:5173` (or similar port provided by Vite).

---

## 📁 Project Structure

FinVault/
├── client/                 # React frontend application
│   ├── src/                # Frontend source code
│   ├── package.json        # Frontend dependencies
│   └── vite.config.js      # Vite configuration
├── src/                    # Node.js backend application
│   ├── workers/            # Background worker processes
│   │   ├── notification.worker.js
│   │   ├── outbox.worker.js
│   │   └── transactionExpiration.worker.js
│   └── server.js           # API entry point
├── docker/                 # Docker related files (e.g., schema.sql)
├── docker-compose.yml      # Multi-container orchestration
├── Dockerfile              # Backend container build instructions
└── package.json            # Backend dependencies and scripts

---

## 🧪 Testing

The backend includes a test suite powered by Jest and Supertest.

# Run backend tests
npm test

---

## 📄 License

This project is licensed under the ISC License.
