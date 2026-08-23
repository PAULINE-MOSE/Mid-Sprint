# Deploying the Northstar Prototype

The GitHub Pages site is static documentation. The interactive prototype must run on a Node.js host with RabbitMQ available to the backend.

Recommended deployment: Render.

## Services
1. RabbitMQ service on Render.
2. Northstar Node.js web service on Render.

Set `AMQP_URL` on the Northstar service to the RabbitMQ connection URL supplied by your RabbitMQ service. Keep RabbitMQ and Northstar in the same Render region so they can communicate over Render's private network.

The web service serves the interactive UI at `/` and the API at `/api/inventory`.
