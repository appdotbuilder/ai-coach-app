
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, chatSessionsTable, chatMessagesTable } from '../db/schema';
import { type CreateChatMessageInput } from '../schema';
import { createChatMessage } from '../handlers/create_chat_message';
import { eq } from 'drizzle-orm';

describe('createChatMessage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a chat message', async () => {
    // Create prerequisite user and chat session
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const sessionResult = await db.insert(chatSessionsTable)
      .values({
        user_id: userResult[0].id,
        title: 'Test Chat Session',
        agent_type: 'general'
      })
      .returning()
      .execute();

    const testInput: CreateChatMessageInput = {
      session_id: sessionResult[0].id,
      role: 'user',
      content: 'Hello, this is a test message'
    };

    const result = await createChatMessage(testInput);

    // Basic field validation
    expect(result.session_id).toEqual(sessionResult[0].id);
    expect(result.role).toEqual('user');
    expect(result.content).toEqual('Hello, this is a test message');
    expect(result.metadata).toBeNull();
    expect(result.processed_by_llm).toBe(false);
    expect(result.id).toBeDefined();
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  it('should create a chat message with metadata', async () => {
    // Create prerequisite user and chat session
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const sessionResult = await db.insert(chatSessionsTable)
      .values({
        user_id: userResult[0].id,
        title: 'Test Chat Session',
        agent_type: 'general'
      })
      .returning()
      .execute();

    const testMetadata = {
      source: 'mobile_app',
      confidence: 0.95
    };

    const testInput: CreateChatMessageInput = {
      session_id: sessionResult[0].id,
      role: 'assistant',
      content: 'This is an AI response',
      metadata: testMetadata
    };

    const result = await createChatMessage(testInput);

    // Validate metadata handling
    expect(result.metadata).toEqual(testMetadata);
    expect(result.role).toEqual('assistant');
    expect(result.content).toEqual('This is an AI response');
  });

  it('should save chat message to database', async () => {
    // Create prerequisite user and chat session
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const sessionResult = await db.insert(chatSessionsTable)
      .values({
        user_id: userResult[0].id,
        title: 'Test Chat Session',
        agent_type: 'general'
      })
      .returning()
      .execute();

    const testInput: CreateChatMessageInput = {
      session_id: sessionResult[0].id,
      role: 'system',
      content: 'System initialization message'
    };

    const result = await createChatMessage(testInput);

    // Query database to verify persistence
    const messages = await db.select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.id, result.id))
      .execute();

    expect(messages).toHaveLength(1);
    expect(messages[0].session_id).toEqual(sessionResult[0].id);
    expect(messages[0].role).toEqual('system');
    expect(messages[0].content).toEqual('System initialization message');
    expect(messages[0].processed_by_llm).toBe(false);
    expect(messages[0].timestamp).toBeInstanceOf(Date);
  });

  it('should handle all message roles correctly', async () => {
    // Create prerequisite user and chat session
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const sessionResult = await db.insert(chatSessionsTable)
      .values({
        user_id: userResult[0].id,
        title: 'Test Chat Session',
        agent_type: 'nutrition'
      })
      .returning()
      .execute();

    const roles: Array<'user' | 'assistant' | 'system'> = ['user', 'assistant', 'system'];

    for (const role of roles) {
      const testInput: CreateChatMessageInput = {
        session_id: sessionResult[0].id,
        role: role,
        content: `Message from ${role}`
      };

      const result = await createChatMessage(testInput);
      expect(result.role).toEqual(role);
      expect(result.content).toEqual(`Message from ${role}`);
    }
  });
});
