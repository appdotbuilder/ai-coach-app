
import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import type { Goal, CreateGoalInput, UpdateGoalInput } from '../../../server/src/schema';

interface GoalManagerProps {
  userId: number;
  goals: Goal[];
  onGoalsUpdate: () => void;
}

export function GoalManager({ userId, goals, onGoalsUpdate }: GoalManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  const [createForm, setCreateForm] = useState<Partial<CreateGoalInput>>({
    user_id: userId,
    category: 'fitness',
    title: '',
    description: '',
    target_value: 0,
    target_unit: '',
    target_date: null
  });

  const [updateForm, setUpdateForm] = useState<Partial<UpdateGoalInput>>({
    status: 'active',
    progress_percentage: 0
  });

  const createGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title?.trim()) return;

    setIsCreating(true);
    try {
      await trpc.createGoal.mutate({
        user_id: userId,
        category: createForm.category as 'fitness' | 'nutrition' | 'wellness' | 'sleep' | 'personal',
        title: createForm.title,
        description: createForm.description || null,
        target_value: createForm.target_value || null,
        target_unit: createForm.target_unit || null,
        target_date: createForm.target_date ? new Date(createForm.target_date) : null
      });

      // Reset form
      setCreateForm({
        user_id: userId,
        category: 'fitness',
        title: '',
        description: '',
        target_value: 0,
        target_unit: '',
        target_date: null
      });
      
      setIsCreateDialogOpen(false);
      onGoalsUpdate();
    } catch (error) {
      console.error('Failed to create goal:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const updateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;

    setIsUpdating(true);
    try {
      await trpc.updateGoal.mutate({
        id: selectedGoal.id,
        ...updateForm
      });
      
      setIsUpdateDialogOpen(false);
      setSelectedGoal(null);
      onGoalsUpdate();
    } catch (error) {
      console.error('Failed to update goal:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const openUpdateDialog = (goal: Goal) => {
    setSelectedGoal(goal);
    setUpdateForm({
      status: goal.status,
      progress_percentage: goal.progress_percentage,
      title: goal.title,
      description: goal.description,
      target_value: goal.target_value,
      target_unit: goal.target_unit,
      target_date: goal.target_date
    });
    setIsUpdateDialogOpen(true);
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      fitness: '💪',
      nutrition: '🥗',
      wellness: '🧘',
      sleep: '😴',
      personal: '⭐'
    };
    return icons[category as keyof typeof icons] || '🎯';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const activeGoals = goals.filter((g: Goal) => g.status === 'active');
  const completedGoals = goals.filter((g: Goal) => g.status === 'completed');
  const otherGoals = goals.filter((g: Goal) => !['active', 'completed'].includes(g.status));

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">🎯 Goal Management</h2>
          <p className="text-gray-600">Track and manage your wellness goals</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <span className="mr-2">➕</span>
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>
                Set a new wellness goal to track your progress
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={createGoal} className="space-y-4">
              <Select
                value={createForm.category || 'fitness'}
                onValueChange={(value: 'fitness' | 'nutrition' | 'wellness' | 'sleep' | 'personal') =>
                  setCreateForm((prev: Partial<CreateGoalInput>) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fitness">💪 Fitness</SelectItem>
                  <SelectItem value="nutrition">🥗 Nutrition</SelectItem>
                  <SelectItem value="wellness">🧘 Wellness</SelectItem>
                  <SelectItem value="sleep">😴 Sleep</SelectItem>
                  <SelectItem value="personal">⭐ Personal</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Goal title"
                value={createForm.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCreateForm((prev: Partial<CreateGoalInput>) => ({ ...prev, title: e.target.value }))
                }
                required
              />

              <Textarea
                placeholder="Description (optional)"
                value={createForm.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setCreateForm((prev: Partial<CreateGoalInput>) => ({ 
                    ...prev, 
                    description: e.target.value || null 
                  }))
                }
                rows={3}
              />

              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Target value"
                  value={createForm.target_value || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: Partial<CreateGoalInput>) => ({ 
                      ...prev, 
                      target_value: parseFloat(e.target.value) || null 
                    }))
                  }
                />
                <Input
                  placeholder="Unit (e.g., lbs, hours)"
                  value={createForm.target_unit || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateForm((prev: Partial<CreateGoalInput>) => ({ 
                      ...prev, 
                      target_unit: e.target.value || null 
                    }))
                  }
                />
              </div>

              <Input
                type="date"
                value={createForm.target_date ? createForm.target_date.toString().split('T')[0] : ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCreateForm((prev: Partial<CreateGoalInput>) => ({ 
                    ...prev, 
                    target_date: e.target.value ? e.target.value as unknown as Date : null 
                  }))
                }
              />

              <Button type="submit" disabled={isCreating} className="w-full">
                {isCreating ? 'Creating...' : 'Create Goal'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-20">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">No Goals Yet</h3>
            <p className="text-gray-600 mb-6">
              Start your wellness journey by setting your first goal!
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              🚀 Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active Goals */}
          {activeGoals.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">🎯</span>
                Active Goals ({activeGoals.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeGoals.map((goal: Goal) => (
                  <Card key={goal.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span>{getCategoryIcon(goal.category)}</span>
                          <Badge variant="secondary" className={getStatusColor(goal.status)}>
                            {goal.status}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openUpdateDialog(goal)}
                        >
                          ✏️
                        </Button>
                      </div>
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      {goal.description && (
                        <CardDescription>{goal.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{goal.progress_percentage}%</span>
                          </div>
                          <Progress value={goal.progress_percentage} className="h-2" />
                        </div>
                        
                        {goal.target_value && goal.target_unit && (
                          <p className="text-sm text-gray-600">
                            Target: {goal.target_value} {goal.target_unit}
                          </p>
                        )}
                        
                        {goal.target_date && (
                          <p className="text-sm text-gray-600">
                            Due: {goal.target_date.toLocaleDateString()}
                          </p>
                        )}
                        
                        <p className="text-xs text-gray-500">
                          Created: {goal.created_at.toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <div>
              <Separator />
              <h3 className="text-lg font-semibold mb-4 flex items-center text-green-600">
                <span className="mr-2">🎉</span>
                Completed Goals ({completedGoals.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedGoals.map((goal: Goal) => (
                  <Card key={goal.id} className="border-green-200 bg-green-50">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span>{getCategoryIcon(goal.category)}</span>
                          <Badge className="bg-green-100 text-green-800">
                            ✅ Completed
                          </Badge>
                        </div>
                      </div>
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Progress value={100} className="h-2 bg-green-200" />
                        <p className="text-sm text-green-700">
                          🎊 Congratulations on achieving this goal!
                        </p>
                        <p className="text-xs text-gray-600">
                          Completed: {goal.updated_at.toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Other Goals */}
          {otherGoals.length > 0 && (
            <div>
              <Separator />
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">📋</span>
                Other Goals ({otherGoals.length})
              </h3>
              <div className="space-y-2">
                {otherGoals.map((goal: Goal) => (
                  <Card key={goal.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span>{getCategoryIcon(goal.category)}</span>
                          <div>
                            <p className="font-medium">{goal.title}</p>
                            <p className="text-sm text-gray-600">{goal.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={getStatusColor(goal.status)}>
                            {goal.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openUpdateDialog(goal)}
                          >
                            ✏️
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Update Goal Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Goal</DialogTitle>
            <DialogDescription>
              Modify goal details and progress
            </DialogDescription>
          </DialogHeader>
          {selectedGoal && (
            <form onSubmit={updateGoal} className="space-y-4">
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <span>{getCategoryIcon(selectedGoal.category)}</span>
                <span className="font-medium">{selectedGoal.title}</span>
              </div>

              <Select
                value={updateForm.status || 'active'}
                onValueChange={(value: 'active' | 'completed' | 'paused' | 'cancelled') =>
                  setUpdateForm((prev: Partial<UpdateGoalInput>) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">🎯 Active</SelectItem>
                  <SelectItem value="completed">✅ Completed</SelectItem>
                  <SelectItem value="paused">⏸️ Paused</SelectItem>
                  <SelectItem value="cancelled">❌ Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Progress: {updateForm.progress_percentage}%
                </label>
                <Input
                  type="range"
                  min="0"
                  max="100"
                  value={updateForm.progress_percentage}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUpdateForm((prev: Partial<UpdateGoalInput>) => ({ 
                      ...prev, 
                      progress_percentage: parseInt(e.target.value) 
                    }))
                  }
                />
              </div>

              <Button type="submit" disabled={isUpdating} className="w-full">
                {isUpdating ? 'Updating...' : 'Update Goal'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Tips */}
      <Alert>
        <AlertDescription>
          💡 <strong>Pro Tip:</strong> Set specific, measurable goals with target dates for better results. 
          Chat with the goal-setting AI coach for personalized goal-setting strategies!
        </AlertDescription>
      </Alert>
    </div>
  );
}
