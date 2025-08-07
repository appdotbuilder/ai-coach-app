
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, goalsTable, chatSessionsTable, chatMessagesTable } from '../db/schema';
import { type CreateGoalInput } from '../schema';
import { createGoal } from '../handlers/create_goal';
import { eq } from 'drizzle-orm';

describe('createGoal', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a basic goal', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const testInput: CreateGoalInput = {
      user_id: userId,
      category: 'fitness',
      title: 'Run 5K daily',
      description: 'Build running endurance',
      target_value: 5,
      target_unit: 'km',
      target_date: new Date('2024-12-31')
    };

    const result = await createGoal(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(userId);
    expect(result.category).toEqual('fitness');
    expect(result.title).toEqual('Run 5K daily');
    expect(result.description).toEqual('Build running endurance');
    expect(result.target_value).toEqual(5);
    expect(typeof result.target_value).toEqual('number');
    expect(result.target_unit).toEqual('km');
    expect(result.target_date).toBeInstanceOf(Date);
    expect(result.status).toEqual('active');
    expect(result.progress_percentage).toEqual(0);
    expect(typeof result.progress_percentage).toEqual('number');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create goal with minimal required fields', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const minimalInput: CreateGoalInput = {
      user_id: userId,
      category: 'wellness',
      title: 'Meditate daily'
    };

    const result = await createGoal(minimalInput);

    expect(result.user_id).toEqual(userId);
    expect(result.category).toEqual('wellness');
    expect(result.title).toEqual('Meditate daily');
    expect(result.description).toBeNull();
    expect(result.target_value).toBeNull();
    expect(result.target_unit).toBeNull();
    expect(result.target_date).toBeNull();
    expect(result.status).toEqual('active');
    expect(result.progress_percentage).toEqual(0);
    expect(result.extracted_from_message_id).toBeNull();
  });

  it('should create goal extracted from chat message', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const sessionResult = await db.insert(chatSessionsTable)
      .values({
        user_id: userId,
        agent_type: 'goal_setting'
      })
      .returning()
      .execute();
    const sessionId = sessionResult[0].id;

    const messageResult = await db.insert(chatMessagesTable)
      .values({
        session_id: sessionId,
        role: 'user',
        content: 'I want to lose 10 pounds by summer'
      })
      .returning()
      .execute();
    const messageId = messageResult[0].id;

    const testInput: CreateGoalInput = {
      user_id: userId,
      category: 'fitness',
      title: 'Lose weight',
      description: 'Summer weight loss goal',
      target_value: 10,
      target_unit: 'pounds',
      target_date: new Date('2024-06-21'),
      extracted_from_message_id: messageId
    };

    const result = await createGoal(testInput);

    expect(result.extracted_from_message_id).toEqual(messageId);
    expect(result.target_value).toEqual(10);
    expect(result.target_unit).toEqual('pounds');
  });

  it('should save goal to database', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const testInput: CreateGoalInput = {
      user_id: userId,
      category: 'nutrition',
      title: 'Eat more vegetables',
      target_value: 5,
      target_unit: 'servings per day'
    };

    const result = await createGoal(testInput);

    // Query database to verify goal was saved
    const goals = await db.select()
      .from(goalsTable)
      .where(eq(goalsTable.id, result.id))
      .execute();

    expect(goals).toHaveLength(1);
    expect(goals[0].title).toEqual('Eat more vegetables');
    expect(goals[0].category).toEqual('nutrition');
    expect(parseFloat(goals[0].target_value!)).toEqual(5);
    expect(goals[0].target_unit).toEqual('servings per day');
    expect(goals[0].status).toEqual('active');
    expect(parseFloat(goals[0].progress_percentage)).toEqual(0);
    expect(goals[0].created_at).toBeInstanceOf(Date);
    expect(goals[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle all goal categories', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const categories = ['fitness', 'nutrition', 'wellness', 'sleep', 'personal'] as const;

    for (const category of categories) {
      const testInput: CreateGoalInput = {
        user_id: userId,
        category: category,
        title: `${category} goal`
      };

      const result = await createGoal(testInput);
      expect(result.category).toEqual(category);
      expect(result.title).toEqual(`${category} goal`);
    }
  });

  it('should reject invalid user_id', async () => {
    const testInput: CreateGoalInput = {
      user_id: 99999, // Non-existent user ID
      category: 'fitness',
      title: 'Invalid user goal'
    };

    await expect(createGoal(testInput)).rejects.toThrow(/foreign key constraint/i);
  });
});
