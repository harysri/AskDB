export function formatMessageTime(createdAt) {
  if (!createdAt) return undefined;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function mapMessage(doc) {
  return {
    id: doc.message_id,
    role: doc.role,
    type: doc.type || "text",
    content: doc.content || "",
    sql: doc.sql ?? null,
    headers: doc.headers ?? undefined,
    rows: doc.rows ?? undefined,
    recommendations: doc.recommendations ?? undefined,
    timestamp: formatMessageTime(doc.created_at),
  };
}

export function mapSession(s) {
  return {
    id: s.session_id,
    title: s.title,
    icon: "chat_bubble",
    connection_id: s.connection_id,
  };
}
