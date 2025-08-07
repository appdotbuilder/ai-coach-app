
import { db } from '../db';
import { activityDataTable } from '../db/schema';
import { type CreateActivityDataInput, type ActivityData } from '../schema';

export const createActivityData = async (input: CreateActivityDataInput): Promise<ActivityData> => {
  try {
    // Convert Date to string format for database insertion
    const dateString = input.date.toISOString().split('T')[0];

    // Insert activity data record
    const result = await db.insert(activityDataTable)
      .values({
        user_id: input.user_id,
        date: dateString,
        activity_type: input.activity_type,
        duration_minutes: input.duration_minutes,
        intensity: input.intensity,
        calories_burned: input.calories_burned !== null && input.calories_burned !== undefined ? input.calories_burned.toString() : null, // Convert number to string for numeric column, but preserve null/undefined
        notes: input.notes,
        extracted_from_message_id: input.extracted_from_message_id
      })
      .returning()
      .execute();

    // Convert database result back to proper types
    const activityData = result[0];
    return {
      ...activityData,
      date: new Date(activityData.date), // Convert string back to Date
      calories_burned: activityData.calories_burned !== null ? parseFloat(activityData.calories_burned) : null // Convert string back to number, preserve null
    };
  } catch (error) {
    console.error('Activity data creation failed:', error);
    throw error;
  }
};
