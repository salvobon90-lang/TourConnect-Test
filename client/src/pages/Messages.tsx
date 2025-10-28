import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Send, ArrowLeft } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/hooks/useAuth';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { SelectConversation, SelectMessage, User } from '@shared/schema';
import { Logo } from '@/components/logo';
import { BadgeDisplay } from '@/components/badges/BadgeDisplay';
import { TrustLevel } from '@/components/badges/TrustLevel';

interface ConversationWithUser extends SelectConversation {
  otherUser: User;
}

function formatTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return d.toLocaleDateString();
}

function ConversationItem({ 
  conversation, 
  isSelected, 
  onClick 
}: { 
  conversation: ConversationWithUser; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  const { otherUser } = conversation;
  
  return (
    <div
      className={`flex items-center gap-3 p-4 cursor-pointer hover-elevate ${
        isSelected ? 'bg-accent' : ''
      }`}
      onClick={onClick}
      data-testid={`conversation-${conversation.id}`}
    >
      <div className="relative">
        <Avatar>
          <AvatarImage src={otherUser?.profileImageUrl || undefined} />
          <AvatarFallback>{otherUser?.firstName?.[0] || 'U'}</AvatarFallback>
        </Avatar>
        {otherUser?.isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="font-medium truncate">
            {otherUser?.firstName} {otherUser?.lastName}
          </p>
          {otherUser?.trustLevel !== undefined && otherUser.trustLevel !== null && otherUser.trustLevel > 0 && (
            <TrustLevel level={otherUser.trustLevel} variant="badge" showLabel={false} />
          )}
        </div>
        {otherUser?.badges && otherUser.badges.length > 0 && (
          <div className="mb-1">
            <BadgeDisplay badges={otherUser.badges} size="sm" maxVisible={2} />
          </div>
        )}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground truncate">
            {conversation.lastMessagePreview || 'No messages yet'}
          </p>
          <span className="text-xs text-muted-foreground">
            {formatTime(conversation.lastMessageAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ 
  message, 
  isOwn 
}: { 
  message: SelectMessage; 
  isOwn: boolean;
}) {
  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
      data-testid={`message-${message.id}`}
    >
      <div
        className={`max-w-[70%] rounded-lg p-3 ${
          isOwn
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}
      >
        <p className="text-sm break-words">{message.content}</p>
        <p className="text-xs opacity-70 mt-1">
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

function ChatView({ conversationId }: { conversationId: string }) {
  const [messageText, setMessageText] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  const { data: conversation } = useQuery<ConversationWithUser>({
    queryKey: ['/api/conversations', conversationId],
  });
  
  const { data: messages = [] } = useQuery<SelectMessage[]>({
    queryKey: ['/api/conversations', conversationId, 'messages'],
  });
  
  const { sendMessage: sendWsMessage } = useWebSocket((wsMessage) => {
    if (wsMessage.type === 'typing' && wsMessage.conversationId === conversationId) {
      setTypingUsers(prev => new Set(prev).add(wsMessage.userId!));
      setTimeout(() => {
        setTypingUsers(prev => {
          const next = new Set(prev);
          next.delete(wsMessage.userId!);
          return next;
        });
      }, 3000);
    }
    if (wsMessage.type === 'stop_typing' && wsMessage.conversationId === conversationId) {
      setTypingUsers(prev => {
        const next = new Set(prev);
        next.delete(wsMessage.userId!);
        return next;
      });
    }
  });
  
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest('POST', '/api/messages', { conversationId, content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations', conversationId, 'messages'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations'] 
      });
      setMessageText('');
    },
  });
  
  const handleSend = () => {
    if (messageText.trim()) {
      sendMessageMutation.mutate(messageText);
      sendWsMessage({
        type: 'stop_typing',
        conversationId,
      });
    }
  };
  
  const handleTyping = () => {
    sendWsMessage({
      type: 'typing',
      conversationId,
    });
    
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendWsMessage({
        type: 'stop_typing',
        conversationId,
      });
    }, 2000);
  };
  
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const otherUser = conversation?.otherUser;
  const reversedMessages = [...messages].reverse();
  
  return (
    <Card className="flex-1 flex flex-col">
      <div className="p-4 border-b flex items-center gap-3">
        <Avatar>
          <AvatarImage src={otherUser?.profileImageUrl || undefined} />
          <AvatarFallback>{otherUser?.firstName?.[0] || 'U'}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">
            {otherUser?.firstName} {otherUser?.lastName}
          </p>
          <p className="text-xs text-muted-foreground">
            {otherUser?.isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {reversedMessages.map(msg => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === user?.id}
            />
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      
      {typingUsers.size > 0 && (
        <div className="text-xs text-muted-foreground px-4 pb-2">
          {typingUsers.size === 1 ? 'Someone is' : 'Multiple people are'} typing...
        </div>
      )}
      
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            data-testid="input-message"
          />
          <Button 
            onClick={handleSend}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            data-testid="button-send"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function Messages() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: conversations = [] } = useQuery<ConversationWithUser[]>({
    queryKey: ['/api/conversations'],
  });
  
  useWebSocket((wsMessage) => {
    if (wsMessage.type === 'new_message') {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      if (wsMessage.message?.conversationId === selectedConversationId) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/conversations', selectedConversationId, 'messages'] 
        });
      }
    }
    if (wsMessage.type === 'user_online' || wsMessage.type === 'user_offline') {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    }
  });
  
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const otherUser = conv.otherUser;
    const fullName = `${otherUser?.firstName} ${otherUser?.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });
  
  return (
    <div className="flex flex-col h-screen">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Logo className="h-8" />
        </div>
      </header>
      
      <div className="flex flex-1 gap-4 p-4 overflow-hidden">
        <Card className="w-80 flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold mb-4">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search conversations..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-conversations"
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No conversations yet
              </div>
            ) : (
              filteredConversations.map(conv => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isSelected={selectedConversationId === conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                />
              ))
            )}
          </ScrollArea>
        </Card>
        
        {selectedConversationId ? (
          <ChatView conversationId={selectedConversationId} />
        ) : (
          <Card className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">
              Select a conversation to start messaging
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
