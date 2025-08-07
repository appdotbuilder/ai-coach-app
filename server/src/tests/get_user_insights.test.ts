
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  usersTable, 
  activityDataTable, 
  nutritionDataTable, 
  wellbeingDataTable,
  sleepDataTable,
  goalsTable 
} from '../db/schema';
import { getUserInsights } from '../handlers/get_user_insights';

describe('getUserInsights', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return insights for user with no data', async () => {
    // Create a user
    const users = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const user = users[0];
    const result = await getUserInsights(user.id);

    // Verify user data
    expect(result.user.id).toEqual(user.id);
    expect(result.user.name).toEqual('Test User');
    expect(result.user.email).toEqual('test@example.com');

    // Verify empty summaries
    expect(result.activitySummary.totalActivities).toEqual(0);
    expect(result.activitySummary.totalCaloriesBurned).toEqual(0);
    expect(result.activitySummary.totalDuration).toEqual(0);

    expect(result.nutritionSummary.totalEntries).toEqual(0);
    expect(result.nutritionSummary.totalCalories).toEqual(0);
    expect(result.nutritionSummary.averageCaloriesPerDay).toEqual(0);

    expect(result.wellbeingSummary.totalEntries).toEqual(0);
    expect(result.wellbeingSummary.averageMood).toBeNull();
    expect(result.wellbeingSummary.sleepSummary.totalEntries).toEqual(0);

    expect(result.goalProgress.totalGoals).toEqual(0);
    expect(result.goalProgress.activeGoals).toEqual(0);

    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it('should throw error for non-existent user', async () => {
    await expect(getUserInsights(999)).rejects.toThrow(/User with id 999 not found/);
  });

  it('should return comprehensive insights for user with data', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values({
        name: 'Active User',
        email: 'active@example.com'
      })
      .returning()
      .execute();

    const user = users[0];

    // Create recent activity data - convert dates to strings
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    await db.insert(activityDataTable).values([
      {
        user_id: user.id,
        date: today,
        activity_type: 'running',
        duration_minutes: 30,
        intensity: 'high',
        calories_burned: '300.5'
      },
      {
        user_id: user.id,
        date: yesterdayString,
        activity_type: 'walking',
        duration_minutes: 45,
        intensity: 'moderate',
        calories_burned: '150.0'
      }
    ]).execute();

    // Create nutrition data
    await db.insert(nutritionDataTable).values([
      {
        user_id: user.id,
        date: today,
        meal_type: 'breakfast',
        food_item: 'Oatmeal',
        calories: '250.0'
      },
      {
        user_id: user.id,
        date: today,
        meal_type: 'lunch',
        food_item: 'Salad',
        calories: '400.5'
      }
    ]).execute();

    // Create wellbeing data
    await db.insert(wellbeingDataTable).values([
      {
        user_id: user.id,
        date: today,
        mood_rating: 7,
        stress_level: 4,
        energy_level: 8,
        emotions: JSON.stringify(['happy', 'motivated'])
      }
    ]).execute();

    // Create sleep data
    await db.insert(sleepDataTable).values([
      {
        user_id: user.id,
        date: yesterdayString,
        duration_hours: '8.5',
        quality_rating: 4
      }
    ]).execute();

    // Create goals
    await db.insert(goalsTable).values([
      {
        user_id: user.id,
        category: 'fitness',
        title: 'Run 10km',
        status: 'active',
        progress_percentage: '75.0'
      },
      {
        user_id: user.id,
        category: 'nutrition',
        title: 'Eat more vegetables',
        status: 'completed',
        progress_percentage: '100.0'
      }
    ]).execute();

    const result = await getUserInsights(user.id);

    // Verify activity summary
    expect(result.activitySummary.totalActivities).toEqual(2);
    expect(result.activitySummary.totalCaloriesBurned).toEqual(450.5);
    expect(result.activitySummary.totalDuration).toEqual(75);
    expect(result.activitySummary.mostCommonActivity).toBeDefined();

    // Verify nutrition summary
    expect(result.nutritionSummary.totalEntries).toEqual(2);
    expect(result.nutritionSummary.totalCalories).toEqual(650.5);
    expect(result.nutritionSummary.averageCaloriesPerDay).toBeGreaterThan(0);
    expect(result.nutritionSummary.mealDistribution.breakfast).toEqual(1);
    expect(result.nutritionSummary.mealDistribution.lunch).toEqual(1);

    // Verify wellbeing summary
    expect(result.wellbeingSummary.totalEntries).toEqual(1);
    expect(result.wellbeingSummary.averageMood).toEqual(7);
    expect(result.wellbeingSummary.averageStress).toEqual(4);
    expect(result.wellbeingSummary.averageEnergy).toEqual(8);
    expect(result.wellbeingSummary.commonEmotions).toContain('happy');
    expect(result.wellbeingSummary.commonEmotions).toContain('motivated');

    // Verify sleep data in wellbeing summary
    expect(result.wellbeingSummary.sleepSummary.totalEntries).toEqual(1);
    expect(result.wellbeingSummary.sleepSummary.averageDuration).toEqual(8.5);
    expect(result.wellbeingSummary.sleepSummary.averageQuality).toEqual(4);

    // Verify goal progress
    expect(result.goalProgress.totalGoals).toEqual(2);
    expect(result.goalProgress.activeGoals).toEqual(1);
    expect(result.goalProgress.completedGoals).toEqual(1);
    expect(result.goalProgress.averageProgress).toEqual(87.5);
    expect(result.goalProgress.goals).toHaveLength(2);

    // Verify numeric conversions in goals
    result.goalProgress.goals.forEach((goal: any) => {
      expect(typeof goal.progress_percentage).toBe('number');
    });

    // Verify recommendations exist
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('should handle users with partial data correctly', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values({
        name: 'Partial User',
        email: 'partial@example.com'
      })
      .returning()
      .execute();

    const user = users[0];
    const today = new Date().toISOString().split('T')[0];

    // Create only activity data with null values
    await db.insert(activityDataTable).values([
      {
        user_id: user.id,
        date: today,
        activity_type: 'yoga',
        duration_minutes: null,
        intensity: null,
        calories_burned: null
      }
    ]).execute();

    // Create wellbeing data with some null values
    await db.insert(wellbeingDataTable).values([
      {
        user_id: user.id,
        date: today,
        mood_rating: null,
        stress_level: 6,
        energy_level: null,
        emotions: null
      }
    ]).execute();

    const result = await getUserInsights(user.id);

    // Verify handling of null values
    expect(result.activitySummary.totalActivities).toEqual(1);
    expect(result.activitySummary.totalCaloriesBurned).toEqual(0);
    expect(result.activitySummary.totalDuration).toEqual(0);
    expect(result.activitySummary.averageIntensity).toBeNull();

    expect(result.wellbeingSummary.totalEntries).toEqual(1);
    expect(result.wellbeingSummary.averageMood).toBeNull();
    expect(result.wellbeingSummary.averageStress).toEqual(6);
    expect(result.wellbeingSummary.averageEnergy).toBeNull();
    expect(result.wellbeingSummary.commonEmotions).toHaveLength(0);
  });

  it('should only include data from last 30 days', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values({
        name: 'Time Test User',
        email: 'timetest@example.com'
      })
      .returning()
      .execute();

    const user = users[0];

    // Create old activity data (40 days ago)
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 40);
    const oldDateString = oldDate.toISOString().split('T')[0];

    // Create recent activity data (10 days ago)
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 10);
    const recentDateString = recentDate.toISOString().split('T')[0];

    await db.insert(activityDataTable).values([
      {
        user_id: user.id,
        date: oldDateString,
        activity_type: 'old_activity',
        duration_minutes: 60,
        calories_burned: '500.0'
      },
      {
        user_id: user.id,
        date: recentDateString,
        activity_type: 'recent_activity',
        duration_minutes: 30,
        calories_burned: '250.0'
      }
    ]).execute();

    const result = await getUserInsights(user.id);

    // Should only include recent activity
    expect(result.activitySummary.totalActivities).toEqual(1);
    expect(result.activitySummary.totalCaloriesBurned).toEqual(250);
    expect(result.activitySummary.totalDuration).toEqual(30);
    expect(result.activitySummary.mostCommonActivity).toEqual('recent_activity');
  });
});
