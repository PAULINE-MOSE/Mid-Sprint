# Northstar Inventory Message Queue Prototype

### Purpose

This mini-prototype demonstrates how a **message queue** can decouple an inventory-update API from the component that processes inventory updates.

The API accepts an inventory update, publishes it to RabbitMQ, and immediately returns `202 Accepted`. A separate consumer receives the queued message, validates/processes it, acknowledges successful work, and retries failures before dead-lettering messages that exceed the retry limit.

### Technology

- Node.js
- JavaScript
- Express.js
- RabbitMQ
- amqplib
- Jest
- Supertest
- Winston
- UUID

### Prototype flow

```text
Client
  |
  | POST /api/inventory
  v
Express API
  |
  | publish inventory.update
  v
RabbitMQ Exchange
  |
  v
Inventory Queue
  |
  v
Consumer
  |
  +--> success --> ACK
  |
  +--> failure --> retry
                    |
                    +--> after max retries --> Dead Letter Queue
```

### Why a message queue?

The queue separates message production from processing. The API does not have to wait for the consumer to finish processing an inventory update. This demonstrates asynchronous processing and provides a place for retry/dead-letter handling.

## Prerequisites

- Node.js 18+
- RabbitMQ running locally or through Docker

### Start RabbitMQ with Docker

```bash
docker run -d --name northstar-rabbitmq \
  -p 5672:5672 -p 15672:15672 \
  rabbitmq:3-management
```

### Install

```bash
npm install
copy .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

### Run

The default start command starts the API and consumer:

```bash
npm start
```

API-only mode:

```bash
npm run start:api
```

Consumer-only mode:

```bash
npm run start:consumer
```

### Test

The automated tests mock RabbitMQ, so RabbitMQ does not need to be running to execute the test suite.

```bash
npm test
```

### Example request

```bash
curl -X POST http://localhost:3000/api/inventory \
  -H "Content-Type: application/json" \
  -d "{\"productId\":\"P1\",\"productName\":\"Laptop\",\"quantity\":10,\"warehouseId\":\"W1\"}"
```

Expected response shape:

```json
{
  "message": "Inventory update queued successfully",
  "messageId": "generated-uuid",
  "status": "QUEUED"
}
```

### Failure/retry demonstration

Send:

```json
{
  "productId": "FAIL_ME",
  "productName": "Retry Test",
  "quantity": 10,
  "warehouseId": "W1"
}
```

The consumer deliberately raises a controlled demonstration error for this product ID. The message is retried up to three times and then dead-lettered.

## Tests

The test suite covers:

- Health endpoint
- Valid inventory submission
- Missing fields
- Invalid quantity
- Queue publishing failure
- RabbitMQ message publication
- Persistent message metadata
- Successful consumer acknowledgement
- Retry behavior
- Maximum-retry dead-letter behavior
- Invalid message validation




