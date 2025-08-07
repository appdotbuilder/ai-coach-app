
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, chatSessionsTable } from '../db/schema';
import { type CreateChatSessionInput } from '../schema';
import { createChatSession } from '../handlers/create_chat_session';
import { eq } from 'drizzle-orm';

describe('createChatSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;

  beforeEach(async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;
  });

  const testInput: CreateChatSessionInput = {
    user_id: 0, // Will be set in beforeEach
    agent_type: 'general',
    title: 'Test Chat Session',
    context_data: { theme: 'health', preferences: ['nutrition'] }
  };

  it('should create a chat session with all fields', async () => {
    const input = { ...testInput, user_id: testUserId };
    const result = await createChatSession(input);

    // Basic field validation
    expect(result.user_id).toEqual(testUserId);
    expect(result.title).toEqual('Test Chat Session');
    expect(result.agent_type).toEqual('general');
    expect(result.context_data).toEqual({ theme: 'health', preferences: ['nutrition'] });
    expect(result.id).toBeDefined();
    expect(result.started_at).toBeInstanceOf(Date);
    expect(result.ended_at).toBeNull();
  });

  it('should create a chat session with minimal fields', async () => {
    const minimalInput: CreateChatSessionInput = {
      user_id: testUserId,
      agent_type: 'fitness'
    };

    const result = await createChatSession(minimalInput);

    expect(result.user_id).toEqual(testUserId);
    expect(result.agent_type).toEqual('fitness');
    expect(result.title).toBeNull();
    expect(result.context_data).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.started_at).toBeInstanceOf(Date);
    expect(result.ended_at).toBeNull();
  });

  it('should save chat session to database', async () => {
    const input = { ...testInput, user_id: testUserId };
    const result = await createChatSession(input);

    // Query using proper drizzle syntax
    const sessions = await db.select()
      .from(chatSessionsTable)
      .where(eq(chatSessionsTable.id, result.id))
      .execute();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].user_id).toEqual(testUserId);
    expect(sessions[0].title).toEqual('Test Chat Session');
    expect(sessions[0].agent_type).toEqual('general');
    expect(sessions[0].context_data).toEqual({ theme: 'health', preferences: ['nutrition'] });
    expect(sessions[0].started_at).toBeInstanceOf(Date);
  });

  it('should handle different agent types', async () => {
    const agentTypes = ['general', 'nutrition', 'fitness', 'wellness', 'goal_setting', 'analysis'] as const;
    
    for (const agentType of agentTypes) {
      const input: CreateChatSessionInput = {
        user_id: testUserId,
        agent_type: agentType
      };

      const result = await createChatSession(input);
      expect(result.agent_type).toEqual(agentType);
    }
  });

  it('should throw error for non-existent user', async () => {
    const invalidInput: CreateChatSessionInput = {
      user_id: 99999, // Non-existent user
      agent_type: 'general'
    };

    expect(createChatSession(invalidInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
