
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schema types
import { 
  createUserInputSchema, 
  createChatSessionInputSchema, 
  createChatMessageInputSchema,
  createActivityDataInputSchema,
  createGoalInputSchema,
  updateGoalInputSchema,
  processMessageWithLlmInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { createChatSession } from './handlers/create_chat_session';
import { getChatSessions } from './handlers/get_chat_sessions';
import { createChatMessage } from './handlers/create_chat_message';
import { getChatMessages } from './handlers/get_chat_messages';
import { createActivityData } from './handlers/create_activity_data';
import { getActivityData } from './handlers/get_activity_data';
import { createGoal } from './handlers/create_goal';
import { updateGoal } from './handlers/update_goal';
import { getGoals } from './handlers/get_goals';
import { processMessageWithLlm } from './handlers/process_message_with_llm';
import { getUserInsights } from './handlers/get_user_insights';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  getUsers: publicProcedure
    .query(() => getUsers()),

  // Chat sessions
  createChatSession: publicProcedure
    .input(createChatSessionInputSchema)
    .mutation(({ input }) => createChatSession(input)),
  
  getChatSessions: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getChatSessions(input.userId)),

  // Chat messages
  createChatMessage: publicProcedure
    .input(createChatMessageInputSchema)
    .mutation(({ input }) => createChatMessage(input)),
  
  getChatMessages: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(({ input }) => getChatMessages(input.sessionId)),

  // Activity tracking
  createActivityData: publicProcedure
    .input(createActivityDataInputSchema)
    .mutation(({ input }) => createActivityData(input)),
  
  getActivityData: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getActivityData(input.userId)),

  // Goal management
  createGoal: publicProcedure
    .input(createGoalInputSchema)
    .mutation(({ input }) => createGoal(input)),
  
  updateGoal: publicProcedure
    .input(updateGoalInputSchema)
    .mutation(({ input }) => updateGoal(input)),
  
  getGoals: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getGoals(input.userId)),

  // LLM processing
  processMessageWithLlm: publicProcedure
    .input(processMessageWithLlmInputSchema)
    .mutation(({ input }) => processMessageWithLlm(input)),

  // Analytics and insights
  getUserInsights: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserInsights(input.userId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`AI Coaching TRPC server listening at port: ${port}`);
}

start();
