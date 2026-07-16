# middlewares

Stores reusable Express middleware.

Cross-cutting behavior such as errors, request logging, auth checks, rate limiting, and validation belongs here.

- `requestContext.middleware.ts`: attaches request ID, timestamp, and current user context.
