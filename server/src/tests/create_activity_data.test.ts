
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { activityDataTable, usersTable } from '../db/schema';
import { type CreateActivityDataInput } from '../schema';
import { createActivityData } from '../handlers/create_activity_data';
import { eq } from 'drizzle-orm';

describe('createActivityData', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Create a test user for foreign key reference
  const createTestUser = async () => {
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    return userResult[0];
  };

  it('should create activity data with all fields', async () => {
    const user = await createTestUser();
    const testInput: CreateActivityDataInput = {
      user_id: user.id,
      date: new Date('2024-01-15'),
      activity_type: 'Running',
      duration_minutes: 30,
      intensity: 'high',
      calories_burned: 300.5,
      notes: 'Morning jog in the park',
      extracted_from_message_id: null
    };

    const result = await createActivityData(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(user.id);
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.activity_type).toEqual('Running');
    expect(result.duration_minutes).toEqual(30);
    expect(result.intensity).toEqual('high');
    expect(result.calories_burned).toEqual(300.5);
    expect(typeof result.calories_burned).toBe('number');
    expect(result.notes).toEqual('Morning jog in the park');
    expect(result.extracted_from_message_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create activity data with minimal required fields', async () => {
    const user = await createTestUser();
    const testInput: CreateActivityDataInput = {
      user_id: user.id,
      date: new Date('2024-01-15'),
      activity_type: 'Walking'
    };

    const result = await createActivityData(testInput);

    expect(result.user_id).toEqual(user.id);
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.activity_type).toEqual('Walking');
    expect(result.duration_minutes).toBeNull();
    expect(result.intensity).toBeNull();
    expect(result.calories_burned).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.extracted_from_message_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save activity data to database', async () => {
    const user = await createTestUser();
    const testInput: CreateActivityDataInput = {
      user_id: user.id,
      date: new Date('2024-01-15'),
      activity_type: 'Swimming',
      duration_minutes: 45,
      intensity: 'moderate',
      calories_burned: 450.25
    };

    const result = await createActivityData(testInput);

    // Query using proper drizzle syntax
    const activities = await db.select()
      .from(activityDataTable)
      .where(eq(activityDataTable.id, result.id))
      .execute();

    expect(activities).toHaveLength(1);
    const saved = activities[0];
    expect(saved.user_id).toEqual(user.id);
    expect(saved.date).toEqual('2024-01-15'); // Database stores as string
    expect(saved.activity_type).toEqual('Swimming');
    expect(saved.duration_minutes).toEqual(45);
    expect(saved.intensity).toEqual('moderate');
    expect(parseFloat(saved.calories_burned!)).toEqual(450.25);
    expect(saved.created_at).toBeInstanceOf(Date);
  });

  it('should handle calories_burned as null', async () => {
    const user = await createTestUser();
    const testInput: CreateActivityDataInput = {
      user_id: user.id,
      date: new Date('2024-01-15'),
      activity_type: 'Yoga',
      duration_minutes: 60,
      calories_burned: null
    };

    const result = await createActivityData(testInput);

    expect(result.calories_burned).toBeNull();

    // Verify in database
    const activities = await db.select()
      .from(activityDataTable)
      .where(eq(activityDataTable.id, result.id))
      .execute();

    expect(activities[0].calories_burned).toBeNull();
  });

  it('should handle zero calories_burned', async () => {
    const user = await createTestUser();
    const testInput: CreateActivityDataInput = {
      user_id: user.id,
      date: new Date('2024-01-15'),
      activity_type: 'Stretching',
      calories_burned: 0
    };

    const result = await createActivityData(testInput);

    expect(result.calories_burned).toEqual(0);
    expect(typeof result.calories_burned).toBe('number');

    // Verify in database
    const activities = await db.select()
      .from(activityDataTable)
      .where(eq(activityDataTable.id, result.id))
      .execute();

    expect(parseFloat(activities[0].calories_burned!)).toEqual(0);
  });

  it('should handle date conversion correctly', async () => {
    const user = await createTestUser();
    const inputDate = new Date('2024-03-20');
    const testInput: CreateActivityDataInput = {
      user_id: user.id,
      date: inputDate,
      activity_type: 'Cycling'
    };

    const result = await createActivityData(testInput);

    // Result should have Date object
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.toISOString().split('T')[0]).toEqual('2024-03-20');

    // Database should store as string
    const activities = await db.select()
      .from(activityDataTable)
      .where(eq(activityDataTable.id, result.id))
      .execute();

    expect(activities[0].date).toEqual('2024-03-20');
  });
});
