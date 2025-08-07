
import { db } from '../db';
import { 
  usersTable, 
  activityDataTable, 
  nutritionDataTable, 
  wellbeingDataTable, 
  sleepDataTable, 
  goalsTable 
} from '../db/schema';
import { type User } from '../schema';
import { eq, gte, desc, and, sql } from 'drizzle-orm';

export async function getUserInsights(userId: number): Promise<{
    user: User;
    activitySummary: any;
    nutritionSummary: any;
    wellbeingSummary: any;
    goalProgress: any;
    recommendations: string[];
}> {
  try {
    // Get user info
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (users.length === 0) {
      throw new Error(`User with id ${userId} not found`);
    }

    const user = users[0];

    // Date range for recent data (last 30 days) - convert to string format
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoString = thirtyDaysAgo.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // Activity Summary - get recent activities and calculate totals
    const recentActivities = await db.select()
      .from(activityDataTable)
      .where(and(
        eq(activityDataTable.user_id, userId),
        gte(activityDataTable.date, thirtyDaysAgoString)
      ))
      .orderBy(desc(activityDataTable.date))
      .execute();

    const activitySummary = {
      totalActivities: recentActivities.length,
      totalCaloriesBurned: recentActivities.reduce((sum, activity) => 
        sum + (activity.calories_burned ? parseFloat(activity.calories_burned) : 0), 0),
      totalDuration: recentActivities.reduce((sum, activity) => 
        sum + (activity.duration_minutes || 0), 0),
      mostCommonActivity: getMostCommonValue(recentActivities.map(a => a.activity_type)),
      averageIntensity: getAverageIntensity(recentActivities)
    };

    // Nutrition Summary - get recent nutrition data
    const recentNutrition = await db.select()
      .from(nutritionDataTable)
      .where(and(
        eq(nutritionDataTable.user_id, userId),
        gte(nutritionDataTable.date, thirtyDaysAgoString)
      ))
      .orderBy(desc(nutritionDataTable.date))
      .execute();

    const nutritionSummary = {
      totalEntries: recentNutrition.length,
      totalCalories: recentNutrition.reduce((sum, entry) => 
        sum + (entry.calories ? parseFloat(entry.calories) : 0), 0),
      averageCaloriesPerDay: recentNutrition.length > 0 
        ? Math.round(recentNutrition.reduce((sum, entry) => 
            sum + (entry.calories ? parseFloat(entry.calories) : 0), 0) / 30)
        : 0,
      mealDistribution: getMealDistribution(recentNutrition)
    };

    // Wellbeing Summary - get recent wellbeing data
    const recentWellbeing = await db.select()
      .from(wellbeingDataTable)
      .where(and(
        eq(wellbeingDataTable.user_id, userId),
        gte(wellbeingDataTable.date, thirtyDaysAgoString)
      ))
      .orderBy(desc(wellbeingDataTable.date))
      .execute();

    const wellbeingSummary = {
      totalEntries: recentWellbeing.length,
      averageMood: calculateAverage(recentWellbeing.map(w => w.mood_rating)),
      averageStress: calculateAverage(recentWellbeing.map(w => w.stress_level)),
      averageEnergy: calculateAverage(recentWellbeing.map(w => w.energy_level)),
      commonEmotions: getCommonEmotions(recentWellbeing)
    };

    // Sleep Summary - get recent sleep data  
    const recentSleep = await db.select()
      .from(sleepDataTable)
      .where(and(
        eq(sleepDataTable.user_id, userId),
        gte(sleepDataTable.date, thirtyDaysAgoString)
      ))
      .orderBy(desc(sleepDataTable.date))
      .execute();

    const sleepSummary = {
      totalEntries: recentSleep.length,
      averageDuration: recentSleep.length > 0 
        ? recentSleep.reduce((sum, entry) => 
            sum + (entry.duration_hours ? parseFloat(entry.duration_hours) : 0), 0) / recentSleep.length
        : 0,
      averageQuality: calculateAverage(recentSleep.map(s => s.quality_rating))
    };

    // Goal Progress - get user's goals with progress
    const userGoals = await db.select()
      .from(goalsTable)
      .where(eq(goalsTable.user_id, userId))
      .orderBy(desc(goalsTable.updated_at))
      .execute();

    const goalProgress = {
      totalGoals: userGoals.length,
      activeGoals: userGoals.filter(goal => goal.status === 'active').length,
      completedGoals: userGoals.filter(goal => goal.status === 'completed').length,
      averageProgress: userGoals.length > 0 
        ? userGoals.reduce((sum, goal) => 
            sum + parseFloat(goal.progress_percentage), 0) / userGoals.length
        : 0,
      goals: userGoals.map(goal => ({
        ...goal,
        target_value: goal.target_value ? parseFloat(goal.target_value) : null,
        progress_percentage: parseFloat(goal.progress_percentage)
      }))
    };

    // Generate basic recommendations based on data
    const recommendations = generateRecommendations({
      activitySummary,
      nutritionSummary,
      wellbeingSummary,
      sleepSummary,
      goalProgress
    });

    return {
      user,
      activitySummary,
      nutritionSummary,
      wellbeingSummary: {
        ...wellbeingSummary,
        sleepSummary
      },
      goalProgress,
      recommendations
    };

  } catch (error) {
    console.error('Get user insights failed:', error);
    throw error;
  }
}

// Helper functions
function getMostCommonValue(values: string[]): string | null {
  if (values.length === 0) return null;
  
  const counts = values.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0];
}

function getAverageIntensity(activities: any[]): string | null {
  const intensities = activities
    .map(a => a.intensity)
    .filter(i => i !== null);
    
  if (intensities.length === 0) return null;
  
  const intensityMap = { low: 1, moderate: 2, high: 3 };
  const reverseMap = { 1: 'low', 2: 'moderate', 3: 'high' };
  
  const avgValue = intensities.reduce((sum, intensity) => 
    sum + intensityMap[intensity as keyof typeof intensityMap], 0) / intensities.length;
    
  return reverseMap[Math.round(avgValue) as keyof typeof reverseMap];
}

function getMealDistribution(nutrition: any[]): Record<string, number> {
  const distribution: Record<string, number> = {
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    snack: 0
  };
  
  nutrition.forEach(entry => {
    if (entry.meal_type) {
      distribution[entry.meal_type] = (distribution[entry.meal_type] || 0) + 1;
    }
  });
  
  return distribution;
}

function calculateAverage(values: (number | null)[]): number | null {
  const validValues = values.filter(v => v !== null) as number[];
  if (validValues.length === 0) return null;
  
  return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
}

function getCommonEmotions(wellbeing: any[]): string[] {
  const emotionCounts: Record<string, number> = {};
  
  wellbeing.forEach(entry => {
    if (entry.emotions && Array.isArray(entry.emotions)) {
      entry.emotions.forEach((emotion: string) => {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });
    }
  });
  
  return Object.entries(emotionCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([emotion]) => emotion);
}

function generateRecommendations(data: any): string[] {
  const recommendations: string[] = [];
  
  // Activity recommendations
  if (data.activitySummary && data.activitySummary.totalActivities < 10) {
    recommendations.push("Try to increase your activity frequency. Aim for at least 3-4 activities per week.");
  }
  
  if (data.activitySummary && data.activitySummary.averageIntensity === 'low') {
    recommendations.push("Consider incorporating more moderate or high-intensity activities for better fitness gains.");
  }
  
  // Nutrition recommendations
  if (data.nutritionSummary && data.nutritionSummary.averageCaloriesPerDay < 1200) {
    recommendations.push("Your calorie intake appears low. Consider consulting with a nutritionist about adequate daily nutrition.");
  }
  
  // Wellbeing recommendations
  if (data.wellbeingSummary && data.wellbeingSummary.averageMood && data.wellbeingSummary.averageMood < 5) {
    recommendations.push("Your mood scores suggest you might benefit from stress management techniques or speaking with a counselor.");
  }
  
  if (data.wellbeingSummary && data.wellbeingSummary.averageStress && data.wellbeingSummary.averageStress > 7) {
    recommendations.push("High stress levels detected. Consider meditation, exercise, or relaxation techniques.");
  }
  
  // Sleep recommendations  
  if (data.sleepSummary && data.sleepSummary.averageDuration < 7) {
    recommendations.push("Aim for 7-9 hours of sleep per night for optimal health and recovery.");
  }
  
  // Goal recommendations
  if (data.goalProgress && data.goalProgress.activeGoals === 0) {
    recommendations.push("Setting specific health and wellness goals can help you stay motivated and track progress.");
  }
  
  if (data.goalProgress && data.goalProgress.averageProgress < 50 && data.goalProgress.activeGoals > 0) {
    recommendations.push("Break down your goals into smaller, achievable milestones to maintain momentum.");
  }
  
  return recommendations;
}
