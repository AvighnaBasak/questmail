import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../lib/AuthContext';
import { chatSupabase } from '../lib/chatSupabaseClient';
import ChatMessage from './ChatMessage';
import OnlineUsers from './OnlineUsers';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';

interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  email: string;
  message: string;
  created_at: string;
}

interface OnlineUser {
  id: string;
  user_id: string;
  username: string;
  email: string;
  last_seen: string;
  is_online: boolean;
}

const ChatView: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    // Add user to online users when they enter chat
    const addUserToOnline = async () => {
      try {
        const username = user.email?.replace('@questmail.com', '') || 'Unknown';
        
        // Upsert user to online_users table (insert or update if exists)
        const { error } = await chatSupabase
          .from('online_users')
          .upsert({
            user_id: user.id,
            username: username,
            email: user.email || '',
            last_seen: new Date().toISOString(),
            is_online: true
          }, { onConflict: 'user_id' });

        if (error) {
          console.error('Error adding user to online:', error);
        }
      } catch (err) {
        console.error('Error adding user to online:', err);
      }
    };

    addUserToOnline();

    // Add page unload listener to remove user when they close/refresh
    const handleBeforeUnload = () => {
      if (user) {
        chatSupabase
          .from('online_users')
          .delete()
          .eq('user_id', user.id);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Load initial messages
    const loadMessages = async () => {
      try {
        const { data, error } = await chatSupabase
          .from('chat_messages')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(50);

        if (error) {
          console.error('Error loading messages:', error);
          setError('Failed to load messages');
        } else if (data) {
          setMessages(data);
        }
      } catch (err) {
        console.error('Error loading messages:', err);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // Subscribe to new messages
    const messagesSubscription = chatSupabase
      .channel('chat_messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => {
            // Check if message already exists to avoid duplicates
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev;
            }
            const updated = [...prev, newMessage];
            // Keep only the last 50 messages
            if (updated.length > 50) {
              return updated.slice(-50);
            }
            return updated;
          });
          setError(null); // Clear any previous errors
        }
      )
      .subscribe();

    // Subscribe to online users changes
    const onlineUsersSubscription = chatSupabase
      .channel('online_users')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'online_users' },
        () => {
          // Refresh online users list
          loadOnlineUsers();
        }
      )
      .subscribe();

    const loadOnlineUsers = async () => {
      try {
        const { data, error } = await chatSupabase
          .from('online_users')
          .select('*');

        if (error) {
          console.error('Error loading online users:', error);
        } else if (data) {
          setOnlineUsers(data);
        }
      } catch (err) {
        console.error('Error loading online users:', err);
      }
    };

    loadOnlineUsers();

    // No need for interval updates - keep it simple

    // Cleanup function
    return () => {
      messagesSubscription.unsubscribe();
      onlineUsersSubscription.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Remove user from online users when leaving chat
      if (user) {
        // Use a more reliable cleanup method
        const removeUser = async () => {
          try {
            await chatSupabase
              .from('online_users')
              .delete()
              .eq('user_id', user.id);
            console.log('User removed from online users:', user.id);
          } catch (error) {
            console.error('Error removing user from online:', error);
          }
        };
        removeUser();
      }
    };
  }, [user]);

  const handleSendMessage = async (messageText: string) => {
    if (!user || !messageText.trim()) return;

    setSending(true);
    setError(null);
    
    try {
      const username = user.email?.replace('@questmail.com', '') || 'Unknown';

      const { error } = await chatSupabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          username: username,
          email: user.email || '',
          message: messageText
        });

      if (error) {
        console.error('Error sending message:', error);
        setError('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-lg">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Chat</h2>
        <OnlineUsers onlineCount={onlineUsers.length} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-2 p-3 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No messages yet</h3>
              <p className="text-gray-400">Be the first to start the conversation!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                currentUserId={user?.id || ''}
              />
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.filter(id => id !== user?.id).length > 0 && (
        <div className="px-4 py-2 border-t border-white/10">
          <TypingIndicator 
            isVisible={true} 
            username={typingUsers.filter(id => id !== user?.id).map(id => {
              const user = onlineUsers.find(u => u.user_id === id);
              return user?.username || 'Someone';
            }).join(', ')}
          />
        </div>
      )}

      {/* Message Input */}
      <MessageInput 
        onSendMessage={handleSendMessage} 
        onTyping={(isTyping) => {
          // In a real implementation, you'd broadcast typing status to other users
          // For now, we'll just handle it locally
          if (isTyping) {
            setTypingUsers(prev => {
              if (!prev.includes(user?.id || '')) {
                return [...prev, user?.id || ''];
              }
              return prev;
            });
          } else {
            setTypingUsers(prev => prev.filter(id => id !== user?.id));
          }
        }}
        disabled={sending} 
      />
    </div>
  );
};

export default ChatView; 