# AccredChain

AccredChain is a localhost-only academic credential verification demo built with React, Vite, TailwindCSS, Express, JWT auth, and MongoDB.

## Tech Stack

- Frontend: React 18, Vite, TailwindCSS, React Router DOM v6
- Backend: Node.js, Express.js
- Database: MongoDB Atlas, with one-time legacy migration from [server/legacy-seed-data](server/legacy-seed-data)
- Blockchain simulation: SHA-256 hashes via Node `crypto`
- Auth: JWT + `bcryptjs`
- Deployment target: localhost only

## Folder Structure

- [client](client) — React + Vite frontend
- [server](server) — Express API and Mongo-backed persistence
- [README.md](README.md) — setup and demo guide

## Default Admin

This account is seeded automatically when the server starts for the first time.

- Admin: `admin@accredchain.com` / `admin123`

## Features

- Admin can review institution registrations and approve or reject them.
- Institutions can issue simulated credential NFTs to students.
- If a student email does not exist yet, issuing a credential auto-creates that student account with the default password `Student123!`.
- Students can log in, view owned credentials, and share a public verification link.
- Employers and Verifiers can register accounts, verify credentials from their dashboards, and save them to their verification history.
- Verifiers can also validate a credential publicly with no login via the public verification link.
- Credentials can be revoked by the issuing institution.
- A public mock blockchain explorer shows every minted credential as a simulated on-chain transaction.

## API Overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Institutions

- `POST /api/institutions/register`
- `GET /api/institutions`
- `PATCH /api/institutions/:id/approve`
- `PATCH /api/institutions/:id/reject`

### Credentials

- `POST /api/credentials/issue`
- `GET /api/credentials/my`
- `GET /api/credentials/issued`
- `PATCH /api/credentials/:id/revoke`

### Public Verify

- `GET /api/verify/:tokenId`

### Employer & Verifier

- `GET /api/employer/history`
- `POST /api/employer/verify`
- `DELETE /api/employer/verify/:tokenId`

### Mock Blockchain

- `GET /api/blockchain/transactions`
- `GET /api/blockchain/transactions/:txHash`

### Health

- `GET /api/health`

## Local Setup

### 1. Install dependencies

In one terminal:

- `cd server`
- `npm install`

In another terminal:

- `cd client`
- `npm install`

### 2. Environment file

Use [server/.env](server/.env) or copy [server/.env.example](server/.env.example).

Set `MONGODB_URI` to your MongoDB connection string and `MONGODB_DB_NAME` to the database name you want the app to use.

### 3. Start the backend

From [server](server):

- `npm run dev`

The API runs on `http://localhost:5000`.

### 3.1 Import legacy seed data (optional)

From [server](server):

- `npm run seed:import` (imports only if collections are empty)
- `npm run seed:import:replace` (wipes and reimports all three collections)

### 4. Start the frontend

From [client](client):

- `npm run dev`

The app runs on `http://localhost:5173`.

## Public Pages

- Verify page: `http://localhost:5173/verify`
- Blockchain explorer: `http://localhost:5173/blockchain`

## Data Storage

Legacy JSON seed files are kept in:

- [server/legacy-seed-data/users.json](server/legacy-seed-data/users.json)
- [server/legacy-seed-data/institutions.json](server/legacy-seed-data/institutions.json)
- [server/legacy-seed-data/credentials.json](server/legacy-seed-data/credentials.json)

## Notes

- No real blockchain, IPFS, NFT minting, or cloud storage is used.
- Credential hashes and transaction IDs are simulated only.
- The blockchain explorer is a local mock explorer built from issued credential records.
- This project is intended for demos, prototyping, and local development.
