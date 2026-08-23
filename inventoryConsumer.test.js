jest.mock('../src/config/rabbitmq', () => {
  const mockChannel = {
    consume: jest.fn((queue, callback) => {
      if (queue === 'northstar.inventory.updates') mockChannel.mainCallback = callback;
      if (queue === 'northstar.inventory.dead-letter') mockChannel.dlqCallback = callback;
      return Promise.resolve({ consumerTag: 'test-tag' });
    }),
    ack: jest.fn(),
    nack: jest.fn(),
    sendToQueue: jest.fn()
  };
  return {
    connect: jest.fn().mockResolvedValue({ channel: mockChannel }),
    QUEUE_NAME: 'northstar.inventory.updates',
    DLQ_NAME: 'northstar.inventory.dead-letter',
    mockChannel
  };
});

const { startConsumer, processInventoryMessage } = require('../src/consumers/inventoryConsumer');
const { mockChannel } = require('../src/config/rabbitmq');

describe('Inventory consumer', () => {
  beforeEach(() => jest.clearAllMocks());

  test('processes valid message and acknowledges it', async () => {
    await startConsumer();

    const msg = {
      content: Buffer.from(JSON.stringify({
        productId: 'P1',
        quantity: 10,
        warehouseId: 'W1'
      })),
      properties: { messageId: 'msg-1', headers: {} }
    };

    await mockChannel.mainCallback(msg);
    expect(mockChannel.ack).toHaveBeenCalledWith(msg);
  });

  test('retries a failed message with incremented retry header', async () => {
    await startConsumer();

    const msg = {
      content: Buffer.from(JSON.stringify({
        productId: 'FAIL_ME',
        quantity: 10,
        warehouseId: 'W1'
      })),
      properties: { messageId: 'msg-2', headers: {} }
    };

    await mockChannel.mainCallback(msg);

    expect(mockChannel.ack).toHaveBeenCalledWith(msg);
    expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
      'northstar.inventory.updates',
      msg.content,
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-retry-count': 1 })
      })
    );
  });

  test('dead-letters a message after maximum retries', async () => {
    await startConsumer();

    const msg = {
      content: Buffer.from(JSON.stringify({
        productId: 'FAIL_ME',
        quantity: 10,
        warehouseId: 'W1'
      })),
      properties: {
        messageId: 'msg-3',
        headers: { 'x-retry-count': 3 }
      }
    };

    await mockChannel.mainCallback(msg);

    expect(mockChannel.nack).toHaveBeenCalledWith(msg, false, false);
  });

  test('rejects invalid inventory messages', async () => {
    await expect(processInventoryMessage({ productId: 'P1' }))
      .rejects.toThrow('Invalid inventory message');
  });
});
