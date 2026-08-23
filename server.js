require('dotenv').config();
const app = require('./app');
const { connect } = require('./config/rabbitmq');
const { startConsumer } = require('./consumers/inventoryConsumer');
const logger = require('./utils/logger');

const PORT = Number(process.env.PORT || 3000);
const apiOnly = process.argv.includes('--api-only');

async function main() {
  if (!apiOnly) {
    await connect();
    await startConsumer();
  } else {
    await connect();
  }

  app.listen(PORT, () => logger.info(`Northstar API listening on port ${PORT}`));
}

main().catch((err) => {
  logger.error('Application startup failed', { error: err.message });
  process.exit(1);
});
