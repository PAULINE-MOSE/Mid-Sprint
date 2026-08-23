const { v4: uuidv4 } = require('uuid');
const { getChannel, EXCHANGE_NAME, ROUTING_KEY } = require('../config/rabbitmq');
const logger = require('../utils/logger');

async function publishInventoryUpdate(inventoryData) {
  const channel = await getChannel();
  const messageId = uuidv4();

  const message = {
    messageId,
    ...inventoryData,
    timestamp: new Date().toISOString()
  };

  const published = channel.publish(
    EXCHANGE_NAME,
    ROUTING_KEY,
    Buffer.from(JSON.stringify(message)),
    {
      persistent: true,
      messageId,
      contentType: 'application/json',
      type: 'inventory.update'
    }
  );

  if (!published) {
    throw new Error('RabbitMQ write buffer is full; message was not accepted');
  }

  logger.info('Inventory update published', {
    messageId,
    productId: inventoryData.productId
  });

  return messageId;
}

module.exports = { publishInventoryUpdate };
