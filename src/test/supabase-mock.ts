import { vi } from 'vitest'

type Result = { data?: unknown; error?: { message: string } | null }
type Op     = [method: string, args: unknown[]]

export type QueryCall = { table: string; ops: Op[] }

// A stand-in for a Supabase client. Every `.from(table)` returns a chainable
// builder that records its method calls and, when awaited, resolves to the
// next result queued for that table (or `{ data: null, error: null }`).
export function createSupabaseMock() {
  const queues  = new Map<string, Result[]>()
  const queries: QueryCall[] = []

  function from(table: string) {
    const call: QueryCall = { table, ops: [] }
    queries.push(call)
    const result = queues.get(table)?.shift() ?? { data: null, error: null }

    const builder: Record<string, unknown> = new Proxy({}, {
      get(_, prop: string) {
        if (prop === 'then') {
          return (resolve: (r: Result) => unknown, reject: (e: unknown) => unknown) =>
            Promise.resolve({ data: null, error: null, ...result }).then(resolve, reject)
        }
        return (...args: unknown[]) => {
          call.ops.push([prop, args])
          return builder
        }
      },
    })
    return builder
  }

  const auth = {
    getUser:               vi.fn(async () => ({ data: { user: null as unknown } })),
    signUp:                vi.fn(async (_: unknown) => ({ data: { user: null, session: null as unknown }, error: null as { message: string } | null })),
    signInWithPassword:    vi.fn(async (_: unknown) => ({ data: {}, error: null as { message: string } | null })),
    signOut:               vi.fn(async () => ({ error: null })),
    exchangeCodeForSession: vi.fn(async (_: string) => ({ data: {}, error: null as { message: string } | null })),
    verifyOtp:             vi.fn(async (_: unknown) => ({ data: {}, error: null as { message: string } | null })),
  }

  return {
    from,
    auth,
    // Queue results for the next `.from(table)` calls, in order.
    queue(table: string, ...results: Result[]) {
      queues.set(table, [...(queues.get(table) ?? []), ...results])
    },
    // Recorded calls for one table, in the order they were made.
    calls(table: string) {
      return queries.filter(q => q.table === table)
    },
    signedInAs(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) {
      auth.getUser.mockResolvedValue({ data: { user } })
    },
    reset() {
      queues.clear()
      queries.length = 0
      Object.values(auth).forEach(fn => fn.mockClear())
      auth.getUser.mockResolvedValue({ data: { user: null } })
    },
  }
}

export type SupabaseMock = ReturnType<typeof createSupabaseMock>

// Shared instances that test files wire into the client modules with vi.mock:
// `supabase` stands in for the cookie-based user client, `service` for the
// service-role client.
export const supabase = createSupabaseMock()
export const service  = createSupabaseMock()

// Mirrors next/navigation's redirect(), which throws to stop rendering.
export class RedirectError extends Error {
  constructor(public url: string) {
    super(`NEXT_REDIRECT:${url}`)
  }
}

export function opsOf(call: QueryCall | undefined, method: string) {
  return (call?.ops ?? []).filter(([m]) => m === method).map(([, args]) => args)
}
