
import { db } from '../db';
import { chatMessagesTable } from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import { type ChatMessage } from '../schema';

export async function getChatMessages(sessionId: number): Promise<ChatMessage[]> {
  try {
    const results = await db.select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.session_id, sessionId))
      .orderBy(asc(chatMessagesTable.timestamp))
      .execute();

    return results.map(message => ({
      ...message,
      metadata: message.metadata as Record<string, any> | null
    }));
  } catch (error) {
    console.error('Failed to get chat messages:', error);
    throw error;
  }
}
