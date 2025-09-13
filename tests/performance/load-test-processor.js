module.exports = {
  setAuthToken,
  logResponse,
};

function setAuthToken(requestParams, context, ee, next) {
  // Mock authentication token for load testing
  requestParams.headers = requestParams.headers || {};
  requestParams.headers['Authorization'] = 'Bearer test-token';
  return next();
}

function logResponse(requestParams, response, context, ee, next) {
  if (response.statusCode >= 400) {
    console.log(`Error ${response.statusCode}: ${requestParams.url}`);
  }
  return next();
}