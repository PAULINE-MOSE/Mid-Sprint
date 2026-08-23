const express = require('express');
const { createInventoryUpdate } = require('./controllers/inventoryController');

const app = express();
app.use(express.json());
app.use(express.static(require('path').join(__dirname, '../public')));

app.get('/health', (_req, res) => res.status(200).json({ status: 'OK' }));
app.post('/api/inventory', createInventoryUpdate);

app.use((err, _req, res, _next) => {
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
