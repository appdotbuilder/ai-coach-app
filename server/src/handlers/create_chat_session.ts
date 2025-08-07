
import { db } from '../db';
import { chatSessionsTable } from '../db/schema';
import { type CreateChatSessionInput, type ChatSession } from '../schema';

export const createChatSession = async (input: CreateChatSessionInput): Promise<ChatSession> => {
  try {
    // Insert chat session record
    const result = await db.insert(chatSessionsTable)
      .values({
        user_id: input.user_id,
        title: input.title || null,
        agent_type: input.agent_type,
        context_data: input.context_data || null
      })
      .returning()
      .execute();

    const session = result[0];
    return {
      ...session,
      context_data: session.context_data as Record<string, any> | null
    };
  } catch (error) {
    console.error('Chat session creation failed:', error);
    throw error;
  }
};
