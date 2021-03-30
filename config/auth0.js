const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const jwtAuthz = require('express-jwt-authz');

const auth0Scopes = {
  readOnly: ['read:quotes'],
  readWrite: ['write:quotes'],
};

function validateJwt() {
  return jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: process.env.AUTH0_JWKS_URI,
    }),
    audience: process.env.AUTH0_AUDIENCE,
    issuer: process.env.AUTH0_ISSUER,
    algorithms: ['RS256'],
  });
}

function checkJwtScope(scopeName) {
  return jwtAuthz(scopeName);
}
module.exports = { validateJwt, checkJwtScope, auth0Scopes };
