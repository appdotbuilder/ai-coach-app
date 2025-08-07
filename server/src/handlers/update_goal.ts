
import { db } from '../db';
import { goalsTable } from '../db/schema';
import { type UpdateGoalInput, type Goal } from '../schema';
import { eq } from 'drizzle-orm';

export const updateGoal = async (input: UpdateGoalInput): Promise<Goal> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.progress_percentage !== undefined) {
      updateData.progress_percentage = input.progress_percentage.toString();
    }
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.target_value !== undefined) {
      updateData.target_value = input.target_value?.toString() || null;
    }
    if (input.target_unit !== undefined) {
      updateData.target_unit = input.target_unit;
    }
    if (input.target_date !== undefined) {
      updateData.target_date = input.target_date?.toISOString().split('T')[0] || null;
    }

    // Update the goal
    const result = await db.update(goalsTable)
      .set(updateData)
      .where(eq(goalsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Goal with id ${input.id} not found`);
    }

    // Convert fields back to proper types
    const goal = result[0];
    return {
      ...goal,
      target_value: goal.target_value ? parseFloat(goal.target_value) : null,
      progress_percentage: parseFloat(goal.progress_percentage),
      target_date: goal.target_date ? new Date(goal.target_date) : null
    };
  } catch (error) {
    console.error('Goal update failed:', error);
    throw error;
  }
};
