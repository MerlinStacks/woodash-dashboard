# Debug Status Log

## Current Phase: Phase 0 (State & Safety)
- **Attempt Count**: 0
- **Hypothesis**: The frontend is trying to access `http://localhost:3000` from an HTTPS origin (`https://overseek.plateit.au`), leading to Mixed Content blocks or CORS issues. This is likely due to misconfigured environment variables (API_BASE_URL) in the client.

## Context
User is seeing CORS and Mixed Content errors (HTTPS -> HTTP) when accessing the app at `https://overseek.plateit.au`. The API requests are going to `http://localhost:3000`.
