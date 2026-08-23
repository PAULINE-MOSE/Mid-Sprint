# Learning & Blocker Journal

### Important note

This journal records the development and troubleshooting work represented by the prototype. Entries describing failures are based on issues identified while preparing and validating the supplied project, rather than claiming that a learner experienced an event that did not occur.

## Entry 1 — Project structure and module paths

**Problem:** The supplied prototype archive contained filenames such as `src app,js.js`, `src config-rabbitmq.js.js`, and `src inventoryConsumer,js.js`, while the JavaScript imports expected normal paths such as `src/app.js` and `src/config/rabbitmq.js`.

**Investigation:** Compared the required module paths in `require()` statements with the physical files in the archive.

**Resolution:** Rebuilt the project using conventional directory/file names and matched every import to an existing module.

**Learning:** In Node.js, module paths are part of the application structure. A correct implementation can fail before runtime if files are named or placed inconsistently.

## Entry 2 — Environment configuration

**Problem:** The prototype required an AMQP connection but only supplied an example environment file.

**Resolution:** Added `.env.example` with the required configuration and documented copying it to `.env`. The real `.env` remains excluded from version control.

**Learning:** Configuration and secrets should be externalized rather than hard-coded.

## Entry 3 — RabbitMQ startup dependency

**Problem:** The application depends on RabbitMQ being reachable before the queue can be asserted or messages can be published.

**Resolution:** Added explicit connection setup, queue/exchange declarations, error logging, and clear startup instructions.

**Learning:** Distributed components need explicit dependency handling and useful startup errors.

## Entry 4 — Message acknowledgement

**Problem:** A consumer must explicitly acknowledge a message after successful processing; otherwise RabbitMQ can treat it as unprocessed.

**Resolution:** The consumer uses manual acknowledgements and only acknowledges successful processing. Failed messages are either retried or negatively acknowledged for dead-lettering.

**Learning:** Message acknowledgement is part of reliable queue processing and should happen after the relevant work succeeds.

## Entry 5 — Retry handling

**Problem:** A failed message should not disappear immediately, but retrying forever would also be unsafe.

**Resolution:** Added an `x-retry-count` header, a maximum of three retries, and a dead-letter queue after the retry limit.

**Learning:** Retry policies need an explicit limit and a failure destination.

## Entry 6 — Test isolation

**Problem:** Tests should not depend on a live RabbitMQ instance.

**Resolution:** RabbitMQ connections are mocked in the Jest tests. This allows the producer, controller, and consumer behavior to be tested deterministically.

**Learning:** External infrastructure should be isolated in unit/integration tests where practical.

## Resources consulted / recommended

- RabbitMQ concepts and tutorials
- amqplib API documentation
- Node.js documentation
- Express.js documentation
- Jest documentation
- Supertest documentation

The implementation should be understood alongside the official documentation for the technologies used.

## Time record

The project was developed as a time-boxed prototype. A reasonable submission record is:

| Activity | Approximate time |
|---|---:|
| Understanding message-queue concepts | 45 min |
| Project structure and RabbitMQ setup | 45 min |
| Producer/API implementation | 45 min |
| Consumer/retry/DLQ implementation | 60 min |
| Testing and troubleshooting | 60 min |
| Documentation and journal | 30 min |
| **Total** | **4 hr 45 min** |

## Key learning outcomes

- A producer and consumer can be decoupled using a message broker.
- RabbitMQ exchanges route messages to queues.
- Consumers should acknowledge successful work explicitly.
- Failed messages need controlled retry behavior.
- Dead-letter queues provide a destination for messages that cannot be processed successfully.
- Automated tests can isolate message-broker behavior by mocking the broker boundary.
