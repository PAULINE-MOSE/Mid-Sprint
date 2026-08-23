const request = require('supertest');

jest.mock('../src/producers/inventoryProducer', () => ({
  publishInventoryUpdate: jest.fn()
}));

const { publishInventoryUpdate } = require('../src/producers/inventoryProducer');
const app = require('../src/app');

describe('POST /api/inventory', () => {
  beforeEach(() => jest.clearAllMocks());

  test('queues a valid inventory update with 202', async () => {
    publishInventoryUpdate.mockResolvedValue('message-123');

    const response = await request(app)
      .post('/api/inventory')
      .send({
        productId: 'P123',
        productName: 'Widget',
        quantity: 50,
        warehouseId: 'W1'
      });

    expect(response.status).toBe(202);
    expect(response.body.status).toBe('QUEUED');
    expect(response.body.messageId).toBe('message-123');
    expect(publishInventoryUpdate).toHaveBeenCalledWith({
      productId: 'P123',
      productName: 'Widget',
      quantity: 50,
      warehouseId: 'W1'
    });
  });

  test('rejects missing fields', async () => {
    const response = await request(app)
      .post('/api/inventory')
      .send({ productId: 'P123' });

    expect(response.status).toBe(400);
    expect(publishInventoryUpdate).not.toHaveBeenCalled();
  });

  test('rejects negative quantity', async () => {
    const response = await request(app)
      .post('/api/inventory')
      .send({
        productId: 'P123',
        productName: 'Widget',
        quantity: -1,
        warehouseId: 'W1'
      });

    expect(response.status).toBe(400);
  });

  test('returns service unavailable when queue publishing fails', async () => {
    publishInventoryUpdate.mockRejectedValue(new Error('RabbitMQ unavailable'));

    const response = await request(app)
      .post('/api/inventory')
      .send({
        productId: 'P123',
        productName: 'Widget',
        quantity: 10,
        warehouseId: 'W1'
      });

    expect(response.status).toBe(503);
  });
});

test('GET /health returns OK', async () => {
  const response = await request(app).get('/health');
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ status: 'OK' });
});
