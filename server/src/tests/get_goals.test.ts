
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, goalsTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getGoals } from '../handlers/get_goals';

const testUser: CreateUserInput = {
  name: 'Test User',
  email: 'test@example.com'
};

describe('getGoals', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no goals', async () => {
    // Create user first
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const result = await getGoals(1);
    expect(result).toEqual([]);
  });

  it('should return all goals for a specific user', async () => {
    // Create user first
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    // Create goals with proper database field mapping
    await db.insert(goalsTable)
      .values([
        {
          user_id: 1,
          category: 'fitness',
          title: 'Run 5K',
          description: 'Complete a 5K run',
          target_value: '5.00',
          target_unit: 'kilometers',
          target_date: '2024-12-31',
          progress_percentage: '25.50'
        },
        {
          user_id: 1,
          category: 'nutrition',
          title: 'Drink more water',
          description: 'Drink 8 glasses of water daily',
          target_value: '8.00',
          target_unit: 'glasses',
          target_date: null,
          progress_percentage: '75.00'
        }
      ])
      .execute();

    const result = await getGoals(1);

    expect(result).toHaveLength(2);
    
    // Verify numeric conversions
    expect(typeof result[0].target_value).toBe('number');
    expect(typeof result[0].progress_percentage).toBe('number');
    expect(typeof result[1].target_value).toBe('number');
    expect(typeof result[1].progress_percentage).toBe('number');

    // Check actual values
    const fitnessGoal = result.find(g => g.category === 'fitness');
    const nutritionGoal = result.find(g => g.category === 'nutrition');

    expect(fitnessGoal).toBeDefined();
    expect(fitnessGoal!.title).toEqual('Run 5K');
    expect(fitnessGoal!.target_value).toEqual(5);
    expect(fitnessGoal!.progress_percentage).toEqual(25.50);
    expect(fitnessGoal!.target_date).toBeInstanceOf(Date);
    expect(fitnessGoal!.target_date!.getFullYear()).toEqual(2024);

    expect(nutritionGoal).toBeDefined();
    expect(nutritionGoal!.title).toEqual('Drink more water');
    expect(nutritionGoal!.target_value).toEqual(8);
    expect(nutritionGoal!.progress_percentage).toEqual(75.00);
    expect(nutritionGoal!.target_date).toBeNull();
  });

  it('should return goals ordered by creation date (newest first)', async () => {
    // Create user first
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    // Create first goal
    await db.insert(goalsTable)
      .values({
        user_id: 1,
        category: 'fitness',
        title: 'Run 5K',
        description: 'Complete a 5K run',
        target_value: '5.00',
        target_unit: 'kilometers',
        target_date: '2024-12-31',
        progress_percentage: '0'
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create second goal
    await db.insert(goalsTable)
      .values({
        user_id: 1,
        category: 'nutrition',
        title: 'Drink more water',
        description: 'Drink 8 glasses of water daily',
        target_value: '8.00',
        target_unit: 'glasses',
        target_date: null,
        progress_percentage: '0'
      })
      .execute();

    const result = await getGoals(1);

    expect(result).toHaveLength(2);
    // Newer goal should be first (nutrition goal was created second)
    expect(result[0].category).toEqual('nutrition');
    expect(result[1].category).toEqual('fitness');
  });

  it('should only return goals for the specified user', async () => {
    // Create two users
    await db.insert(usersTable)
      .values([
        testUser,
        { name: 'Other User', email: 'other@example.com' }
      ])
      .execute();

    // Create goals for both users
    await db.insert(goalsTable)
      .values([
        {
          user_id: 1,
          category: 'fitness',
          title: 'Run 5K',
          description: 'Complete a 5K run',
          target_value: '5.00',
          target_unit: 'kilometers',
          target_date: '2024-12-31',
          progress_percentage: '0'
        },
        {
          user_id: 2,
          category: 'nutrition',
          title: 'Drink more water',
          description: 'Drink 8 glasses of water daily',
          target_value: '8.00',
          target_unit: 'glasses',
          target_date: null,
          progress_percentage: '0'
        }
      ])
      .execute();

    const result = await getGoals(1);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(1);
    expect(result[0].category).toEqual('fitness');
  });

  it('should handle goals with null target_value correctly', async () => {
    // Create user first
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    // Create goal without target_value
    await db.insert(goalsTable)
      .values({
        user_id: 1,
        category: 'wellness',
        title: 'Improve mood',
        description: 'Focus on mental wellbeing',
        target_value: null,
        target_unit: null,
        target_date: null,
        progress_percentage: '10.25'
      })
      .execute();

    const result = await getGoals(1);

    expect(result).toHaveLength(1);
    expect(result[0].target_value).toBeNull();
    expect(result[0].target_date).toBeNull();
    expect(result[0].progress_percentage).toEqual(10.25);
    expect(typeof result[0].progress_percentage).toBe('number');
  });
});
