
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatInterface } from '@/components/ChatInterface';
import { UserDashboard } from '@/components/UserDashboard';
import { GoalManager } from '@/components/GoalManager';
import { DataInsights } from '@/components/DataInsights';
import { AgentSelector } from '@/components/AgentSelector';
import type { User, ChatSession, Goal } from '../../server/src/schema';

function App() {
  // Core state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeTab, setActiveTab] = useState('chat');
  const [isLoading, setIsLoading] = useState(false);

  // Load initial data
  const loadUsers = useCallback(async () => {
    try {
      const result = await trpc.getUsers.query();
      setUsers(result);
      // Auto-select first user for demo purposes
      if (result.length > 0 && !currentUser) {
        setCurrentUser(result[0]);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, [currentUser]);

  const loadChatSessions = useCallback(async (userId: number) => {
    try {
      const result = await trpc.getChatSessions.query({ userId });
      setChatSessions(result);
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    }
  }, []);

  const loadGoals = useCallback(async (userId: number) => {
    try {
      const result = await trpc.getGoals.query({ userId });
      setGoals(result);
    } catch (error) {
      console.error('Failed to load goals:', error);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (currentUser) {
      loadChatSessions(currentUser.id);
      loadGoals(currentUser.id);
    }
  }, [currentUser, loadChatSessions, loadGoals]);

  // Create new chat session
  const createNewSession = async (agentType: 'general' | 'nutrition' | 'fitness' | 'wellness' | 'goal_setting' | 'analysis') => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const session = await trpc.createChatSession.mutate({
        user_id: currentUser.id,
        agent_type: agentType,
        title: `${agentType.charAt(0).toUpperCase() + agentType.slice(1)} Session`,
      });
      
      setChatSessions((prev: ChatSession[]) => [session, ...prev]);
      setCurrentSession(session);
      setActiveTab('chat');
    } catch (error) {
      console.error('Failed to create chat session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create demo user if none exist
  const createDemoUser = async () => {
    setIsLoading(true);
    try {
      const user = await trpc.createUser.mutate({
        name: 'Demo User',
        email: 'demo@aicoach.app'
      });
      setUsers((prev: User[]) => [...prev, user]);
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to create demo user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🤖</span>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Coach
                </h1>
              </div>
              {currentUser && (
                <Badge variant="outline" className="ml-4">
                  👤 {currentUser.name}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {currentUser && (
                <>
                  <AgentSelector onSelectAgent={createNewSession} disabled={isLoading} />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => loadChatSessions(currentUser.id)}
                  >
                    🔄 Refresh
                  </Button>
                </>
              )}
              {!currentUser && users.length === 0 && (
                <Button onClick={createDemoUser} disabled={isLoading}>
                  {isLoading ? 'Creating...' : '✨ Get Started'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {!currentUser ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-6">🤖✨</div>
              <h2 className="text-3xl font-bold mb-4 text-gray-800">
                Welcome to AI Coach
              </h2>
              <p className="text-gray-600 mb-8">
                Your personal AI-powered wellness companion. Get personalized insights, 
                track your progress, and achieve your health goals with intelligent coaching.
              </p>
              {users.length === 0 ? (
                <Button onClick={createDemoUser} disabled={isLoading} size="lg">
                  {isLoading ? 'Setting up...' : '🚀 Start Your Journey'}
                </Button>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">Select a user to continue:</p>
                  <div className="space-y-2">
                    {users.map((user: User) => (
                      <Button
                        key={user.id}
                        variant="outline"
                        onClick={() => setCurrentUser(user)}
                        className="w-full"
                      >
                        👤 {user.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-fit lg:grid-cols-4">
              <TabsTrigger value="chat" className="flex items-center space-x-2">
                <span>💬</span>
                <span>Chat</span>
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="flex items-center space-x-2">
                <span>📊</span>
                <span>Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="goals" className="flex items-center space-x-2">
                <span>🎯</span>
                <span>Goals</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center space-x-2">
                <span>💡</span>
                <span>Insights</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Chat Sessions Sidebar */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        📝 Chat Sessions
                      </CardTitle>
                      <CardDescription>
                        Your conversation history
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        {chatSessions.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <div className="text-4xl mb-2">🌟</div>
                            <p className="text-sm">No sessions yet.</p>
                            <p className="text-xs">Start a conversation!</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {chatSessions.map((session: ChatSession) => (
                              <div
                                key={session.id}
                                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                  currentSession?.id === session.id
                                    ? 'bg-blue-50 border-blue-200'
                                    : 'hover:bg-gray-50'
                                }`}
                                onClick={() => setCurrentSession(session)}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {session.agent_type}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {session.started_at.toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm font-medium truncate">
                                  {session.title || `${session.agent_type} session`}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                {/* Chat Interface */}
                <div className="lg:col-span-3">
                  {currentSession ? (
                    <ChatInterface 
                      session={currentSession} 
                      onDataUpdate={() => {
                        loadGoals(currentUser.id);
                      }}
                    />
                  ) : (
                    <Card className="h-96">
                      <CardContent className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="text-6xl mb-4">💬</div>
                          <h3 className="text-xl font-semibold mb-2">Start a Conversation</h3>
                          <p className="text-gray-600 mb-4">
                            Select a specialized AI agent to begin your coaching session
                          </p>
                          <AgentSelector onSelectAgent={createNewSession} disabled={isLoading} />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="dashboard">
              <UserDashboard userId={currentUser.id} />
            </TabsContent>

            <TabsContent value="goals">
              <GoalManager 
                userId={currentUser.id} 
                goals={goals}
                onGoalsUpdate={() => loadGoals(currentUser.id)}
              />
            </TabsContent>

            <TabsContent value="insights">
              <DataInsights userId={currentUser.id} />
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 mt-20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <span>🤖</span>
              <span>AI Coach - Your Personal Wellness Companion</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>Multi-Agent Architecture</span>
              <Badge variant="outline" className="text-xs">
                Powered by LLM
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
