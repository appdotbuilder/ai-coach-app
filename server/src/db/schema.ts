
import { serial, text, pgTable, timestamp, numeric, integer, boolean, jsonb, pgEnum, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const agentTypeEnum = pgEnum('agent_type', ['general', 'nutrition', 'fitness', 'wellness', 'goal_setting', 'analysis']);
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant', 'system']);
export const intensityEnum = pgEnum('intensity', ['low', 'moderate', 'high']);
export const mealTypeEnum = pgEnum('meal_type', ['breakfast', 'lunch', 'dinner', 'snack']);
export const goalCategoryEnum = pgEnum('goal_category', ['fitness', 'nutrition', 'wellness', 'sleep', 'personal']);
export const goalStatusEnum = pgEnum('goal_status', ['active', 'completed', 'paused', 'cancelled']);
export const analysisTypeEnum = pgEnum('analysis_type', ['data_extraction', 'recommendation', 'insight_generation', 'goal_tracking']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Chat sessions table
export const chatSessionsTable = pgTable('chat_sessions', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  title: text('title'),
  started_at: timestamp('started_at').defaultNow().notNull(),
  ended_at: timestamp('ended_at'),
  agent_type: agentTypeEnum('agent_type').notNull(),
  context_data: jsonb('context_data'),
});

// Chat messages table
export const chatMessagesTable = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  session_id: integer('session_id').references(() => chatSessionsTable.id).notNull(),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  processed_by_llm: boolean('processed_by_llm').default(false).notNull(),
});

// Activity data table
export const activityDataTable = pgTable('activity_data', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  date: date('date').notNull(),
  activity_type: text('activity_type').notNull(),
  duration_minutes: integer('duration_minutes'),
  intensity: intensityEnum('intensity'),
  calories_burned: numeric('calories_burned', { precision: 8, scale: 2 }),
  notes: text('notes'),
  extracted_from_message_id: integer('extracted_from_message_id').references(() => chatMessagesTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Nutrition data table
export const nutritionDataTable = pgTable('nutrition_data', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  date: date('date').notNull(),
  meal_type: mealTypeEnum('meal_type'),
  food_item: text('food_item').notNull(),
  quantity: text('quantity'),
  calories: numeric('calories', { precision: 8, scale: 2 }),
  macros: jsonb('macros'),
  notes: text('notes'),
  extracted_from_message_id: integer('extracted_from_message_id').references(() => chatMessagesTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Hydration data table
export const hydrationDataTable = pgTable('hydration_data', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  date: date('date').notNull(),
  amount_ml: integer('amount_ml').notNull(),
  beverage_type: text('beverage_type'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  extracted_from_message_id: integer('extracted_from_message_id').references(() => chatMessagesTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Sleep data table
export const sleepDataTable = pgTable('sleep_data', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  date: date('date').notNull(),
  bedtime: timestamp('bedtime'),
  wake_time: timestamp('wake_time'),
  duration_hours: numeric('duration_hours', { precision: 4, scale: 2 }),
  quality_rating: integer('quality_rating'),
  notes: text('notes'),
  extracted_from_message_id: integer('extracted_from_message_id').references(() => chatMessagesTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Wellbeing data table
export const wellbeingDataTable = pgTable('wellbeing_data', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  date: date('date').notNull(),
  mood_rating: integer('mood_rating'),
  stress_level: integer('stress_level'),
  energy_level: integer('energy_level'),
  emotions: jsonb('emotions'),
  notes: text('notes'),
  extracted_from_message_id: integer('extracted_from_message_id').references(() => chatMessagesTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Goals table
export const goalsTable = pgTable('goals', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  category: goalCategoryEnum('category').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  target_value: numeric('target_value', { precision: 10, scale: 2 }),
  target_unit: text('target_unit'),
  target_date: date('target_date'),
  status: goalStatusEnum('status').default('active').notNull(),
  progress_percentage: numeric('progress_percentage', { precision: 5, scale: 2 }).default('0').notNull(),
  extracted_from_message_id: integer('extracted_from_message_id').references(() => chatMessagesTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// LLM analysis table
export const llmAnalysisTable = pgTable('llm_analysis', {
  id: serial('id').primaryKey(),
  message_id: integer('message_id').references(() => chatMessagesTable.id).notNull(),
  model_used: text('model_used').notNull(),
  analysis_type: analysisTypeEnum('analysis_type').notNull(),
  extracted_data: jsonb('extracted_data'),
  insights: text('insights'),
  recommendations: jsonb('recommendations'),
  confidence_score: numeric('confidence_score', { precision: 3, scale: 2 }),
  processed_at: timestamp('processed_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  chatSessions: many(chatSessionsTable),
  activityData: many(activityDataTable),
  nutritionData: many(nutritionDataTable),
  hydrationData: many(hydrationDataTable),
  sleepData: many(sleepDataTable),
  wellbeingData: many(wellbeingDataTable),
  goals: many(goalsTable),
}));

export const chatSessionsRelations = relations(chatSessionsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [chatSessionsTable.user_id],
    references: [usersTable.id],
  }),
  messages: many(chatMessagesTable),
}));

export const chatMessagesRelations = relations(chatMessagesTable, ({ one, many }) => ({
  session: one(chatSessionsTable, {
    fields: [chatMessagesTable.session_id],
    references: [chatSessionsTable.id],
  }),
  llmAnalysis: many(llmAnalysisTable),
}));

export const goalsRelations = relations(goalsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [goalsTable.user_id],
    references: [usersTable.id],
  }),
  extractedFromMessage: one(chatMessagesTable, {
    fields: [goalsTable.extracted_from_message_id],
    references: [chatMessagesTable.id],
  }),
}));

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  chatSessions: chatSessionsTable,
  chatMessages: chatMessagesTable,
  activityData: activityDataTable,
  nutritionData: nutritionDataTable,
  hydrationData: hydrationDataTable,
  sleepData: sleepDataTable,
  wellbeingData: wellbeingDataTable,
  goals: goalsTable,
  llmAnalysis: llmAnalysisTable,
};
