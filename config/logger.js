const logger = require('pino')({ level: process.env.LOG_LEVEL });
const pinoHttp = require('pino-http')({
  logger,
  useLevel: process.env.LOG_LEVEL,
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      user: req.raw.user,
      headers: req.headers,
    }),
  },
});

module.exports = { logger, pinoHttp };
