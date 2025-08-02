import React, { useState, useRef } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, onTyping, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      // Clear typing indicator
      if (onTyping && isTyping) {
        setIsTyping(false);
        onTyping(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);
    
    // Handle typing indicator
    if (onTyping) {
      if (!isTyping && newMessage.length > 0) {
        setIsTyping(true);
        onTyping(true);
      } else if (isTyping && newMessage.length === 0) {
        setIsTyping(false);
        onTyping(false);
      }
      
      // Clear typing indicator after 3 seconds of no typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      if (newMessage.length > 0) {
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          onTyping(false);
        }, 3000);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 lg:p-4 border-t border-white/10">
      <div className="flex items-end space-x-2 lg:space-x-3">
        <div className="flex-1">
          <textarea
            value={message}
            onChange={handleMessageChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="w-full px-3 lg:px-4 py-2.5 lg:py-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl lg:rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#eb9e2b]/50 focus:border-[#eb9e2b]/50 resize-none transition-all text-sm lg:text-base"
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
            disabled={disabled}
          />
        </div>
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="w-10 h-10 lg:w-12 lg:h-12 bg-[#eb9e2b] hover:bg-[#eb9e2b]/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-medium rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center"
        >
          <PaperAirplaneIcon className="w-3 h-3 lg:w-4 lg:h-4" />
        </button>
      </div>
    </form>
  );
};

export default MessageInput; 