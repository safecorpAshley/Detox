class DetoxClientTimeoutError extends Error {
  constructor({ jsonMessage, timeout }) {
    super(`Received no answer from the testee in ${timeout}ms.`);
    this.json = jsonMessage;
  }
}

module.exports = DetoxClientTimeoutError;
