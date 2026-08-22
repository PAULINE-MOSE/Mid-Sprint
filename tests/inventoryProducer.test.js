jest.mock('../src/config/rabbitmq', () => ({
  getChannel: jest.fn(),
  EXCHANGE_NAME: 'northstar.inventory',
  ROUTING_KEY: 'inventory.update'
}));

const { getChannel } = require('../src/config/rabbitmq');
const { publishInventoryUpdate } = require('../src/producers/inventoryProducer');

describe('Inventory producer', () => {
  test('publishes a persistent JSON message with message metadata', async () => {
    const publish = jest.fn().mockReturnValue(true);
    getChannel.mockResolvedValue({ publish });

    const id = await publishInventoryUpdate({
      productId: 'P1',
      productName: 'Laptop',
      quantity: 10,
      warehouseId: 'W1'
    });

    expect(id).toEqual(expect.any(String));
    expect(publish).toHaveBeenCalledTimes(1);

    const [exchange, routingKey, buffer, options] = publish.mock.calls[0];
    expect(exchange).toBe('northstar.inventory');
    expect(routingKey).toBe('inventory.update');
    expect(JSON.parse(buffer.toString())).toEqual(expect.objectContaining({
      messageId: id,
      productId: 'P1',
      quantity: 10
    }));
    expect(options).toEqual(expect.objectContaining({
      persistent: true,
      messageId: id,
      contentType: 'application/json'
    }));
  });

  test('fails when RabbitMQ rejects the message', async () => {
    getChannel.mockResolvedValue({
      publish: jest.fn().mockReturnValue(false)
    });

    await expect(publishInventoryUpdate({
      productId: 'P1',
      productName: 'Laptop',
      quantity: 10,
      warehouseId: 'W1'
    })).rejects.toThrow('RabbitMQ write buffer is full');
  });
});
