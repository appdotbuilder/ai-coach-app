
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ActivityData, Goal } from '../../../server/src/schema';

interface UserDashboardProps {
  userId: number;
}

interface DashboardStats {
  totalActivities: number;
  activeGoals: number;
  completedGoals: number;
  recentActivity: string;
}

export function UserDashboard({ userId }: UserDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalActivities: 0,
    activeGoals: 0,
    completedGoals: 0,
    recentActivity: 'No recent activity'
  });
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [activitiesResult, goalsResult] = await Promise.all([
        trpc.getActivityData.query({ userId }),
        trpc.getGoals.query({ userId })
      ]);

      setActivities(activitiesResult);
      setGoals(goalsResult);

      // Calculate stats
      const activeGoalsCount = goalsResult.filter((g: Goal) => g.status === 'active').length;
      const completedGoalsCount = goalsResult.filter((g: Goal) => g.status === 'completed').length;
      
      setStats({
        totalActivities: activitiesResult.length,
        activeGoals: activeGoalsCount,
        completedGoals: completedGoalsCount,
        recentActivity: activitiesResult.length > 0 
          ? `Last activity: ${activitiesResult[0].activity_type}` 
          : 'No activities recorded yet'
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🏃‍♂️</span>
              <div>
                <p className="text-2xl font-bold">{stats.totalActivities}</p>
                <p className="text-sm text-gray-600">Activities Tracked</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="text-2xl font-bold">{stats.activeGoals}</p>
                <p className="text-sm text-gray-600">Active Goals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-2xl font-bold">{stats.completedGoals}</p>
                <p className="text-sm text-gray-600">Goals Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">⭐</span>
              <div>
                <p className="text-sm font-bold text-green-600">Great Progress!</p>
                <p className="text-sm text-gray-600">Keep it up</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>🏃‍♂️</span>
              <span>Recent Activities</span>
            </CardTitle>
            <CardDescription>Your latest tracked activities</CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-gray-600 mb-2">No activities yet</p>
                <p className="text-sm text-gray-500">
                  Start chatting with the fitness coach to track activities!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.slice(0, 5).map((activity: ActivityData) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{activity.activity_type}</p>
                      <p className="text-sm text-gray-600">
                        {activity.date.toLocaleDateString()}
                        {activity.duration_minutes && ` • ${activity.duration_minutes} min`}
                      </p>
                    </div>
                    <div className="text-right">
                      {activity.intensity && (
                        <Badge variant="outline" className="mb-1">
                          {activity.intensity}
                        </Badge>
                      )}
                      {activity.calories_burned && (
                        <p className="text-sm text-gray-600">
                          {activity.calories_burned} cal
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goal Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>🎯</span>
              <span>Goal Progress</span>
            </CardTitle>
            <CardDescription>Track your achievement progress</CardDescription>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🎯</div>
                <p className="text-gray-600 mb-2">No goals set yet</p>
                <p className="text-sm text-gray-500">
                  Chat with the goal-setting coach to create your first goal!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.filter((g: Goal) => g.status === 'active').slice(0, 3).map((goal: Goal) => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{goal.title}</p>
                      <Badge 
                        variant={goal.status === 'completed' ? 'default' : 'secondary'}
                        className={
                          goal.status === 'completed' ? 'bg-green-100 text-green-800' : ''
                        }
                      >
                        {goal.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{goal.progress_percentage}%</span>
                      </div>
                      <Progress value={goal.progress_percentage} className="h-2" />
                    </div>
                    {goal.target_date && (
                      <p className="text-xs text-gray-500">
                        Target: {goal.target_date.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
                
                {goals.filter((g: Goal) => g.status === 'completed').length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium text-sm mb-2 text-green-600">🎉 Completed Goals</h4>
                      <div className="space-y-1">
                        {goals.filter((g: Goal) => g.status === 'completed').slice(0, 2).map((goal: Goal) => (
                          <p key={goal.id} className="text-sm text-gray-600">
                            ✅ {goal.title}
                          </p>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>⚡</span>
            <span>Quick Insights</span>
          </CardTitle>
          <CardDescription>AI-powered recommendations for you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Alert>
              <AlertDescription>
                💡 <strong>Tip:</strong> Track your daily activities by chatting with different AI coaches. 
                Each conversation helps build your personal wellness profile!
              </AlertDescription>
            </Alert>
            
            <Alert>
              <AlertDescription>
                🎯 <strong>Suggestion:</strong> Set specific, measurable goals to track your progress more effectively. 
                The goal-setting coach can help you create SMART goals.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
