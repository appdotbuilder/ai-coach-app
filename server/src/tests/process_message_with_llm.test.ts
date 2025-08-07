
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, chatSessionsTable, chatMessagesTable, llmAnalysisTable } from '../db/schema';
import { type ProcessMessageWithLlmInput } from '../schema';
import { processMessageWithLlm } from '../handlers/process_message_with_llm';
import { eq } from 'drizzle-orm';

describe('processMessageWithLlm', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testSessionId: number;
  let testMessageId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test chat session
    const sessionResult = await db.insert(chatSessionsTable)
      .values({
        user_id: testUserId,
        title: 'Test Session',
        agent_type: 'fitness'
      })
      .returning()
      .execute();
    testSessionId = sessionResult[0].id;

    // Create test chat message
    const messageResult = await db.insert(chatMessagesTable)
      .values({
        session_id: testSessionId,
        role: 'user',
        content: 'I went for a 30 minute run today'
      })
      .returning()
      .execute();
    testMessageId = messageResult[0].id;
  });

  it('should process message with data extraction analysis', async () => {
    const input: ProcessMessageWithLlmInput = {
      message_id: testMessageId,
      model_name: 'gemini-pro',
      analysis_type: 'data_extraction'
    };

    const result = await processMessageWithLlm(input);

    expect(result.message_id).toEqual(testMessageId);
    expect(result.model_used).toEqual('gemini-pro');
    expect(result.analysis_type).toEqual('data_extraction');
    expect(result.extracted_data).toEqual({
      activity: {
        type: 'running',
        duration: 30,
        intensity: 'moderate'
      }
    });
    expect(result.confidence_score).toEqual(0.85);
    expect(result.id).toBeDefined();
    expect(result.processed_at).toBeInstanceOf(Date);
  });

  it('should process message with recommendation analysis', async () => {
    const input: ProcessMessageWithLlmInput = {
      message_id: testMessageId,
      model_name: 'gpt-4',
      analysis_type: 'recommendation'
    };

    const result = await processMessageWithLlm(input);

    expect(result.analysis_type).toEqual('recommendation');
    expect(result.recommendations).toEqual([
      'Consider increasing workout intensity gradually',
      'Stay hydrated during exercise'
    ]);
    expect(result.confidence_score).toEqual(0.78);
    expect(result.extracted_data).toBeNull();
    expect(result.insights).toBeNull();
  });

  it('should process message with insight generation analysis', async () => {
    const input: ProcessMessageWithLlmInput = {
      message_id: testMessageId,
      model_name: 'claude-3',
      analysis_type: 'insight_generation'
    };

    const result = await processMessageWithLlm(input);

    expect(result.analysis_type).toEqual('insight_generation');
    expect(result.insights).toEqual('User shows consistent exercise patterns with room for improvement in duration');
    expect(result.confidence_score).toEqual(0.82);
    expect(result.extracted_data).toBeNull();
    expect(result.recommendations).toBeNull();
  });

  it('should process message with goal tracking analysis', async () => {
    const input: ProcessMessageWithLlmInput = {
      message_id: testMessageId,
      model_name: 'gemini-pro',
      analysis_type: 'goal_tracking'
    };

    const result = await processMessageWithLlm(input);

    expect(result.analysis_type).toEqual('goal_tracking');
    expect(result.extracted_data).toEqual({
      progress: {
        current_value: 15,
        target_value: 30,
        percentage: 50
      }
    });
    expect(result.insights).toEqual('User is 50% towards their fitness goal');
    expect(result.confidence_score).toEqual(0.90);
    expect(result.recommendations).toBeNull();
  });

  it('should save analysis to database', async () => {
    const input: ProcessMessageWithLlmInput = {
      message_id: testMessageId,
      model_name: 'gemini-pro',
      analysis_type: 'data_extraction'
    };

    const result = await processMessageWithLlm(input);

    const analyses = await db.select()
      .from(llmAnalysisTable)
      .where(eq(llmAnalysisTable.id, result.id))
      .execute();

    expect(analyses).toHaveLength(1);
    expect(analyses[0].message_id).toEqual(testMessageId);
    expect(analyses[0].model_used).toEqual('gemini-pro');
    expect(analyses[0].analysis_type).toEqual('data_extraction');
    expect(parseFloat(analyses[0].confidence_score!)).toEqual(0.85);
    expect(analyses[0].processed_at).toBeInstanceOf(Date);
  });

  it('should handle numeric conversion correctly', async () => {
    const input: ProcessMessageWithLlmInput = {
      message_id: testMessageId,
      model_name: 'test-model',
      analysis_type: 'recommendation'
    };

    const result = await processMessageWithLlm(input);

    expect(typeof result.confidence_score).toBe('number');
    expect(result.confidence_score).toEqual(0.78);
  });

  it('should throw error for non-existent message', async () => {
    const input: ProcessMessageWithLlmInput = {
      message_id: 99999,
      model_name: 'gemini-pro',
      analysis_type: 'data_extraction'
    };

    await expect(processMessageWithLlm(input)).rejects.toThrow(/Message with id 99999 not found/i);
  });
});
