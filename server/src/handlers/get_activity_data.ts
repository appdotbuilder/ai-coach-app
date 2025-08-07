
import { db } from '../db';
import { activityDataTable } from '../db/schema';
import { type ActivityData } from '../schema';
import { eq } from 'drizzle-orm';

export async function getActivityData(userId: number): Promise<ActivityData[]> {
  try {
    const results = await db.select()
      .from(activityDataTable)
      .where(eq(activityDataTable.user_id, userId))
      .execute();

    // Convert numeric and date fields to match ActivityData schema
    return results.map(activity => ({
      ...activity,
      date: new Date(activity.date), // Convert date string to Date object
      calories_burned: activity.calories_burned ? parseFloat(activity.calories_burned) : null
    }));
  } catch (error) {
    console.error('Failed to get activity data:', error);
    throw error;
  }
}
