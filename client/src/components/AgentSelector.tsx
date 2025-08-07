
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface AgentSelectorProps {
  onSelectAgent: (agentType: 'general' | 'nutrition' | 'fitness' | 'wellness' | 'goal_setting' | 'analysis') => void;
  disabled?: boolean;
}

const agentTypes = [
  {
    type: 'general' as const,
    name: 'General Coach',
    description: 'All-around wellness guidance',
    icon: '🤖',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    type: 'nutrition' as const,
    name: 'Nutrition Expert',
    description: 'Diet and meal planning',
    icon: '🥗',
    color: 'bg-green-100 text-green-800'
  },
  {
    type: 'fitness' as const,
    name: 'Fitness Trainer',
    description: 'Exercise and activity coaching',
    icon: '💪',
    color: 'bg-orange-100 text-orange-800'
  },
  {
    type: 'wellness' as const,
    name: 'Wellness Guide',
    description: 'Mental health and wellbeing',
    icon: '🧘',
    color: 'bg-purple-100 text-purple-800'
  },
  {
    type: 'goal_setting' as const,
    name: 'Goal Setter',
    description: 'Achievement and motivation',
    icon: '🎯',
    color: 'bg-red-100 text-red-800'
  },
  {
    type: 'analysis' as const,
    name: 'Data Analyst',
    description: 'Insights and progress tracking',
    icon: '📈',
    color: 'bg-indigo-100 text-indigo-800'
  }
];

export function AgentSelector({ onSelectAgent, disabled = false }: AgentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectAgent = (agentType: typeof agentTypes[0]['type']) => {
    onSelectAgent(agentType);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button disabled={disabled} className="relative">
          <span className="mr-2">🤖</span>
          New Session
          <span className="ml-2">⬇️</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <div className="p-2">
          <h3 className="font-semibold text-sm mb-2 text-gray-700">
            Choose Your AI Agent
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Select a specialized coach for personalized assistance
          </p>
        </div>
        <DropdownMenuSeparator />
        {agentTypes.map((agent) => (
          <DropdownMenuItem
            key={agent.type}
            className="flex flex-col items-start p-3 cursor-pointer"
            onClick={() => handleSelectAgent(agent.type)}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{agent.icon}</span>
                <span className="font-medium">{agent.name}</span>
              </div>
              <Badge variant="secondary" className={`text-xs ${agent.color}`}>
                {agent.type}
              </Badge>
            </div>
            <p className="text-xs text-gray-600 ml-7">{agent.description}</p>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
