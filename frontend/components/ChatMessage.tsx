import React from 'react';

interface ChatMessageProps {
  message: {
    id: string;
    user_id: string;
    username: string;
    email: string;
    message: string;
    created_at: string;
  };
  currentUserId: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, currentUserId }) => {
  const isOwnMessage = message.user_id === currentUserId;
  const formattedTime = new Date(message.created_at).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const getInitial = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  return (
    <div className="flex items-start space-x-3 p-3 hover:bg-white/5 transition-colors">
      {/* User Avatar */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-[#eb9e2b] rounded-full flex items-center justify-center text-black font-semibold text-sm">
          {getInitial(message.email)}
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-sm font-medium text-white">
            {isOwnMessage ? 'You' : message.username}
          </span>
          <span className="text-xs text-gray-400">
            {message.email.replace('@questmail.com', '?questmail.com')}
          </span>
          <span className="text-xs text-gray-500">
            {formattedTime}
          </span>
        </div>
        <div className="text-sm text-gray-300 leading-relaxed">
          {message.message}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage; 