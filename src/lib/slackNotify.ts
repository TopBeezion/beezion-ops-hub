/**
 * Send a Slack DM notification via the N8N webhook proxy.
 * The N8N workflow looks up the Slack user ID and sends a DM
 * using the "Slack account 3" (Beezion Ops Hub bot) credential.
 */

const WEBHOOK_URL = (import.meta.env.VITE_N8N_SLACK_NOTIFY_URL as string | undefined)
  || 'https://topbeezion.app.n8n.cloud/webhook/ops-hub-slack-notify'

export async function sendSlackDM(payload: {
  recipientName: string
  message: string
  taskId?: string
  taskTitle?: string
  type: 'mention' | 'status_change'
}) {
  if (!WEBHOOK_URL) {
    console.warn('[SlackNotify] VITE_N8N_SLACK_NOTIFY_URL not set, skipping')
    return
  }

  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.error('[SlackNotify] Failed to send DM:', err)
  }
}

/**
 * Send mention notifications to multiple people.
 */
export async function notifyMentions(params: {
  mentions: string[]
  author: string
  taskId: string
  taskTitle: string
  commentPreview: string
}) {
  const { mentions, author, taskId, taskTitle, commentPreview } = params
  const preview = commentPreview.length > 100 ? commentPreview.slice(0, 100) + '...' : commentPreview

  await Promise.allSettled(
    mentions.map(name =>
      sendSlackDM({
        recipientName: name,
        message: `💬 @${author} te mencionó en la tarea "${taskTitle}":\n"${preview}"`,
        taskId,
        taskTitle,
        type: 'mention',
      })
    )
  )
}

/**
 * Notify supervisors about a status change.
 */
export async function notifyStatusChange(params: {
  supervisors: string[]
  taskId: string
  taskTitle: string
  oldStatus: string
  newStatus: string
  changedBy: string
}) {
  const { supervisors, taskId, taskTitle, oldStatus, newStatus, changedBy } = params

  await Promise.allSettled(
    supervisors.map(name =>
      sendSlackDM({
        recipientName: name,
        message: `🔄 La tarea "${taskTitle}" cambió de *${oldStatus}* → *${newStatus}* (por ${changedBy})`,
        taskId,
        taskTitle,
        type: 'status_change',
      })
    )
  )
}
