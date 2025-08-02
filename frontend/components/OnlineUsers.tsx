import React from 'react';

interface OnlineUsersProps {
  onlineCount: number;
}

const OnlineUsers: React.FC<OnlineUsersProps> = ({ onlineCount }) => {
  return (
    <div className="flex items-center space-x-1.5 lg:space-x-2">
      <div className="flex items-center space-x-1 lg:space-x-1.5">
        <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-xs lg:text-sm text-gray-400">Online</span>
      </div>
      <span className="text-xs lg:text-sm font-medium text-white">{onlineCount}</span>
    </div>
  );
};

export default OnlineUsers; 