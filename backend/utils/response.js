/**
 * Standard API response helper
 */
const sendResponse = (res, statusCode, success, data, message) => {
  return res.status(statusCode).json({ success, data, message });
};

const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return sendResponse(res, statusCode, true, data, message);
};

const sendError = (res, message = 'An error occurred', statusCode = 500, data = null) => {
  return sendResponse(res, statusCode, false, data, message);
};

module.exports = { sendSuccess, sendError };
