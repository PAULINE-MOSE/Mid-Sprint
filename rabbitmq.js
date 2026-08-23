const amqp = require('amqplib');
const logger = require('../utils/logger');

let connection;
let channel;

const EXCHANGE_NAME = 'northstar.inventory';
const QUEUE_NAME = 'northstar.inventory.updates';
const DLX_EXCHANGE_NAME = 'northstar.inventory.dlx';
const DLQ_NAME = 'northstar.inventory.dead-letter';
const ROUTING_KEY = 'inventory.update';
const DLQ_ROUTING_KEY = 'inventory.dead-letter';

async function connect(url = process.env.AMQP_URL || 'amqp://guest:guest@localhost:5672') {
  if (connection && channel) return { connection, channel };

  connection = await amqp.connect(url);
  channel = await connection.createChannel();

  await channel.assertExchange(DLX_EXCHANGE_NAME, 'direct', { durable: true });
  await channel.assertQueue(DLQ_NAME, { durable: true });
  await channel.bindQueue(DLQ_NAME, DLX_EXCHANGE_NAME, DLQ_ROUTING_KEY);

  await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
  await channel.assertQueue(QUEUE_NAME, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': DLX_EXCHANGE_NAME,
      'x-dead-letter-routing-key': DLQ_ROUTING_KEY
    }
  });
  await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY);

  logger.info('RabbitMQ topology ready');
  return { connection, channel };
}

async function getChannel() {
  return (await connect()).channel;
}

async function close() {
  if (channel) await channel.close();
  if (connection) await connection.close();
  channel = undefined;
  connection = undefined;
}

module.exports = {
  connect,
  getChannel,
  close,
  EXCHANGE_NAME,
  QUEUE_NAME,
  DLX_EXCHANGE_NAME,
  DLQ_NAME,
  ROUTING_KEY,
  DLQ_ROUTING_KEY
};
