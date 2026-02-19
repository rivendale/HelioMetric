'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useFamilyMembers, useSystemState } from '@/context/SystemState';
import {
  MessageSquare,
  Send,
  Sparkles,
  Calendar,
  Users,
  Compass,
  FileText,
  HelpCircle,
  Clock,
  ChevronDown,
  Loader2,
  Bot,
  User,
  Palette,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  skillUsed?: string;
}

interface Skill {
  type: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

// ============================================================================
// MTG Color Symbols Component
// ============================================================================

function ColorSymbol({ color }: { color: string }) {
  const colorMap: Record<string, { bg: string; text: string; symbol: string }> = {
    White: { bg: 'bg-gray-100', text: 'text-gray-900', symbol: '⚪' },
    Blue: { bg: 'bg-blue-500', text: 'text-white', symbol: '🔵' },
    Black: { bg: 'bg-gray-900', text: 'text-gray-100', symbol: '⚫' },
    Red: { bg: 'bg-red-500', text: 'text-white', symbol: '🔴' },
    Green: { bg: 'bg-green-500', text: 'text-white', symbol: '🟢' },
  };

  const c = colorMap[color];
  if (!c) return null;

  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${c.bg} text-xs`}
      title={color}
    >
      {c.symbol}
    </span>
  );
}

// ============================================================================
// Skills Configuration
// ============================================================================

const SKILLS: Skill[] = [
  {
    type: 'analyze_profile',
    name: 'Analyze Profile',
    description: 'Generate personality profile from zodiac data',
    icon: <Compass className="w-4 h-4" />,
    color: 'text-purple-400',
  },
  {
    type: 'compare_compatibility',
    name: 'Compare Compatibility',
    description: 'Analyze relationship dynamics',
    icon: <Users className="w-4 h-4" />,
    color: 'text-pink-400',
  },
  {
    type: 'forecast_period',
    name: 'Forecast Period',
    description: 'Forecast upcoming time periods',
    icon: <Calendar className="w-4 h-4" />,
    color: 'text-cyan-400',
  },
  {
    type: 'research_patterns',
    name: 'Research Patterns',
    description: 'Investigate patterns and correlations',
    icon: <Sparkles className="w-4 h-4" />,
    color: 'text-yellow-400',
  },
  {
    type: 'explain_concept',
    name: 'Explain Concept',
    description: 'Explain a concept from the system',
    icon: <HelpCircle className="w-4 h-4" />,
    color: 'text-green-400',
  },
  {
    type: 'generate_report',
    name: 'Generate Report',
    description: 'Generate comprehensive analysis report',
    icon: <FileText className="w-4 h-4" />,
    color: 'text-blue-400',
  },
  {
    type: 'discuss',
    name: 'Open Discussion',
    description: 'Free-form research discussion',
    icon: <MessageSquare className="w-4 h-4" />,
    color: 'text-gray-400',
  },
];

// ============================================================================
// Message Component
// ============================================================================

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${isUser ? 'bg-cyan-900/50 border border-cyan-700' : 'bg-purple-900/50 border border-purple-700'}
        `}
      >
        {isUser ? (
          <User className="w-4 h-4 text-cyan-400" />
        ) : (
          <Bot className="w-4 h-4 text-purple-400" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div
          className={`
            inline-block p-3 rounded-lg text-sm
            ${isUser
              ? 'bg-cyan-900/30 border border-cyan-800/50 text-gray-200'
              : 'bg-gray-800/50 border border-gray-700/50 text-gray-200'
            }
          `}
        >
          {/* Skill badge */}
          {message.skillUsed && !isUser && (
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
              <Sparkles className="w-3 h-3" />
              <span>{SKILLS.find(s => s.type === message.skillUsed)?.name || message.skillUsed}</span>
            </div>
          )}

          {/* Message text with basic markdown-like formatting */}
          <div className="whitespace-pre-wrap prose prose-sm prose-invert max-w-none">
            {formatMessageContent(message.content)}
          </div>
        </div>

        {/* Timestamp */}
        <div className="text-xs text-gray-500 mt-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

// Format message content with color symbols
function formatMessageContent(content: string): React.ReactNode {
  // Replace color names with symbols
  const colorPattern = /\b(White|Blue|Black|Red|Green)\s*(⚪|🔵|⚫|🔴|🟢)?/g;

  const parts = content.split(colorPattern);

  return parts.map((part, index) => {
    if (['White', 'Blue', 'Black', 'Red', 'Green'].includes(part)) {
      return (
        <span key={index} className="inline-flex items-center gap-1">
          <ColorSymbol color={part} />
          <span className="font-medium">{part}</span>
        </span>
      );
    }
    // Skip the emoji symbols that might follow color names
    if (['⚪', '🔵', '⚫', '🔴', '🟢'].includes(part)) {
      return null;
    }
    return part;
  });
}

// ============================================================================
// Skill Selector Component
// ============================================================================

function SkillSelector({
  selectedSkill,
  onSelect,
}: {
  selectedSkill: string;
  onSelect: (skill: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = SKILLS.find(s => s.type === selectedSkill) || SKILLS[SKILLS.length - 1];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
      >
        <span className={selected.color}>{selected.icon}</span>
        <span className="text-sm text-gray-300">{selected.name}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10">
          {SKILLS.map((skill) => (
            <button
              key={skill.type}
              onClick={() => {
                onSelect(skill.type);
                setIsOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg
                ${skill.type === selectedSkill ? 'bg-gray-700' : ''}
              `}
            >
              <span className={skill.color}>{skill.icon}</span>
              <div>
                <div className="text-sm text-gray-200">{skill.name}</div>
                <div className="text-xs text-gray-400">{skill.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Quick Actions Component
// ============================================================================

function QuickActions({ onAction }: { onAction: (action: string, context?: Record<string, unknown>) => void }) {
  const { all: members } = useFamilyMembers();

  const actions = [
    {
      label: 'Analyze my color profile',
      action: () => onAction('What are my dominant MTG colors based on my zodiac profile?'),
    },
    {
      label: 'Compare family dynamics',
      action: () => onAction('Analyze the compatibility and dynamics between all family members'),
    },
    {
      label: 'Forecast this month',
      action: () => onAction('What does this month look like for our family based on current energies?'),
    },
    {
      label: 'Explain Wu Xing cycles',
      action: () => onAction('Explain how the Wu Xing generating and overcoming cycles work'),
    },
    {
      label: 'Guild identity analysis',
      action: () => onAction('What guild identities (two-color combinations) are present in our family?'),
    },
  ];

  if (members.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {actions.slice(0, 4).map((action, index) => (
        <button
          key={index}
          onClick={action.action}
          className="px-3 py-1.5 text-xs bg-gray-800/50 border border-gray-700/50 rounded-full hover:bg-gray-700/50 hover:border-gray-600 transition-colors text-gray-300"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// Main Research Panel Component
// ============================================================================

export function ResearchPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('discuss');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${crypto.randomUUID()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { state } = useSystemState();
  const { all: members } = useFamilyMembers();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Build context from current state
  const buildContext = () => {
    const familyContext = members.map((m) => ({
      name: m.name,
      chinese_zodiac: m.zodiacSign.name,
      element: m.zodiacSign.element,
      birth_year: m.birthYear,
      role: m.role,
    }));

    return {
      family_members: familyContext,
      temporal_state: state.temporalState,
      profiles: familyContext,
    };
  };

  // Send message to research agent
  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text) return;

    // Add user message
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const context = buildContext();

      const response = await fetch('/api/research/skill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          skill_type: selectedSkill,
          message: text,
          context,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: data.content,
          timestamp: new Date(),
          skillUsed: data.skill_used,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          id: `error_${Date.now()}`,
          role: 'assistant',
          content: `Error: ${data.error || 'Unknown error occurred'}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Research agent error:', error);
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'Connection error. Please try again later.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle quick actions
  const handleQuickAction = (actionText: string) => {
    sendMessage(actionText);
  };

  // Handle enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <section className="bg-gray-950 border-t border-purple-900/50 pt-6">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-950 border border-purple-800">
          <Bot className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-purple-400 font-[family-name:var(--font-geist-mono)]">
            Research Agent
          </h2>
          <p className="text-xs text-gray-500">
            MTG Color Wheel • Wu Xing Analysis • Zodiac Synthesis
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Palette className="w-4 h-4 text-gray-400" />
          <div className="flex gap-1">
            <ColorSymbol color="White" />
            <ColorSymbol color="Blue" />
            <ColorSymbol color="Black" />
            <ColorSymbol color="Red" />
            <ColorSymbol color="Green" />
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        {/* Messages Area */}
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Bot className="w-12 h-12 text-purple-400/50 mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                Research Agent Ready
              </h3>
              <p className="text-sm text-gray-500 max-w-md mb-4">
                Ask questions about zodiac profiles, compatibility analysis,
                MTG color wheel philosophy, and more. The agent integrates
                Eastern and Western systems for comprehensive insights.
              </p>
              <QuickActions onAction={handleQuickAction} />
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-900/50 border border-purple-700 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>Researching...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-800 p-4">
          {/* Quick actions when there are messages */}
          {messages.length > 0 && <QuickActions onAction={handleQuickAction} />}

          <div className="flex gap-3">
            {/* Skill Selector */}
            <SkillSelector
              selectedSkill={selectedSkill}
              onSelect={setSelectedSkill}
            />

            {/* Input Field */}
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about zodiac profiles, color wheel philosophy, compatibility..."
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500"
                rows={1}
                disabled={isLoading}
              />
            </div>

            {/* Send Button */}
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </button>
          </div>

          {/* Session info */}
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>Session: {sessionId.slice(-8)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-3 h-3" />
              <span>{members.length} family members in context</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-600 pt-4 mt-4 border-t border-gray-800">
        Research Agent v1.0 • Powered by Claude • MTG Color Wheel Framework
      </div>
    </section>
  );
}

export default ResearchPanel;
