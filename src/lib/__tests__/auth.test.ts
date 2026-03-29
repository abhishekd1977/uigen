// @vitest-environment node
import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockSet = vi.fn();
const mockGet = vi.fn();
const mockDelete = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      set: mockSet,
      get: mockGet,
      delete: mockDelete,
    })
  ),
}));

import { createSession } from "@/lib/auth";

describe("createSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  test("sets an httpOnly cookie with the correct name", async () => {
    await createSession("user-1", "test@example.com");

    expect(mockSet).toHaveBeenCalledOnce();
    const [name, token, options] = mockSet.mock.calls[0];
    expect(name).toBe("auth-token");
    expect(typeof token).toBe("string");
    expect(options.httpOnly).toBe(true);
  });

  test("sets cookie with 7-day expiry", async () => {
    await createSession("user-1", "test@example.com");

    const [, , options] = mockSet.mock.calls[0];
    const expectedExpiry = new Date("2026-01-08T00:00:00Z");
    expect(options.expires).toEqual(expectedExpiry);
  });

  test("sets sameSite to lax and path to /", async () => {
    await createSession("user-1", "test@example.com");

    const [, , options] = mockSet.mock.calls[0];
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });

  test("sets secure flag based on NODE_ENV", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await createSession("user-1", "test@example.com");
    expect(mockSet.mock.calls[0][2].secure).toBe(true);

    mockSet.mockClear();

    vi.stubEnv("NODE_ENV", "test");
    await createSession("user-1", "test@example.com");
    expect(mockSet.mock.calls[0][2].secure).toBe(false);

    vi.unstubAllEnvs();
  });

  test("generates a valid JWT token", async () => {
    const { jwtVerify } = await import("jose");

    await createSession("user-1", "test@example.com");

    const token = mockSet.mock.calls[0][1];
    const secret = new TextEncoder().encode("development-secret-key");
    const { payload } = await jwtVerify(token, secret);

    expect(payload.userId).toBe("user-1");
    expect(payload.email).toBe("test@example.com");
  });
});