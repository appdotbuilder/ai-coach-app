
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, activityDataTable } from '../db/schema';
import { getActivityData } from '../handlers/get_activity_data';
import { eq } from 'drizzle-orm';

describe('getActivityData', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no activity data exists for user', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;
    const result = await getActivityData(userId);

    expect(result).toEqual([]);
  });

  it('should return all activity data for a specific user', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create activity data for the user
    await db.insert(activityDataTable)
      .values([
        {
          user_id: userId,
          date: '2024-01-15',
          activity_type: 'Running',
          duration_minutes: 30,
          intensity: 'moderate',
          calories_burned: '250.5',
          notes: 'Morning run'
        },
        {
          user_id: userId,
          date: '2024-01-16',
          activity_type: 'Cycling',
          duration_minutes: 45,
          intensity: 'high',
          calories_burned: '400.75',
          notes: null
        }
      ])
      .execute();

    const result = await getActivityData(userId);

    expect(result).toHaveLength(2);
    
    // Check first activity
    expect(result[0].user_id).toEqual(userId);
    expect(result[0].activity_type).toEqual('Running');
    expect(result[0].duration_minutes).toEqual(30);
    expect(result[0].intensity).toEqual('moderate');
    expect(result[0].calories_burned).toEqual(250.5);
    expect(typeof result[0].calories_burned).toEqual('number');
    expect(result[0].notes).toEqual('Morning run');
    expect(result[0].date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check second activity
    expect(result[1].user_id).toEqual(userId);
    expect(result[1].activity_type).toEqual('Cycling');
    expect(result[1].duration_minutes).toEqual(45);
    expect(result[1].intensity).toEqual('high');
    expect(result[1].calories_burned).toEqual(400.75);
    expect(typeof result[1].calories_burned).toEqual('number');
    expect(result[1].notes).toBeNull();
  });

  it('should only return activity data for the specified user', async () => {
    // Create two users
    const users = await db.insert(usersTable)
      .values([
        { name: 'User 1', email: 'user1@example.com' },
        { name: 'User 2', email: 'user2@example.com' }
      ])
      .returning()
      .execute();

    const user1Id = users[0].id;
    const user2Id = users[1].id;

    // Create activity data for both users
    await db.insert(activityDataTable)
      .values([
        {
          user_id: user1Id,
          date: '2024-01-15',
          activity_type: 'Running',
          duration_minutes: 30
        },
        {
          user_id: user2Id,
          date: '2024-01-15',
          activity_type: 'Swimming',
          duration_minutes: 60
        }
      ])
      .execute();

    const result = await getActivityData(user1Id);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(user1Id);
    expect(result[0].activity_type).toEqual('Running');

    // Verify user 2 has different data
    const user2Result = await getActivityData(user2Id);
    expect(user2Result).toHaveLength(1);
    expect(user2Result[0].user_id).toEqual(user2Id);
    expect(user2Result[0].activity_type).toEqual('Swimming');
  });

  it('should handle null calories_burned correctly', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create activity data without calories_burned
    await db.insert(activityDataTable)
      .values({
        user_id: userId,
        date: '2024-01-15',
        activity_type: 'Yoga',
        duration_minutes: 60,
        calories_burned: null
      })
      .execute();

    const result = await getActivityData(userId);

    expect(result).toHaveLength(1);
    expect(result[0].calories_burned).toBeNull();
    expect(result[0].date).toBeInstanceOf(Date);
  });
});
