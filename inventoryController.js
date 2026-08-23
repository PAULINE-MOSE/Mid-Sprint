const { publishInventoryUpdate } = require('../producers/inventoryProducer');
const logger = require('../utils/logger');

function validate(body) {
  const required = ['productId', 'productName', 'quantity', 'warehouseId'];
  const missing = required.filter((field) => body[field] === undefined || body[field] === '');
  if (missing.length) return `Missing required fields: ${missing.join(', ')}`;
  if (typeof body.quantity !== 'number' || !Number.isFinite(body.quantity) || body.quantity < 0) {
    return 'Quantity must be a non-negative number';
  }
  return null;
}

async function createInventoryUpdate(req, res) {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const { productId, productName, quantity, warehouseId } = req.body;
    const messageId = await publishInventoryUpdate({
      productId,
      productName,
      quantity,
      warehouseId
    });

    return res.status(202).json({
      message: 'Inventory update queued successfully',
      messageId,
      status: 'QUEUED'
    });
  } catch (err) {
    logger.error('Failed to queue inventory update', { error: err.message });
    return res.status(503).json({
      error: 'Inventory update could not be queued'
    });
  }
}

module.exports = { createInventoryUpdate, validate };
