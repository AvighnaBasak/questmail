import React from 'react';

interface TypingIndicatorProps {
  isVisible: boolean;
  username?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isVisible, username }) => {
  if (!isVisible) return null;

  return (
    <div className="flex items-center space-x-2 text-gray-400 text-sm italic">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span>{username || 'Someone'} is typing...</span>
    </div>
  );
};

export default TypingIndicator; 