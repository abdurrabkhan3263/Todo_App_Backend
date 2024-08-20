const errorMiddleware = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Server internal error";
  return res.status(status).json({ status, message });
};

module.exports = errorMiddleware;
