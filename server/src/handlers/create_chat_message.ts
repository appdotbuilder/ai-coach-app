
import { db } from '../db';
import { chatMessagesTable } from '../db/schema';
import { type CreateChatMessageInput, type ChatMessage } from '../schema';

export const createChatMessage = async (input: CreateChatMessageInput): Promise<ChatMessage> => {
  try {
    // Insert chat message record
    const result = await db.insert(chatMessagesTable)
      .values({
        session_id: input.session_id,
        role: input.role,
        content: input.content,
        metadata: input.metadata || null
      })
      .returning()
      .execute();

    const message = result[0];
    return {
      ...message,
      metadata: message.metadata as Record<string, any> | null
    };
  } catch (error) {
    console.error('Chat message creation failed:', error);
    throw error;
  }
};
