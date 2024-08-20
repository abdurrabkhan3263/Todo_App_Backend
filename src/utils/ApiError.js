class ApiError extends Error {
  constructor(status, message = "Something went wrong", error = []) {
    super();
    this.status = status;
    this.message = message;
    this.success = false;
    this.error = error;
  }
}

module.exports = ApiError;
