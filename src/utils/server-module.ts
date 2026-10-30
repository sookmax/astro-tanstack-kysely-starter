// Import this first in any module that must never reach the client bundle (it
// imports `pg`, reads secrets, …). If one slips into a client import graph, the
// browser fails loudly here instead of with "Buffer is not defined".
//
// `typeof window` rather than `import.meta.env.SSR`: the better-auth CLI and
// the migrate script load server modules in plain Node, where import.meta.env
// doesn't exist.
if (typeof window !== "undefined") {
  throw new Error("Cannot import a server module from the client");
}
