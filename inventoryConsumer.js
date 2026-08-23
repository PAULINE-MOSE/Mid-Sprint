require('dotenv').config();
const { connect, QUEUE_NAME, DLQ_NAME } = require('../config/rabbitmq');
const logger = require('../utils/logger');

const MAX_RETRIES = 3;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function processInventoryMessage(content) {
  if (!content.productId || !content.warehouseId || typeof content.quantity !== 'number') {
    throw new Error('Invalid inventory message');
  }

  // Demonstration-only failure trigger used to exercise retry behavior.
  if (content.productId === 'FAIL_ME') {
    throw new Error('Simulated processing failure');
  }

  await sleep(50);
  logger.info('Inventory update processed', {
    productId: content.productId,
    quantity: content.quantity,
    warehouseId: content.warehouseId
  });
}

async function startConsumer() {
  const { channel } = await connect();

  await channel.consume(QUEUE_NAME, async (msg) => {
    if (!msg) return;

    const headers = msg.properties.headers || {};
    const retryCount = Number(headers['x-retry-count'] || 0);
    const messageId = msg.properties.messageId;

    try {
      const content = JSON.parse(msg.content.toString());
      logger.info('Inventory message received', { messageId, retryCount });
      await processInventoryMessage(content);
      channel.ack(msg);
      logger.info('Inventory message acknowledged', { messageId });
    } catch (error) {
      logger.error('Inventory message failed', { messageId, error: error.message });

      if (retryCount < MAX_RETRIES) {
        channel.ack(msg);
        channel.sendToQueue(QUEUE_NAME, msg.content, {
          persistent: true,
          messageId,
          contentType: msg.properties.contentType || 'application/json',
          type: msg.properties.type || 'inventory.update',
          headers: { ...headers, 'x-retry-count': retryCount + 1 }
        });
        logger.warn('Inventory message requeued for retry', {
          messageId,
          nextRetry: retryCount + 1
        });
      } else {
        channel.nack(msg, false, false);
        logger.error('Inventory message sent to dead-letter exchange', { messageId });
      }
    }
  }, { noAck: false });

  await channel.consume(DLQ_NAME, (msg) => {
    if (!msg) return;
    logger.error('Dead-letter message received', {
      messageId: msg.properties.messageId
    });
    channel.ack(msg);
  });

  return channel;
}

if (require.main === module) {
  startConsumer().catch((err) => {
    logger.error('Consumer failed to start', { error: err.message });
    process.exit(1);
  });
}

module.exports = { startConsumer, processInventoryMessage, MAX_RETRIES };
