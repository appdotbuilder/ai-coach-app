
import { db } from '../db';
import { goalsTable } from '../db/schema';
import { type CreateGoalInput, type Goal } from '../schema';

export const createGoal = async (input: CreateGoalInput): Promise<Goal> => {
  try {
    // Insert goal record
    const result = await db.insert(goalsTable)
      .values({
        user_id: input.user_id,
        category: input.category,
        title: input.title,
        description: input.description || null,
        target_value: input.target_value ? input.target_value.toString() : null, // Convert number to string for numeric column
        target_unit: input.target_unit || null,
        target_date: input.target_date ? input.target_date.toISOString().split('T')[0] : null, // Convert Date to YYYY-MM-DD string for date column
        status: 'active', // Default status
        progress_percentage: '0', // Default progress as string for numeric column
        extracted_from_message_id: input.extracted_from_message_id || null
      })
      .returning()
      .execute();

    // Convert fields back to proper types before returning
    const goal = result[0];
    return {
      ...goal,
      target_value: goal.target_value ? parseFloat(goal.target_value) : null, // Convert string back to number
      progress_percentage: parseFloat(goal.progress_percentage), // Convert string back to number
      target_date: goal.target_date ? new Date(goal.target_date) : null // Convert string back to Date
    };
  } catch (error) {
    console.error('Goal creation failed:', error);
    throw error;
  }
};
