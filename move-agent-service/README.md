# Move Agent Service

Servicio API para interactuar con blockchains basadas en Move (Aptos) a través de instrucciones en lenguaje natural utilizando Move Agent Kit y Supabase para la resolución de correos electrónicos a direcciones blockchain.

## Características

- API REST para comunicación con Move Agent Kit
- Integración con OpenRouter para procesamiento de lenguaje natural
- Soporte para operaciones en la blockchain Aptos
- Resolución de correos electrónicos a direcciones blockchain mediante Supabase
- Compatibilidad con tokens y NFTs

## Requisitos

- Node.js v18 o superior
- Cuenta en OpenRouter para obtener clave API
- Cuenta en Supabase para almacenamiento de usuarios
- (Opcional) Cuenta en Aptos para realizar operaciones reales

## Instalación

1. Clona este repositorio
2. Instala las dependencias:

```bash
npm install
```

3. Copia el archivo `.env.example` a `.env` y configura tus variables de entorno:

```bash
cp .env.example .env
```

4. Edita el archivo `.env` con tu clave API de OpenRouter, URL de Supabase y clave de Supabase.

5. Crea una tabla `users` en tu proyecto de Supabase con la siguiente estructura:

```sql
CREATE TABLE users (
  email TEXT PRIMARY KEY,
  address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Uso

### Desarrollo

Para iniciar el servidor en modo desarrollo:

```bash
npm run dev
```

### Producción

Para compilar y ejecutar en producción:

```bash
npm run build
npm start
```

## Endpoints API

### Verificar estado

```
GET /api/status
```

Respuesta:
```json
{
  "status": "ok",
  "message": "Move Agent Service running",
  "version": "1.0.0",
  "timestamp": "2023-03-16T12:34:56.789Z"
}
```

### Usuarios

#### Registrar usuario

```
POST /api/users/register
```

Cuerpo:
```json
{
  "email": "usuario@ejemplo.com",
  "address": "0x123..."
}
```

#### Resolver email a dirección

```
GET /api/users/resolve/:email
```

Respuesta:
```json
{
  "success": true,
  "message": "Dirección encontrada",
  "data": {
    "address": "0x123..."
  }
}
```

#### Listar usuarios

```
GET /api/users
```

### Wallet

#### Obtener balance

```
GET /api/wallet/balance/:address
```

Respuesta:
```json
{
  "success": true,
  "message": "Balance obtenido correctamente",
  "data": {
    "APT": "10.5",
    "USDT": "100.0"
  }
}
```

#### Enviar tokens

```
POST /api/wallet/send
```

Cuerpo:
```json
{
  "fromAddress": "0x123...",
  "toAddress": "0x456...",
  "amount": 1.5,
  "tokenType": "APT"
}
```

Respuesta:
```json
{
  "success": true,
  "message": "Se han enviado 1.5 APT a 0x456...",
  "data": {
    "txHash": "0xabc...",
    "status": "success"
  }
}
```

### Agente

#### Procesar instrucción en lenguaje natural

```
POST /api/agent/process
```

Cuerpo:
```json
{
  "message": "Envía 5 APT a usuario@ejemplo.com",
  "address": "0x123..."
}
```

Respuesta:
```json
{
  "success": true,
  "message": "He procesado tu solicitud para enviar tokens...",
  "data": {
    "response": {
      "content": "He procesado tu solicitud para enviar tokens..."
    },
    "processedMessage": "Envía 5 APT a 0x456...",
    "originalMessage": "Envía 5 APT a usuario@ejemplo.com"
  }
}
```

## Despliegue

Este servicio puede ser desplegado en plataformas como:

- Railway
- Render
- Fly.io
- Vercel (funciones serverless)

## Licencia

ISC 