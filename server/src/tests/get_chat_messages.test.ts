
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, chatSessionsTable, chatMessagesTable } from '../db/schema';
import { getChatMessages } from '../handlers/get_chat_messages';

describe('getChatMessages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for session with no messages', async () => {
    // Create user and session first
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
        title: 'Test Session',
        agent_type: 'general'
      })
      .returning()
      .execute();

    const messages = await getChatMessages(sessionResult[0].id);

    expect(messages).toEqual([]);
  });

  it('should return messages for a session in chronological order', async () => {
    // Create user and session
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
        title: 'Test Session',
        agent_type: 'general'
      })
      .returning()
      .execute();

    // Create messages with different timestamps
    const now = new Date();
    const earlier = new Date(now.getTime() - 60000); // 1 minute earlier
    const later = new Date(now.getTime() + 60000); // 1 minute later

    await db.insert(chatMessagesTable)
      .values([
        {
          session_id: sessionResult[0].id,
          role: 'assistant',
          content: 'Third message',
          timestamp: later
        },
        {
          session_id: sessionResult[0].id,
          role: 'user',
          content: 'First message',
          timestamp: earlier
        },
        {
          session_id: sessionResult[0].id,
          role: 'assistant',
          content: 'Second message',
          timestamp: now
        }
      ])
      .execute();

    const messages = await getChatMessages(sessionResult[0].id);

    expect(messages).toHaveLength(3);
    expect(messages[0].content).toEqual('First message');
    expect(messages[0].role).toEqual('user');
    expect(messages[1].content).toEqual('Second message');
    expect(messages[1].role).toEqual('assistant');
    expect(messages[2].content).toEqual('Third message');
    expect(messages[2].role).toEqual('assistant');

    // Verify chronological order
    expect(messages[0].timestamp < messages[1].timestamp).toBe(true);
    expect(messages[1].timestamp < messages[2].timestamp).toBe(true);
  });

  it('should only return messages for the specified session', async () => {
    // Create user and two sessions
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const session1Result = await db.insert(chatSessionsTable)
      .values({
        user_id: userResult[0].id,
        title: 'Session 1',
        agent_type: 'general'
      })
      .returning()
      .execute();

    const session2Result = await db.insert(chatSessionsTable)
      .values({
        user_id: userResult[0].id,
        title: 'Session 2',
        agent_type: 'fitness'
      })
      .returning()
      .execute();

    // Create messages in both sessions
    await db.insert(chatMessagesTable)
      .values([
        {
          session_id: session1Result[0].id,
          role: 'user',
          content: 'Message in session 1'
        },
        {
          session_id: session2Result[0].id,
          role: 'user',
          content: 'Message in session 2'
        },
        {
          session_id: session1Result[0].id,
          role: 'assistant',
          content: 'Another message in session 1'
        }
      ])
      .execute();

    const session1Messages = await getChatMessages(session1Result[0].id);
    const session2Messages = await getChatMessages(session2Result[0].id);

    expect(session1Messages).toHaveLength(2);
    expect(session2Messages).toHaveLength(1);

    // Verify content is correct
    expect(session1Messages[0].content).toEqual('Message in session 1');
    expect(session1Messages[1].content).toEqual('Another message in session 1');
    expect(session2Messages[0].content).toEqual('Message in session 2');

    // Verify session IDs are correct
    session1Messages.forEach(msg => {
      expect(msg.session_id).toEqual(session1Result[0].id);
    });

    session2Messages.forEach(msg => {
      expect(msg.session_id).toEqual(session2Result[0].id);
    });
  });

  it('should include all message fields and metadata', async () => {
    // Create user and session
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
        title: 'Test Session',
        agent_type: 'general'
      })
      .returning()
      .execute();

    // Create message with metadata
    await db.insert(chatMessagesTable)
      .values({
        session_id: sessionResult[0].id,
        role: 'user',
        content: 'Test message with metadata',
        metadata: { intent: 'question', confidence: 0.95 },
        processed_by_llm: true
      })
      .execute();

    const messages = await getChatMessages(sessionResult[0].id);

    expect(messages).toHaveLength(1);
    const message = messages[0];

    expect(message.id).toBeDefined();
    expect(message.session_id).toEqual(sessionResult[0].id);
    expect(message.role).toEqual('user');
    expect(message.content).toEqual('Test message with metadata');
    expect(message.metadata).toEqual({ intent: 'question', confidence: 0.95 });
    expect(message.timestamp).toBeInstanceOf(Date);
    expect(message.processed_by_llm).toBe(true);
  });
});
