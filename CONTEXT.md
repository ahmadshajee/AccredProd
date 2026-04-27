# AccredChain Workspace Context

## Root Structure

accredchain/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AlertMessage.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── BlockchainPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── InstitutionDashboard.jsx
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── NotFoundPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── VerifyPage.jsx
│   │   │   └── VerifyResultPage.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── blockchain/
│   │   ├── contracts/
│   │   │   └── AccredChainCredential.sol
│   │   ├── scripts/
│   │   │   ├── deploy.js
│   │   │   └── deploy.ts
│   │   ├── test/
│   │   │   └── AccredChainCredential.test.ts
│   │   ├── hardhat.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── blockchainController.js
│   │   ├── credentialController.js
│   │   ├── institutionController.js
│   │   └── verifyController.js
│   ├── data/
│   │   ├── credentials.json
│   │   ├── institutions.json
│   │   └── users.json
│   ├── legacy-seed-data/
│   │   ├── credentials.json
│   │   ├── institutions.json
│   │   └── users.json
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   └── db.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── blockchain.js
│   │   ├── credentials.js
│   │   ├── health.js
│   │   ├── institutions.js
│   │   └── verify.js
│   ├── utils/
│   │   ├── blockchain.js
│   │   ├── hashGenerator.js
│   │   └── ipfs.js
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── CONTEXT.md
└── README.md

## Backend API Summary

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/health`
- `GET /api/blockchain/transactions`
- `GET /api/blockchain/transactions/:txHash`
- `POST /api/institutions/register`
- `GET /api/institutions`
- `PATCH /api/institutions/:id/approve`
- `PATCH /api/institutions/:id/reject`
- `POST /api/credentials/issue`
- `GET /api/credentials/my`
- `GET /api/credentials/issued`
- `PATCH /api/credentials/:id/revoke`
- `GET /api/verify/:tokenId`

## Frontend Route Summary

- `/`
- `/blockchain`
- `/login`
- `/register`
- `/dashboard`
- `/verify`
- `/verify/:tokenId`

## Notes

- MongoDB is the runtime database; legacy seed files live under `server/legacy-seed-data`.
- Default seeded admin account: `admin@accredchain.com` / `admin123`.
- Auto-created student accounts use the issued email and the default password `Student123!`.

## On-Chain Mode Notes

- Backend supports dual mode issuance:
  - `BLOCKCHAIN_ENABLED=true` uses real contract calls via `RPC_URL`, `CONTRACT_ADDRESS`, and `ISSUER_PRIVATE_KEY`.
  - `BLOCKCHAIN_ENABLED=false` falls back to mock SHA-256 token and tx hash generation.
- Real on-chain issuance and revoke are implemented through `server/utils/blockchain.js` and `server/controllers/credentialController.js`.
- Verification endpoint enriches responses with on-chain validity data when token IDs are on-chain compatible.

## IPFS Notes

- Metadata upload is handled by `server/utils/ipfs.js`.
- Provider behavior is controlled by env vars:
  - `IPFS_PROVIDER=auto|pinata|mock`
  - `IPFS_ALLOW_MOCK_FALLBACK=true|false`
  - `PINATA_JWT` or `PINATA_API_KEY` + `PINATA_API_SECRET`
- Issued credential records persist `ipfsCID` and `ipfsProvider` fields.

## Smart Contract Notes

- Solidity workspace is under `server/blockchain`.
- Contract `AccredChainCredential.sol` is ERC-721 (`ERC721URIStorage`) + role-based access (`AccessControl`).
- Key contract capabilities:
  - `issueCredential(recipient, ipfsCID, credentialType, expiresAt)`
  - `revokeCredential(tokenId)`
  - `isValid(tokenId)` and `isExpired(tokenId)`
  - soulbound-style transfer lock unless explicitly unlocked by admin.