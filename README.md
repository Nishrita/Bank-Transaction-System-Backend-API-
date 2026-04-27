# Bank Transaction System

A simple Node.js and Express backend for bank account management and transaction processing using MongoDB.

## Features

- User registration and login with JWT authentication
- Secure cookie-based token storage
- Protected account and transaction endpoints
- Account creation and balance retrieval
- Transaction processing with debits and credits using MongoDB sessions
- Idempotent transaction handling using `idempotencyKey`
- Email notifications for registration and transactions

## Tech Stack

- Node.js
- Express
- MongoDB with Mongoose
- JSON Web Tokens (`jsonwebtoken`)
- `bcryptjs` for password hashing
- `cookie-parser`
- `dotenv`
- `nodemailer`

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB connection URI

### Install dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root with at least the following variables:

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret
```

### Run the server

```bash
npm run dev
```

The server starts on `http://localhost:3000`.

## API Endpoints

### Auth

- `POST /api/auth/register`
  - Request body: `{ "username", "email", "password" }`
  - Registers a user and returns a JWT token.

- `POST /api/auth/login`
  - Request body: `{ "email", "password" }`
  - Authenticates a user and returns a JWT token.

- `POST /api/auth/logout`
  - Clears the auth cookie and blacklists the token.

### Accounts

> Protected routes require a valid JWT token in either `Cookie: token` or `Authorization: Bearer <token>`.

- `POST /api/account/`
  - Create a new account for the logged-in user.

- `GET /api/account/`
  - Get all accounts for the logged-in user.

- `GET /api/account/balance/:accountId`
  - Get the balance of a specific account.

### Transactions

> Protected routes require a valid JWT token.

- `POST /api/transaction`
  - Create a transfer transaction.
  - Request body: `{ "fromAccount", "toAccount", "amount", "idempotencyKey" }`

- `POST /api/transaction/system/initial-funds`
  - Create an initial funds transaction from a system account.
  - Request body: `{ "toAccount", "amount", "idempotencyKey" }`

## Notes

- The project uses MongoDB sessions to ensure transaction integrity.
- The `idempotencyKey` prevents duplicate transaction processing.
- The system expects email notifications to be configured in `src/services/email.service.js`.

## License

ISC
