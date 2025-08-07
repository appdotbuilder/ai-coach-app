
import { useState, useEffect, useCallback, useRef } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import type { ChatSession, ChatMessage } from '../../../server/src/schema';

interface ChatInterfaceProps {
  session: ChatSession;
  onDataUpdate?: () => void;
}

export function ChatInterface({ session, onDataUpdate }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getChatMessages.query({ sessionId: session.id });
      setMessages(result);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session.id]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      // Send user message
      const userMessage = await trpc.createChatMessage.mutate({
        session_id: session.id,
        role: 'user',
        content: messageContent,
      });

      setMessages((prev: ChatMessage[]) => [...prev, userMessage]);

      // Generate AI response based on agent type and user message
      const aiResponse = generateAIResponse(messageContent, session.agent_type);
      
      const assistantMessage = await trpc.createChatMessage.mutate({
        session_id: session.id,
        role: 'assistant',
        content: aiResponse,
        metadata: { agent_type: session.agent_type }
      });

      setMessages((prev: ChatMessage[]) => [...prev, assistantMessage]);

      // Process with LLM for data extraction (if implemented)
      try {
        await trpc.processMessageWithLlm.mutate({
          message_id: userMessage.id,
          model_name: 'gpt-3.5-turbo',
          analysis_type: 'data_extraction'
        });
        
        // Notify parent component to refresh data
        if (onDataUpdate) {
          onDataUpdate();
        }
      } catch (error) {
        // LLM processing is optional, don't block the chat
        console.log('LLM processing not available:', error);
      }

    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const generateAIResponse = (userMessage: string, agentType: string): string => {
    // AI response generation based on agent type and message content
    const responses = {
      general: [
        "I understand you're looking for guidance. Let me help you with that! 🤖",
        "That's a great question! Based on your message, here's what I recommend...",
        "I'm here to support you on your wellness journey. Let's work together on this! ✨"
      ],
      nutrition: [
        "Great question about nutrition! 🥗 Let me help you with some dietary insights...",
        "I see you're interested in improving your eating habits. Here's what I suggest...",
        "Nutrition is so important for overall health! Based on what you've shared..."
      ],
      fitness: [
        "Let's talk about getting you more active! 💪 Based on your message...",
        "Exercise is key to feeling great! Here's my recommendation for your fitness journey...",
        "I love your enthusiasm for fitness! Let me help you create a plan..."
      ],
      wellness: [
        "Your mental and emotional wellbeing matters so much! 🧘 Let me share some insights...",
        "I hear you, and it's completely normal to feel this way. Here's what might help...",
        "Taking care of your mental health is so important. Let's explore this together..."
      ],
      goal_setting: [
        "Setting goals is the first step to success! 🎯 Let's break this down...",
        "I love that you're thinking about your goals! Here's how we can approach this...",
        "Goal achievement is all about the right strategy. Based on what you've shared..."
      ],
      analysis: [
        "Let me analyze your data and provide some insights! 📈 From what I can see...",
        "Great data point! Here's what the trends are showing me...",
        "Based on your activity patterns, I've noticed some interesting insights..."
      ]
    };

    const agentResponses = responses[agentType as keyof typeof responses] || responses.general;
    const randomResponse = agentResponses[Math.floor(Math.random() * agentResponses.length)];
    
    // Add some contextual advice based on keywords
    let contextualAdvice = "";
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('tired') || lowerMessage.includes('energy')) {
      contextualAdvice = " Consider checking your sleep schedule and hydration levels. Sometimes a short walk can boost energy too!";
    } else if (lowerMessage.includes('stress') || lowerMessage.includes('anxious')) {
      contextualAdvice = " Try some deep breathing exercises or a quick meditation. Remember, it's okay to take breaks when you need them.";
    } else if (lowerMessage.includes('exercise') || lowerMessage.includes('workout')) {
      contextualAdvice = " Start with activities you enjoy! Even 15-20 minutes of movement can make a difference.";
    } else if (lowerMessage.includes('eat') || lowerMessage.includes('food')) {
      contextualAdvice = " Focus on balanced meals with plenty of vegetables, lean proteins, and whole grains. Hydration is key too!";
    }
    
    return randomResponse + contextualAdvice;
  };

  const getAgentIcon = (agentType: string) => {
    const icons = {
      general: '🤖',
      nutrition: '🥗',
      fitness: '💪',
      wellness: '🧘',
      goal_setting: '🎯',
      analysis: '📈'
    };
    return icons[agentType as keyof typeof icons] || '🤖';
  };

  const getMessageTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className="h-96">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <span>{getAgentIcon(session.agent_type)}</span>
          <span>{session.title || `${session.agent_type} Session`}</span>
          <Badge variant="outline" className="ml-2">
            {session.agent_type}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-full">
        {/* Messages Area */}
        <ScrollArea className="flex-1 mb-4 pr-4" ref={scrollAreaRef}>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin text-2xl mb-2">⏳</div>
                <p className="text-sm text-gray-500">Loading messages...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">{getAgentIcon(session.agent_type)}</div>
              <h3 className="font-semibold mb-2">Start Your Conversation</h3>
              <p className="text-sm text-gray-600 mb-4">
                I'm your {session.agent_type} coach, ready to help you on your wellness journey!
              </p>
              <div className="text-xs text-gray-500">
                Try asking about: health goals, nutrition, exercise, sleep, mood, or anything else!
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message: ChatMessage) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center space-x-1 mb-1">
                      <span className="text-xs font-medium">
                        {message.role === 'user' ? '👤 You' : `${getAgentIcon(session.agent_type)} AI Coach`}
                      </span>
                      <span className="text-xs opacity-70">
                        {getMessageTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <form onSubmit={sendMessage} className="flex space-x-2">
          <Textarea
            value={newMessage}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewMessage(e.target.value)}
            placeholder={`Ask your ${session.agent_type} coach anything...`}
            className="flex-1 min-h-0 resize-none"
            rows={2}
            disabled={isSending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e);
              }
            }}
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || isSending}
            className="px-4"
          >
            {isSending ? '⏳' : '📤'}
          </Button>
        </form>

        {isSending && (
          <div className="mt-2">
            <Alert>
              <AlertDescription className="text-sm">
                🤖 AI Coach is thinking... This may take a moment.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
