
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, chatSessionsTable } from '../db/schema';
import { type CreateUserInput, type CreateChatSessionInput } from '../schema';
import { getChatSessions } from '../handlers/get_chat_sessions';

// Test inputs
const testUserInput: CreateUserInput = {
  name: 'Test User',
  email: 'test@example.com'
};

const testSessionInput: CreateChatSessionInput = {
  user_id: 1, // Will be updated with actual user id
  title: 'Test Session',
  agent_type: 'general',
  context_data: { test: 'data' }
};

describe('getChatSessions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no chat sessions', async () => {
    // Create user directly in database
    const userResult = await db.insert(usersTable)
      .values({
        name: testUserInput.name,
        email: testUserInput.email
      })
      .returning()
      .execute();

    const user = userResult[0];

    const result = await getChatSessions(user.id);

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all chat sessions for a user', async () => {
    // Create user directly in database
    const userResult = await db.insert(usersTable)
      .values({
        name: testUserInput.name,
        email: testUserInput.email
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create first session
    const firstTimestamp = new Date('2024-01-01T10:00:00Z');
    await db.insert(chatSessionsTable)
      .values({
        user_id: user.id,
        title: 'First Session',
        agent_type: 'general',
        context_data: { test: 'data1' },
        started_at: firstTimestamp
      })
      .execute();

    // Create second session with later timestamp
    const secondTimestamp = new Date('2024-01-01T11:00:00Z');
    await db.insert(chatSessionsTable)
      .values({
        user_id: user.id,
        title: 'Second Session',
        agent_type: 'fitness',
        context_data: { test: 'data2' },
        started_at: secondTimestamp
      })
      .execute();

    const result = await getChatSessions(user.id);

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Second Session'); // Most recent first
    expect(result[1].title).toEqual('First Session');
    expect(result[0].agent_type).toEqual('fitness');
    expect(result[1].agent_type).toEqual('general');
    expect(result[0].user_id).toEqual(user.id);
    expect(result[1].user_id).toEqual(user.id);
  });

  it('should only return sessions for the specified user', async () => {
    // Create two users
    const usersResult = await db.insert(usersTable)
      .values([
        {
          name: 'User One',
          email: 'user1@example.com'
        },
        {
          name: 'User Two',
          email: 'user2@example.com'
        }
      ])
      .returning()
      .execute();

    const user1 = usersResult[0];
    const user2 = usersResult[1];

    // Create sessions for both users
    await db.insert(chatSessionsTable)
      .values([
        {
          user_id: user1.id,
          title: 'User 1 Session',
          agent_type: 'nutrition'
        },
        {
          user_id: user2.id,
          title: 'User 2 Session',
          agent_type: 'wellness'
        }
      ])
      .execute();

    // Get sessions for user1 only
    const result = await getChatSessions(user1.id);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('User 1 Session');
    expect(result[0].user_id).toEqual(user1.id);
    expect(result[0].agent_type).toEqual('nutrition');
  });

  it('should return sessions ordered by started_at descending', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        name: testUserInput.name,
        email: testUserInput.email
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create sessions with different timestamps manually
    const oldTimestamp = new Date('2024-01-01T10:00:00Z');
    const newTimestamp = new Date('2024-01-02T10:00:00Z');

    await db.insert(chatSessionsTable)
      .values([
        {
          user_id: user.id,
          title: 'Oldest Session',
          agent_type: 'general',
          started_at: oldTimestamp
        },
        {
          user_id: user.id,
          title: 'Newest Session',
          agent_type: 'fitness',
          started_at: newTimestamp
        }
      ])
      .execute();

    const result = await getChatSessions(user.id);

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Newest Session');
    expect(result[1].title).toEqual('Oldest Session');
    expect(result[0].started_at >= result[1].started_at).toBe(true);
  });

  it('should handle user with nonexistent id gracefully', async () => {
    const result = await getChatSessions(999999);

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should handle sessions with null context_data', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        name: testUserInput.name,
        email: testUserInput.email
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create session with null context_data
    await db.insert(chatSessionsTable)
      .values({
        user_id: user.id,
        title: 'Session with null context',
        agent_type: 'general',
        context_data: null
      })
      .execute();

    const result = await getChatSessions(user.id);

    expect(result).toHaveLength(1);
    expect(result[0].context_data).toBeNull();
    expect(result[0].title).toEqual('Session with null context');
  });
});
