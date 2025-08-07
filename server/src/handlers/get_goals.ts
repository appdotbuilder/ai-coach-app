
import { db } from '../db';
import { goalsTable } from '../db/schema';
import { type Goal } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getGoals(userId: number): Promise<Goal[]> {
  try {
    const results = await db.select()
      .from(goalsTable)
      .where(eq(goalsTable.user_id, userId))
      .orderBy(desc(goalsTable.created_at))
      .execute();

    // Convert numeric fields and date fields to correct types
    return results.map(goal => ({
      ...goal,
      target_value: goal.target_value ? parseFloat(goal.target_value) : null,
      progress_percentage: parseFloat(goal.progress_percentage),
      target_date: goal.target_date ? new Date(goal.target_date) : null
    }));
  } catch (error) {
    console.error('Failed to get goals:', error);
    throw error;
  }
}
