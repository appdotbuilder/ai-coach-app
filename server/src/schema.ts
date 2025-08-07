
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Chat session schema
export const chatSessionSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  title: z.string().nullable(),
  started_at: z.coerce.date(),
  ended_at: z.coerce.date().nullable(),
  agent_type: z.enum(['general', 'nutrition', 'fitness', 'wellness', 'goal_setting', 'analysis']),
  context_data: z.record(z.any()).nullable()
});

export type ChatSession = z.infer<typeof chatSessionSchema>;

// Chat message schema
export const chatMessageSchema = z.object({
  id: z.number(),
  session_id: z.number(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  metadata: z.record(z.any()).nullable(),
  timestamp: z.coerce.date(),
  processed_by_llm: z.boolean()
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

// Personal data categories
export const activityDataSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  date: z.coerce.date(),
  activity_type: z.string(),
  duration_minutes: z.number().nullable(),
  intensity: z.enum(['low', 'moderate', 'high']).nullable(),
  calories_burned: z.number().nullable(),
  notes: z.string().nullable(),
  extracted_from_message_id: z.number().nullable(),
  created_at: z.coerce.date()
});

export type ActivityData = z.infer<typeof activityDataSchema>;

export const nutritionDataSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  date: z.coerce.date(),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).nullable(),
  food_item: z.string(),
  quantity: z.string().nullable(),
  calories: z.number().nullable(),
  macros: z.record(z.number()).nullable(),
  notes: z.string().nullable(),
  extracted_from_message_id: z.number().nullable(),
  created_at: z.coerce.date()
});

export type NutritionData = z.infer<typeof nutritionDataSchema>;

export const hydrationDataSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  date: z.coerce.date(),
  amount_ml: z.number(),
  beverage_type: z.string().nullable(),
  timestamp: z.coerce.date(),
  extracted_from_message_id: z.number().nullable(),
  created_at: z.coerce.date()
});

export type HydrationData = z.infer<typeof hydrationDataSchema>;

export const sleepDataSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  date: z.coerce.date(),
  bedtime: z.coerce.date().nullable(),
  wake_time: z.coerce.date().nullable(),
  duration_hours: z.number().nullable(),
  quality_rating: z.number().int().min(1).max(5).nullable(),
  notes: z.string().nullable(),
  extracted_from_message_id: z.number().nullable(),
  created_at: z.coerce.date()
});

export type SleepData = z.infer<typeof sleepDataSchema>;

export const wellbeingDataSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  date: z.coerce.date(),
  mood_rating: z.number().int().min(1).max(10).nullable(),
  stress_level: z.number().int().min(1).max(10).nullable(),
  energy_level: z.number().int().min(1).max(10).nullable(),
  emotions: z.array(z.string()).nullable(),
  notes: z.string().nullable(),
  extracted_from_message_id: z.number().nullable(),
  created_at: z.coerce.date()
});

export type WellbeingData = z.infer<typeof wellbeingDataSchema>;

export const goalSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  category: z.enum(['fitness', 'nutrition', 'wellness', 'sleep', 'personal']),
  title: z.string(),
  description: z.string().nullable(),
  target_value: z.number().nullable(),
  target_unit: z.string().nullable(),
  target_date: z.coerce.date().nullable(),
  status: z.enum(['active', 'completed', 'paused', 'cancelled']),
  progress_percentage: z.number().min(0).max(100),
  extracted_from_message_id: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Goal = z.infer<typeof goalSchema>;

// LLM processing schema
export const llmAnalysisSchema = z.object({
  id: z.number(),
  message_id: z.number(),
  model_used: z.string(),
  analysis_type: z.enum(['data_extraction', 'recommendation', 'insight_generation', 'goal_tracking']),
  extracted_data: z.record(z.any()).nullable(),
  insights: z.string().nullable(),
  recommendations: z.array(z.string()).nullable(),
  confidence_score: z.number().min(0).max(1).nullable(),
  processed_at: z.coerce.date()
});

export type LlmAnalysis = z.infer<typeof llmAnalysisSchema>;

// Input schemas for creating/updating data
export const createUserInputSchema = z.object({
  name: z.string(),
  email: z.string().email()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createChatSessionInputSchema = z.object({
  user_id: z.number(),
  title: z.string().nullable().optional(),
  agent_type: z.enum(['general', 'nutrition', 'fitness', 'wellness', 'goal_setting', 'analysis']),
  context_data: z.record(z.any()).nullable().optional()
});

export type CreateChatSessionInput = z.infer<typeof createChatSessionInputSchema>;

export const createChatMessageInputSchema = z.object({
  session_id: z.number(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  metadata: z.record(z.any()).nullable().optional()
});

export type CreateChatMessageInput = z.infer<typeof createChatMessageInputSchema>;

export const createActivityDataInputSchema = z.object({
  user_id: z.number(),
  date: z.coerce.date(),
  activity_type: z.string(),
  duration_minutes: z.number().nullable().optional(),
  intensity: z.enum(['low', 'moderate', 'high']).nullable().optional(),
  calories_burned: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  extracted_from_message_id: z.number().nullable().optional()
});

export type CreateActivityDataInput = z.infer<typeof createActivityDataInputSchema>;

export const createGoalInputSchema = z.object({
  user_id: z.number(),
  category: z.enum(['fitness', 'nutrition', 'wellness', 'sleep', 'personal']),
  title: z.string(),
  description: z.string().nullable().optional(),
  target_value: z.number().nullable().optional(),
  target_unit: z.string().nullable().optional(),
  target_date: z.coerce.date().nullable().optional(),
  extracted_from_message_id: z.number().nullable().optional()
});

export type CreateGoalInput = z.infer<typeof createGoalInputSchema>;

export const updateGoalInputSchema = z.object({
  id: z.number(),
  status: z.enum(['active', 'completed', 'paused', 'cancelled']).optional(),
  progress_percentage: z.number().min(0).max(100).optional(),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  target_value: z.number().nullable().optional(),
  target_unit: z.string().nullable().optional(),
  target_date: z.coerce.date().nullable().optional()
});

export type UpdateGoalInput = z.infer<typeof updateGoalInputSchema>;

export const processMessageWithLlmInputSchema = z.object({
  message_id: z.number(),
  model_name: z.string(),
  analysis_type: z.enum(['data_extraction', 'recommendation', 'insight_generation', 'goal_tracking'])
});

export type ProcessMessageWithLlmInput = z.infer<typeof processMessageWithLlmInputSchema>;
