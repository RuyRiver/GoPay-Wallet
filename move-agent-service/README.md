# GoPay Move Agent Service

![GoPay Logo](https://lovable.dev/opengraph-image-p98pqg.png)

A powerful API service that enables the GoPay wallet to interact with Move-based blockchains (Aptos) using natural language instructions. This service leverages the Move Agent Toolkit and provides email-to-blockchain address resolution through Supabase.

## Features

- **REST API** for seamless communication with Move Agent Toolkit
- **Natural Language Processing** via OpenRouter for conversational interactions
- **Blockchain Operations** supporting transactions on Aptos blockchain
- **Email Resolution** to map email addresses to blockchain addresses
- **Multi-asset Support** for tokens and NFTs

## Technologies

- **Node.js** and **TypeScript** for robust server-side code
- **Express** for API routing and middleware
- **Move Agent Toolkit** for simplified blockchain interactions
- **OpenRouter** for AI processing of natural language inputs
- **Supabase** for user data storage and authentication
- **Aptos SDK** for blockchain transactions

## Requirements

- Node.js v18 or higher
- OpenRouter API key
- Supabase account for user storage
- (Optional) Aptos account for real blockchain operations

## Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

4. Configure your environment variables in the `.env` file:
   - OpenRouter API key
   - Supabase URL and key
   - Aptos network configuration

5. Create a `users` table in your Supabase project with the following structure:

```sql
CREATE TABLE users (
  email TEXT PRIMARY KEY,
  address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Usage

### Development

Start the server in development mode:

```bash
npm run dev
```

### Production

Build and run in production:

```bash
npm run build
npm start
```

## API Endpoints

### Status Check

```
GET /api/status
```

Response:
```json
{
  "status": "ok",
  "message": "Move Agent Service running",
  "version": "1.0.0",
  "timestamp": "2023-03-16T12:34:56.789Z"
}
```

### User Management

#### Register User

```
POST /api/users/register
```

Body:
```json
{
  "email": "user@example.com",
  "address": "0x123..."
}
```

#### Resolve Email to Address

```
GET /api/users/resolve/:email
```

Response:
```json
{
  "success": true,
  "message": "Address found",
  "data": {
    "address": "0x123..."
  }
}
```

#### List Users

```
GET /api/users
```

### Wallet Operations

#### Get Balance

```
GET /api/wallet/balance/:address
```

Response:
```json
{
  "success": true,
  "message": "Balance retrieved successfully",
  "data": {
    "APT": "10.5",
    "USDT": "100.0"
  }
}
```

#### Send Tokens

```
POST /api/wallet/send
```

Body:
```json
{
  "fromAddress": "0x123...",
  "toAddress": "0x456...",
  "amount": 1.5,
  "tokenType": "APT"
}
```

Response:
```json
{
  "success": true,
  "message": "Successfully sent 1.5 APT to 0x456...",
  "data": {
    "txHash": "0xabc...",
    "status": "success"
  }
}
```

### Agent Processing

#### Process Natural Language Instruction

```
POST /api/agent/process
```

Body:
```json
{
  "message": "Send 5 APT to user@example.com",
  "address": "0x123..."
}
```

Response:
```json
{
  "success": true,
  "message": "I've processed your request to send tokens...",
  "data": {
    "response": {
      "content": "I've processed your request to send tokens..."
    },
    "processedMessage": "Send 5 APT to 0x456...",
    "originalMessage": "Send 5 APT to user@example.com"
  }
}
```

## Deployment

This service can be deployed on platforms such as:

- [Railway](https://railway.app/)
- [Vercel](https://vercel.com/) (serverless functions)
- [Render](https://render.com/)
- [Fly.io](https://fly.io/)

## Integration with GoPay Wallet

The Move Agent Service works seamlessly with the GoPay Wallet frontend to provide a complete solution for blockchain interactions using natural language. The service handles the complex blockchain operations while exposing a simple API that the frontend can easily consume.

## License

ISC 