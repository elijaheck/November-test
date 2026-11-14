import { execFile } from 'node:child_process'
import { access } from 'node:fs/promises'

/** Thrown when macOS refuses the read: the app lacks Full Disk Access. */
export class NoAccessError extends Error {}

const SQLITE = '/usr/bin/sqlite3'

/**
 * Runs one read-only query through macOS's own sqlite3 and returns its rows.
 * The CLI ships with every Mac, so no native module has to match Electron.
 */
export async function queryRows<T>(dbPath: string, sql: string): Promise<T[]> {
  try {
    await access(dbPath)
  } catch (err) {
    const code = (err as { code?: string }).code

    if (code === 'EPERM' || code === 'EACCES') throw new NoAccessError(dbPath)
    throw err
  }

  return new Promise((resolve, reject) => {
    execFile(
      SQLITE,
      ['-readonly', '-json', `file:${dbPath}?mode=ro`, sql],
      { maxBuffer: 32 * 1024 * 1024, timeout: 15_000 },
      (err, stdout, stderr) => {
        if (err) {
          const text = `${stderr} ${err.message}`

          if (/authorization denied|unable to open|operation not permitted/i.test(text)) {
            reject(new NoAccessError(dbPath))
          } else {
            reject(new Error(stderr.trim() || err.message))
          }

          return
        }
        const out = stdout.trim()

        resolve(out === '' ? [] : (JSON.parse(out) as T[]))
      },
    )
  })
}
