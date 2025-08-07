
import { db } from '../db';
import { chatSessionsTable } from '../db/schema';
import { type ChatSession } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getChatSessions = async (userId: number): Promise<ChatSession[]> => {
  try {
    const results = await db.select()
      .from(chatSessionsTable)
      .where(eq(chatSessionsTable.user_id, userId))
      .orderBy(desc(chatSessionsTable.started_at))
      .execute();

    // Transform the results to match the expected schema types
    return results.map(result => ({
      ...result,
      context_data: result.context_data as Record<string, any> | null
    }));
  } catch (error) {
    console.error('Failed to get chat sessions:', error);
    throw error;
  }
};
