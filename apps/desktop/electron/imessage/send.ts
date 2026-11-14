import { execFile } from 'node:child_process'

// Text and target arrive as argv, never spliced into the script.
const TO_CHAT = `on run argv
  tell application "Messages" to send (item 1 of argv) to chat id (item 2 of argv)
end run`

const TO_BUDDY = `on run argv
  tell application "Messages"
    set svc to 1st account whose service type = iMessage
    send (item 1 of argv) to participant (item 2 of argv) of svc
  end tell
end run`

function osascript(script: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      '/usr/bin/osascript',
      ['-e', script, ...args],
      { timeout: 20_000 },
      (err, _o, stderr) => (err ? reject(new Error(stderr.trim() || err.message)) : resolve()),
    )
  })
}

/**
 * Sends through Messages.app, so it goes out as the user, from their Apple ID.
 * The first send makes macOS ask to let this app control Messages. A 1:1 chat
 * falls back to the person's handle when its chat id is not addressable.
 */
export async function sendIMessage(guid: string, text: string, handle?: string): Promise<void> {
  try {
    await osascript(TO_CHAT, [text, guid])
  } catch (err) {
    if (!handle) throw err
    await osascript(TO_BUDDY, [text, handle])
  }
}
