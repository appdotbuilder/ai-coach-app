
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, goalsTable } from '../db/schema';
import { type UpdateGoalInput, type CreateUserInput } from '../schema';
import { updateGoal } from '../handlers/update_goal';
import { eq } from 'drizzle-orm';

// Test user data
const testUser: CreateUserInput = {
  name: 'Test User',
  email: 'test@example.com'
};

// Base goal data for setup - use string dates for database insertion
const baseGoalData = {
  user_id: 1,
  category: 'fitness' as const,
  title: 'Original Goal',
  description: 'Original description',
  target_value: '100.50',
  target_unit: 'lbs',
  target_date: '2024-12-31', // String format for database
  status: 'active' as const,
  progress_percentage: '25.00',
  extracted_from_message_id: null
};

describe('updateGoal', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update goal status and progress', async () => {
    // Create user and goal
    await db.insert(usersTable).values(testUser).execute();
    const [createdGoal] = await db.insert(goalsTable)
      .values(baseGoalData)
      .returning()
      .execute();

    const updateInput: UpdateGoalInput = {
      id: createdGoal.id,
      status: 'completed',
      progress_percentage: 100
    };

    const result = await updateGoal(updateInput);

    expect(result.id).toEqual(createdGoal.id);
    expect(result.status).toEqual('completed');
    expect(result.progress_percentage).toEqual(100);
    expect(typeof result.progress_percentage).toBe('number');
    expect(result.title).toEqual('Original Goal'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update goal details', async () => {
    // Create user and goal
    await db.insert(usersTable).values(testUser).execute();
    const [createdGoal] = await db.insert(goalsTable)
      .values(baseGoalData)
      .returning()
      .execute();

    const updateInput: UpdateGoalInput = {
      id: createdGoal.id,
      title: 'Updated Goal Title',
      description: 'Updated description',
      target_value: 150.75,
      target_unit: 'kg'
    };

    const result = await updateGoal(updateInput);

    expect(result.id).toEqual(createdGoal.id);
    expect(result.title).toEqual('Updated Goal Title');
    expect(result.description).toEqual('Updated description');
    expect(result.target_value).toEqual(150.75);
    expect(typeof result.target_value).toBe('number');
    expect(result.target_unit).toEqual('kg');
    expect(result.status).toEqual('active'); // Unchanged
  });

  it('should update goal with null values', async () => {
    // Create user and goal
    await db.insert(usersTable).values(testUser).execute();
    const [createdGoal] = await db.insert(goalsTable)
      .values(baseGoalData)
      .returning()
      .execute();

    const updateInput: UpdateGoalInput = {
      id: createdGoal.id,
      description: null,
      target_value: null,
      target_unit: null,
      target_date: null
    };

    const result = await updateGoal(updateInput);

    expect(result.id).toEqual(createdGoal.id);
    expect(result.description).toBeNull();
    expect(result.target_value).toBeNull();
    expect(result.target_unit).toBeNull();
    expect(result.target_date).toBeNull();
    expect(result.title).toEqual('Original Goal'); // Unchanged
  });

  it('should save updated goal to database', async () => {
    // Create user and goal
    await db.insert(usersTable).values(testUser).execute();
    const [createdGoal] = await db.insert(goalsTable)
      .values(baseGoalData)
      .returning()
      .execute();

    const updateInput: UpdateGoalInput = {
      id: createdGoal.id,
      status: 'paused',
      progress_percentage: 75
    };

    await updateGoal(updateInput);

    // Verify in database
    const goals = await db.select()
      .from(goalsTable)
      .where(eq(goalsTable.id, createdGoal.id))
      .execute();

    expect(goals).toHaveLength(1);
    expect(goals[0].status).toEqual('paused');
    expect(parseFloat(goals[0].progress_percentage)).toEqual(75);
    expect(goals[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent goal', async () => {
    const updateInput: UpdateGoalInput = {
      id: 99999,
      status: 'completed'
    };

    await expect(updateGoal(updateInput)).rejects.toThrow(/Goal with id 99999 not found/i);
  });

  it('should handle partial updates correctly', async () => {
    // Create user and goal
    await db.insert(usersTable).values(testUser).execute();
    const [createdGoal] = await db.insert(goalsTable)
      .values(baseGoalData)
      .returning()
      .execute();

    const updateInput: UpdateGoalInput = {
      id: createdGoal.id,
      progress_percentage: 50
    };

    const result = await updateGoal(updateInput);

    // Only progress_percentage should be updated
    expect(result.progress_percentage).toEqual(50);
    expect(result.status).toEqual('active'); // Unchanged
    expect(result.title).toEqual('Original Goal'); // Unchanged
    expect(result.target_value).toEqual(100.5); // Unchanged
    expect(typeof result.target_value).toBe('number');
  });

  it('should update target_date correctly', async () => {
    // Create user and goal
    await db.insert(usersTable).values(testUser).execute();
    const [createdGoal] = await db.insert(goalsTable)
      .values(baseGoalData)
      .returning()
      .execute();

    const newTargetDate = new Date('2025-06-15');
    const updateInput: UpdateGoalInput = {
      id: createdGoal.id,
      target_date: newTargetDate
    };

    const result = await updateGoal(updateInput);

    expect(result.target_date).toBeInstanceOf(Date);
    expect(result.target_date?.getTime()).toEqual(newTargetDate.getTime());
  });
});
