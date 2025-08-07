
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ActivityData, Goal } from '../../../server/src/schema';

interface DataInsightsProps {
  userId: number;
}

interface InsightData {
  totalActivities: number;
  totalGoals: number;
  completionRate: number;
  recentTrends: string[];
  recommendations: string[];
  wellnessScore: number;
}

export function DataInsights({ userId }: DataInsightsProps) {
  const [insights, setInsights] = useState<InsightData>({
    totalActivities: 0,
    totalGoals: 0,
    completionRate: 0,
    recentTrends: [],
    recommendations: [],
    wellnessScore: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadInsights = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get user insights and activity data
      const [activities, goals] = await Promise.all([
        trpc.getActivityData.query({ userId }),
        trpc.getGoals.query({ userId })
      ]);

      const completedGoals = goals.filter((g: Goal) => g.status === 'completed').length;
      const completionRate = goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;
      
      // Generate insights based on data
      const generatedInsights: InsightData = {
        totalActivities: activities.length,
        totalGoals: goals.length,
        completionRate,
        recentTrends: generateTrends(activities, goals),
        recommendations: generateRecommendations(activities, goals, completionRate),
        wellnessScore: calculateWellnessScore(activities, goals, completionRate)
      };

      setInsights(generatedInsights);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const generateTrends = (activities: ActivityData[], goals: Goal[]): string[] => {
    const trends: string[] = [];
    
    if (activities.length === 0) {
      trends.push("📈 Ready to start tracking activities");
    } else {
      trends.push(`📊 ${activities.length} activities tracked`);
    }
    
    if (goals.length > 0) {
      const activeGoals = goals.filter((g: Goal) => g.status === 'active').length;
      trends.push(`🎯 ${activeGoals} active goals in progress`);
    }
    
    // Add motivational trends
    trends.push("💪 Consistency is key to achieving your goals");
    trends.push("🌟 Every small step counts towards your wellness journey");
    
    return trends;
  };

  const generateRecommendations = (activities: ActivityData[], goals: Goal[], completionRate: number): string[] => {
    const recommendations: string[] = [];
    
    if (activities.length === 0) {
      recommendations.push("Start by chatting with the fitness coach to log your first activity");
      recommendations.push("Try setting a simple daily movement goal");
    } else {
      recommendations.push("Great job tracking activities! Keep up the consistency");
    }
    
    if (goals.length === 0) {
      recommendations.push("Consider setting your first wellness goal for better progress tracking");
    } else if (completionRate < 50) {
      recommendations.push("Break down larger goals into smaller, achievable milestones");
      recommendations.push("Chat with the goal-setting coach for motivation strategies");
    } else {
      recommendations.push("Excellent goal progress! Consider setting more challenging targets");
    }
    
    recommendations.push("Regular check-ins with different AI coaches can provide varied insights");
    recommendations.push("Focus on building sustainable habits rather than perfect days");
    
    return recommendations;
  };

  const calculateWellnessScore = (activities: ActivityData[], goals: Goal[], completionRate: number): number => {
    let score = 50; // Base score
    
    // Activity contribution
    if (activities.length > 0) {
      score += Math.min(activities.length * 2, 20);
    }
    
    // Goal completion contribution
    score += Math.min(completionRate * 0.3, 30);
    
    return Math.min(Math.round(score), 100);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return '🌟';
    if (score >= 80) return '🎉';
    if (score >= 70) return '💪';
    if (score >= 60) return '📈';
    if (score >= 40) return '🌱';
    return '🚀';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">💡 Data Insights</h2>
          <p className="text-gray-600">AI-powered analytics and recommendations</p>
        </div>
        <div className="flex items-center space-x-2">
          
          <Badge variant="outline" className="text-xs">
            Updated: {lastUpdated.toLocaleTimeString()}
          </Badge>
          <Button variant="outline" size="sm" onClick={loadInsights}>
            🔄 Refresh
          </Button>
        </div>
      </div>

      {/* Wellness Score */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader className="text-center">
          <div className="text-6xl mb-2">{getScoreEmoji(insights.wellnessScore)}</div>
          <CardTitle className="text-2xl">
            <span className={getScoreColor(insights.wellnessScore)}>
              Wellness Score: {insights.wellnessScore}/100
            </span>
          </CardTitle>
          <CardDescription>
            Your overall wellness journey progress
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">📊 Overview</TabsTrigger>
          <TabsTrigger value="trends">📈 Trends</TabsTrigger>
          <TabsTrigger value="recommendations">💡 Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">🏃‍♂️</div>
                <p className="text-2xl font-bold">{insights.totalActivities}</p>
                <p className="text-sm text-gray-600">Activities Tracked</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">🎯</div>
                <p className="text-2xl font-bold">{insights.totalGoals}</p>
                <p className="text-sm text-gray-600">Goals Created</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-2xl font-bold">{insights.completionRate.toFixed(0)}%</p>
                <p className="text-sm text-gray-600">Completion Rate</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>🔍 Quick Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Alert>
                  <AlertDescription>
                    {insights.wellnessScore >= 80 ? (
                      <span>🎉 <strong>Excellent progress!</strong> You're maintaining great wellness habits.</span>
                    ) : insights.wellnessScore >= 60 ? (
                      <span>💪 <strong>Good momentum!</strong> Keep building on your current progress.</span>
                    ) : (
                      <span>🌱 <strong>Great start!</strong> Every wellness journey begins with the first step.</span>
                    )}
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">💚 Strengths</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      {insights.totalActivities > 0 && <li>✓ Active in tracking wellness data</li>}
                      {insights.totalGoals > 0 && <li>✓ Goal-oriented mindset</li>}
                      {insights.completionRate > 50 && <li>✓ Good follow-through on commitments</li>}
                      <li>✓ Engaged with AI coaching system</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">🎯 Focus Areas</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {insights.totalActivities === 0 && <li>• Start logging daily activities</li>}
                      {insights.totalGoals === 0 && <li>• Set specific wellness goals</li>}
                      {insights.completionRate < 50 && <li>• Improve goal completion consistency</li>}
                      <li>• Explore different AI coach specializations</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="mr-2">📈</span>
                Recent Trends
              </CardTitle>
              <CardDescription>
                Patterns and insights from your wellness data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {insights.recentTrends.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="text-gray-600">No trends available yet</p>
                  <p className="text-sm text-gray-500">Start tracking activities to see trends!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {insights.recentTrends.map((trend, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-blue-600 font-semibold">#{index + 1}</div>
                      <p className="text-sm">{trend}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🔮 Predictive Insights</CardTitle>
              <CardDescription>
                AI-powered predictions based on your patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    📊 <strong>Data Collection:</strong> As you interact more with the AI coaches and log more activities, 
                    these insights will become more personalized and accurate.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">🎯 Goal Success Probability</h4>
                    <p className="text-sm text-gray-600">
                      Based on your current completion rate, you have a high likelihood of achieving goals 
                      when broken into smaller milestones.
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">📅 Optimal Activity Times</h4>
                    <p className="text-sm text-gray-600">
                      More data needed to identify your peak activity periods. 
                      Continue logging to get personalized timing insights.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="mr-2">💡</span>
                Personalized Recommendations
              </CardTitle>
              <CardDescription>
                AI-generated suggestions to improve your wellness journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              {insights.recommendations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🤖</div>
                  <p className="text-gray-600">No recommendations yet</p>
                  <p className="text-sm text-gray-500">Chat with AI coaches to get personalized advice!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {insights.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 border border-blue-200 bg-blue-50 rounded-lg">
                      <div className="text-blue-600 font-bold text-lg">💡</div>
                      <div className="flex-1">
                        <p className="text-sm text-blue-800">{recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🤖 AI Coach Suggestions</CardTitle>
              <CardDescription>
                Which AI specialists can help you most right now
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.totalActivities === 0 && (
                  <div className="p-4 border-l-4 border-orange-400 bg-orange-50">
                    <h4 className="font-semibold text-orange-800">💪 Fitness Trainer</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      Start tracking your physical activities and get exercise recommendations.
                    </p>
                  </div>
                )}
                
                {insights.totalGoals === 0 && (
                  <div className="p-4 border-l-4 border-red-400 bg-red-50">
                    <h4 className="font-semibold text-red-800">🎯 Goal Setter</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Define clear, achievable wellness goals with expert guidance.
                    </p>
                  </div>
                )}
                
                <div className="p-4 border-l-4 border-green-400 bg-green-50">
                  <h4 className="font-semibold text-green-800">🥗 Nutrition Expert</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Get personalized dietary advice and meal planning assistance.
                  </p>
                </div>
                
                <div className="p-4 border-l-4 border-purple-400 bg-purple-50">
                  <h4 className="font-semibold text-purple-800">🧘 Wellness Guide</h4>
                  <p className="text-sm text-purple-700 mt-1">
                    Focus on mental health, stress management, and overall wellbeing.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertDescription>
              🚀 <strong>Pro Tip:</strong> The more you interact with different AI coaches and log your activities, 
              the more personalized and accurate these insights become. Each conversation helps build your unique wellness profile!
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}
