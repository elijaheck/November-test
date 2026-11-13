import { useState } from 'react'

import { BotTaskMode } from './BotTaskMode'
import { IMessageConversation } from './IMessageConversation'
import { selectIMessageChat, useSelectedIMessageChat } from './imessageSelection'
import { WorkspaceDockPanels } from './WorkspaceDockPanels'
import { WorkspaceRightRail } from './WorkspaceRightRail'
import { WorkspaceSessionPane } from './WorkspaceSessionPane'

import type { WorkspaceController } from './useWorkspaceController'
import type { UserInfo } from '../../types'

/** Temporary Bot work covers the conversation without changing its dock or navigation. */
export function WorkspaceConversationSurface({
  ws,
  user,
}: {
  ws: WorkspaceController
  user: UserInfo
}) {
  const [taskSessionId, setTaskSessionId] = useState<string | null>(null)
  const surfaceKey = `${ws.scope?.teamId ?? ''}:${ws.selectedSessionId ?? ''}:${ws.mainPageOpen}`
  const [seededSurfaceKey, setSeededSurfaceKey] = useState(surfaceKey)
  const imessage = useSelectedIMessageChat()

  if (seededSurfaceKey !== surfaceKey) {
    setSeededSurfaceKey(surfaceKey)
    setTaskSessionId(null)
    // Opening a bot, task or page leaves the iMessage conversation.
    selectIMessageChat(null)
  }
  const taskOpen = Boolean(taskSessionId) && !ws.mainPageOpen

  return (
    <div className="relative flex flex-1 min-h-0 min-w-0 overflow-hidden">
      <div className="flex flex-1 min-h-0 min-w-0" inert={taskOpen}>
        {imessage && !ws.mainPageOpen ? (
          <IMessageConversation key={imessage} guid={imessage} />
        ) : (
          <WorkspaceSessionPane
            ws={ws}
            user={user}
            workspaceExpanded={ws.workspaceDockExpanded || ws.mainPageOpen}
            onOpenTask={setTaskSessionId}
          />
        )}
        <WorkspaceDockPanels ws={ws} user={user} />
        {!ws.mainPageOpen && <WorkspaceRightRail ws={ws} />}
      </div>
      {taskOpen && taskSessionId && ws.scope?.teamId && (
        <BotTaskMode
          ws={ws}
          user={user}
          teamId={ws.scope.teamId}
          sessionId={taskSessionId}
          onSessionChange={setTaskSessionId}
          onBack={() => setTaskSessionId(null)}
        />
      )}
    </div>
  )
}
