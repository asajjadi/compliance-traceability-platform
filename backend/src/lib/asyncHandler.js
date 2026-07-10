// Express 4 doesn't forward rejected promises from async handlers to error
// middleware on its own — an unhandled rejection there crashes the process.
// Wrap every async route with this so failures become a normal next(err).
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
