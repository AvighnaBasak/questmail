import React from 'react';

interface OnlineUsersProps {
  onlineCount: number;
}

const OnlineUsers: React.FC<OnlineUsersProps> = ({ onlineCount }) => {
  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1.5">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-400">Online</span>
      </div>
      <span className="text-sm font-medium text-white">{onlineCount}</span>
    </div>
  );
};

export default OnlineUsers; 