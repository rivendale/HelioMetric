# HelioMetric Code Review & Security Audit

**Date:** 2026-02-15
**Version Audited:** 0.4.0
**Auditor:** Automated Code Review (Claude)
**Status:** ALL ISSUES FIXED (see commit history for details)
**Scope:** Full-stack audit — Next.js frontend, FastAPI backend, shared libraries, configuration

---

## Executive Summary

HelioMetric is a full-stack application (Next.js 14 + FastAPI) that correlates NOAA space weather data with Chinese/Western zodiac systems. The codebase is generally well-structured with good separation of concerns, consistent patterns, and proper TypeScript strict mode usage. However, several security vulnerabilities, bugs, and architectural issues were identified across both the frontend and backend.

**Severity Breakdown:**
- **Critical:** 2
- **High:** 5
- **Medium:** 8
- **Low:** 6
- **Informational:** 5

---

## Critical Issues

### C-1: Anthropic API Key Exposed to Client-Side Context

**File:** `backend/services/research_agent.py:27`
**Severity:** Critical
**Category:** Security — Credential Exposure

The `ANTHROPIC_API_KEY` is loaded at module level and used directly in the `ResearchAgent` class. While the backend FastAPI server runs server-side, the research endpoints (`/api/research/discuss`, `/api/research/skill`) accept arbitrary `session_id` and `message` parameters with **no authentication or rate limiting**. Any client can make unlimited calls to the Anthropic API through these unauthenticated proxy endpoints, leading to:
- Unlimited API cost accumulation
- Prompt injection via the `message` field
- Potential abuse as an open AI proxy

**Recommendation:** Add authentication middleware to all `/api/research/*` endpoints. Implement rate limiting per session/IP. Validate and sanitize user input before passing to Claude API.

---

### C-2: HMAC Signature Verification Bypass When Secret Is Empty

**File:** `backend/services/ralph_monitor.py:96-98`
**Severity:** Critical
**Category:** Security — Authentication Bypass

```python
def verify_signature(body: bytes, signature: str) -> bool:
    if not SECRET:
        logger.warning("RALPH_MONITOR_SECRET not configured - skipping signature verification")
        return True  # <-- Bypasses all authentication
```

When `RALPH_MONITOR_SECRET` is not configured (empty string is the default on line 45), **all Ralph callback requests are accepted without authentication**. The `/api/ralph-callback` endpoint can then be used to:
- Fetch application logs (including sensitive data)
- Retrieve system metrics and schema information
- Generate test data
- Trigger update checks

**Recommendation:** Default to rejecting requests when no secret is configured. Change to `return False` when `SECRET` is empty, or require the secret to be set before the callback endpoint is registered.

---

## High Severity Issues

### H-1: No Authentication on Research API Endpoints

**File:** `backend/routers/research.py`
**Severity:** High
**Category:** Security — Missing Authentication

All research endpoints are publicly accessible:
- `POST /api/research/discuss` — Open AI proxy
- `POST /api/research/skill` — Execute arbitrary research skills
- `GET /api/research/sessions` — List all sessions
- `GET /api/research/sessions/{session_id}` — Read session history
- `POST /api/research/tasks` — Create scheduled tasks
- `POST /api/research/tasks/{task_id}/run` — Trigger immediate task execution
- `DELETE /api/research/tasks/{task_id}` — Delete tasks

An attacker can read all conversation history, create scheduled tasks that run indefinitely, and rack up Anthropic API costs.

**Recommendation:** Add API key or token-based authentication to all research endpoints. Consider making the research feature opt-in via environment variable.

---

### H-2: Synchronous Redis Operations Called from Async Context

**File:** `backend/services/redis_cache.py:84-130`
**Severity:** High
**Category:** Bug — Blocking Event Loop

The `get_cached`, `set_cached`, and `get_or_compute` functions are declared as `async` but call synchronous `redis.Redis` methods (`client.get()`, `client.setex()`). The standard `redis` Python library's operations are blocking I/O calls. In a FastAPI/asyncio context, these will block the entire event loop during each Redis operation, causing all concurrent requests to stall.

```python
async def get_cached(key: str) -> Optional[Any]:
    client = get_redis_client()
    # ...
    value = client.get(key)  # <-- Synchronous blocking call in async function
```

**Recommendation:** Either use `redis.asyncio.Redis` (the async Redis client), or use `asyncio.to_thread()` to offload synchronous calls. Alternatively, remove the `async` declarations and use `run_in_executor` from the event loop.

---

### H-3: `datetime.utcnow()` Used Throughout (Deprecated)

**Files:** Multiple backend files
**Severity:** High
**Category:** Bug — Deprecated API

`datetime.utcnow()` is deprecated since Python 3.12 and returns naive datetime objects without timezone info. This can cause subtle bugs in time comparison, especially in:
- `ralph_monitor.py:63,70` — Uptime calculations
- `ralph_callback.py:62,112,139` — Log timestamps and filtering
- `research_agent.py:53,319` — Session timestamps
- `task_scheduler.py:238,303,306` — Schedule calculations
- `middleware/ralph_error.py:63,83` — Duration calculations

**Recommendation:** Replace all `datetime.utcnow()` with `datetime.now(datetime.timezone.utc)` for timezone-aware datetimes.

---

### H-4: Task Scheduler Creates `asyncio.Task` Outside Running Loop

**File:** `backend/services/task_scheduler.py:494`
**Severity:** High
**Category:** Bug — Runtime Error

```python
def start(self):
    if self.running:
        return
    self.running = True
    self._task = asyncio.create_task(self._scheduler_loop())
```

`asyncio.create_task()` requires a running event loop. When `start()` is called during FastAPI lifespan startup, it works because the event loop is running. However, this is fragile — if called from a synchronous context or during testing, it will raise `RuntimeError: no running event loop`.

**Recommendation:** Use `asyncio.ensure_future()` with proper loop handling, or move task creation to an async method that's guaranteed to be called within an async context.

---

### H-5: Error Messages Leak Internal Details to Clients

**Files:** Multiple router files
**Severity:** High
**Category:** Security — Information Disclosure

Several error handlers include raw exception details in API responses:
- `backend/routers/noaa.py:74`: `"details": {"error": str(e)}`
- `backend/routers/location.py:155`: `"details": {"error": str(e)}`
- `backend/routers/geocode.py:139`: `"details": {"error": str(e)}`
- `backend/routers/ralph_callback.py:544`: `"error": str(e)`

Raw exception strings can leak internal paths, database details, or stack traces to attackers.

**Recommendation:** Log full error details server-side but return generic error messages to clients. Only include detailed errors in development mode.

---

## Medium Severity Issues

### M-1: DualCaseModel Defined Twice (Code Duplication)

**Files:** `backend/services/noaa.py:30-50`, `backend/services/maps.py:21-26`
**Severity:** Medium
**Category:** Code Quality — DRY Violation

`DualCaseModel` is defined identically in both `noaa.py` and `maps.py`. The `utils/responses.py` already has `CamelCaseModel` with the same functionality.

**Recommendation:** Remove duplicate `DualCaseModel` classes and import `CamelCaseModel` from `utils/responses.py`.

---

### M-2: Redis Client Singleton Not Thread-Safe

**File:** `backend/services/redis_cache.py:17-49`
**Severity:** Medium
**Category:** Bug — Race Condition

The global `_redis_client` variable is accessed without locking. Under concurrent requests, multiple threads could attempt to initialize the Redis client simultaneously, potentially creating multiple connections or failing with partial state.

**Recommendation:** Use `threading.Lock()` to protect the singleton initialization, or initialize the client eagerly at module load time.

---

### M-3: No Input Validation on Research Task `schedule_value`

**File:** `backend/routers/research.py:268-310`
**Severity:** Medium
**Category:** Security — Input Validation

The `CreateTaskRequest` accepts arbitrary `schedule_value` strings that are passed directly to `croniter()`. Malformed cron expressions could cause errors, and extremely frequent schedules (e.g., `* * * * * *`) could overwhelm the system.

**Recommendation:** Validate cron expressions before accepting them. Set minimum interval thresholds (e.g., no more frequent than every 5 minutes).

---

### M-4: Session Files Written to Disk Without Size Limits

**Files:** `backend/services/research_agent.py:310-315`, `backend/services/task_scheduler.py:160-165`
**Severity:** Medium
**Category:** Security — Resource Exhaustion

Research sessions and task results are written as JSON files to disk. There are no limits on:
- Number of sessions that can be created
- Message content size within sessions
- Number of task result files

An attacker could fill disk space by creating many sessions or sending very large messages.

**Recommendation:** Implement file count limits and total size quotas. Consider using a database instead of filesystem storage.

---

### M-5: Missing `Content-Security-Policy` Header

**File:** `backend/main.py:82-100`
**Severity:** Medium
**Category:** Security — Missing Security Header

The `SecurityHeadersMiddleware` sets several security headers but is missing `Content-Security-Policy` (CSP), which is the most important defense against XSS attacks.

**Recommendation:** Add a `Content-Security-Policy` header appropriate for the application (at minimum `default-src 'self'` with necessary exceptions for CDN resources and API calls).

---

### M-6: Frontend TypeScript Types Use Dual Optional Fields Instead of Union

**File:** `lib/types.ts`
**Severity:** Medium
**Category:** Code Quality — Type Safety

Types like `KIndexReading`, `InterferencePattern`, and `TemporalState` define both snake_case and camelCase versions of every field as optional:

```typescript
export interface KIndexReading {
  time_tag?: string;    // snake_case
  timeTag?: string;     // camelCase
}
```

This means code accessing these types gets no guarantee that _either_ field is present, undermining type safety. Any access requires null-checking both fields.

**Recommendation:** Pick a canonical casing for internal use and only use dual-case at API boundaries. Use a transformation layer at the API boundary to normalize incoming data.

---

### M-7: `getOrCompute` Cache Stampede Risk

**Files:** `lib/redis.ts:110-128`, `backend/services/redis_cache.py:114-130`
**Severity:** Medium
**Category:** Performance — Cache Stampede

Both the TypeScript and Python `getOrCompute` implementations check cache, miss, and then compute. Under high concurrency, if the cache expires, all concurrent requests will miss the cache simultaneously and all compute the value, causing a stampede to the upstream API.

**Recommendation:** Implement a locking mechanism (e.g., Redis `SETNX`-based distributed lock) or use stale-while-revalidate pattern.

---

### M-8: `observedTime` Date Serialization May Fail on Cache Roundtrip

**File:** `lib/noaa.ts:80-87`
**Severity:** Medium
**Category:** Bug — Serialization

`KIndexReading.observedTime` is a `Date` object. When cached in Redis (via `JSON.stringify`), `Date` objects are serialized to ISO strings. On cache retrieval, these will be plain strings, not `Date` objects. Code that calls `.getTime()` on these values (line 86) will fail silently or throw.

**Recommendation:** Reconstruct `Date` objects after cache retrieval, or store timestamps as ISO strings/numbers consistently.

---

## Low Severity Issues

### L-1: `calculateFireHorseInterference` Deprecated but Not Removed

**File:** `lib/HelioEngine.ts:162-169`
**Severity:** Low

A deprecated wrapper function remains in the codebase. It should be removed if no callers exist, or documented with a planned removal timeline.

---

### L-2: Mock Data Uses `random.random()` Making Tests Non-Deterministic

**Files:** `backend/services/noaa.py:122`, `lib/noaa.ts:141`
**Severity:** Low

Mock data generation uses random values, making behavior unpredictable when NOAA API is down. Tests using this mock data will produce different results each run.

**Recommendation:** Seed the random generator for testing, or use fixed mock data for deterministic behavior.

---

### L-3: Frontend `package.json` Missing Test Script

**File:** `package.json`
**Severity:** Low

The root `package.json` has no test script. Only the `frontend/` directory has Vitest configured. There are no tests for the Next.js app router components or the core `lib/` modules.

**Recommendation:** Add a test framework (Vitest) to the root project and write tests for the core libraries (`HelioEngine`, `TimeDecoder`, `EntanglementLogic`).

---

### L-4: `exclude_paths` Default Mutable Argument

**File:** `backend/middleware/ralph_error.py:42`
**Severity:** Low
**Category:** Bug — Mutable Default Argument

```python
def __init__(self, app, ..., exclude_paths: list = None):
```

While using `None` as default is correct here, the class docstring and usage suggest `list = []` was intended. This is a Python anti-pattern that can cause shared state across instances, though the current `None` guard prevents it.

---

### L-5: `toSnakeCase` Doesn't Handle Consecutive Capitals

**File:** `lib/api-utils.ts:74-78`
**Severity:** Low

```typescript
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter, index) =>
    (index > 0 ? '_' : '') + letter.toLowerCase()
  );
}
```

This produces incorrect results for consecutive capitals:
- `'HTMLParser'` → `'h_t_m_l_parser'` (expected: `'html_parser'`)
- `'APIKey'` → `'a_p_i_key'` (expected: `'api_key'`)

**Recommendation:** Use a regex that handles consecutive capitals: `str.replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2').replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()`

---

### L-6: Database Engine Created at Module Level

**File:** `backend/database.py:13-19`
**Severity:** Low

The SQLAlchemy engine is created at import time. If `DATABASE_URL` is misconfigured, the import will fail and crash the entire application. The engine also creates a connection pool immediately even if the database is not needed for the current request.

**Recommendation:** Use lazy initialization for the engine, or wrap creation in a function that's called during application startup.

---

## Informational Findings

### I-1: Dual Frontend Architecture

The project has **two frontend directories**:
- `/app/` — Next.js App Router (actively used, served at root)
- `/frontend/` — Vite + React (appears to be legacy)

The Render deployment (`render.yaml`) builds the Vite frontend and serves it via FastAPI, while the Next.js app is configured for standalone deployment. This creates confusion about which frontend is the "source of truth."

**Recommendation:** Decide on one frontend stack and remove the other, or clearly document the relationship between them.

---

### I-2: Hardcoded Default Birth Date

**File:** `context/SystemState.tsx:135`

```typescript
createNode({ name: 'You', birthYear: 1990, birthDate: '1990-06-15', ... })
```

A hardcoded default user is created with a fixed birth date. This is minor but could confuse users who don't realize they need to edit it.

---

### I-3: No Rate Limiting on Any Endpoint

Neither the FastAPI backend nor the Next.js API routes implement rate limiting. This leaves the application vulnerable to abuse, especially for endpoints that make external API calls (NOAA, Google Maps, Anthropic).

**Recommendation:** Add rate limiting middleware (e.g., `slowapi` for FastAPI, or use Upstash Redis-based rate limiting).

---

### I-4: `ralph_monitor.RALPH_URL` Exposed in `/api` Info Endpoint

**File:** `backend/main.py:328`

The monitoring URL and project ID are returned in the public API info endpoint. While not a direct vulnerability, this leaks infrastructure details.

---

### I-5: No HTTPS Enforcement

The CORS configuration only includes `http://localhost:*` origins. In production, there's no enforcement of HTTPS connections. The `PRODUCTION_ORIGIN` environment variable should always use HTTPS.

---

## Architecture Notes

### Strengths
1. **Consistent API response format** — Dual-case support is implemented systematically
2. **Good error handling patterns** — Try/catch blocks with proper fallbacks throughout
3. **Clean separation of concerns** — Services, routers, middleware, and utilities are well-organized
4. **Path traversal protection** — The SPA handler correctly validates file paths (main.py:426-438)
5. **TypeScript strict mode** — Full type safety in the frontend
6. **Graceful degradation** — NOAA API failures fall back to mock data
7. **Redis caching strategy** — Appropriate TTLs for different data types

### Areas for Improvement
1. **Testing** — Very limited test coverage (only 3 test files in `/frontend/src/`)
2. **Authentication** — No auth mechanism for any endpoint
3. **Monitoring** — Ralph Agent integration is well-built but the monitoring itself has auth bypass
4. **Database** — Alembic is set up but no models are defined; database seems unused
5. **Documentation** — API docs via Swagger are good, but no architecture documentation

---

## Recommended Priority Actions

1. **Immediately**: Fix C-2 (HMAC bypass) by defaulting `verify_signature` to `return False` when no secret is configured
2. **Immediately**: Add authentication to research API endpoints (C-1, H-1)
3. **Short-term**: Fix blocking Redis calls (H-2) by switching to `redis.asyncio`
4. **Short-term**: Replace `datetime.utcnow()` with timezone-aware alternatives (H-3)
5. **Short-term**: Sanitize error responses in production (H-5)
6. **Medium-term**: Add rate limiting across all endpoints (I-3)
7. **Medium-term**: Add Content-Security-Policy header (M-5)
8. **Medium-term**: Add test coverage for core libraries (L-3)
