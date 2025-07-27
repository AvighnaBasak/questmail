import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/AuthContext';
import Image from 'next/image';
import { 
  InboxIcon, 
  TrashIcon, 
  SparklesIcon, 
  ArrowLeftOnRectangleIcon, 
  PencilSquareIcon,
  PaperAirplaneIcon,
  ShieldExclamationIcon,
  CloudIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  onCompose: () => void;
  storageUsage?: number;
  currentFolder?: string;
}

const MAX_USER_STORAGE = 100 * 1024 * 1024; // 100MB

const navItems = [
  { name: 'Inbox', folder: 'inbox', icon: InboxIcon, count: 0 },
  { name: 'Sent', folder: 'sent', icon: PaperAirplaneIcon, count: 0 },
  { name: 'Spam', folder: 'spam', icon: ShieldExclamationIcon, count: 0 },
  { name: 'Chat', folder: 'chat', icon: ChatBubbleLeftRightIcon, count: 0 },
  { name: 'Trash', folder: 'trash', icon: TrashIcon, count: 0 },
];

const Sidebar: React.FC<SidebarProps> = ({ onCompose, storageUsage = 0, currentFolder = 'inbox' }) => {
  const router = useRouter();
  const { signOut, user } = useAuth();

  const formatStorage = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)}MB`;
  };

  const storagePercentage = (storageUsage / MAX_USER_STORAGE) * 100;

  return (
    <aside className="w-64 bg-black/90 backdrop-blur-xl border-r border-white/10 h-screen flex flex-col shadow-xl">
      {/* Header */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center space-x-3 mb-5">
          <Image 
            src="/logo.png" 
            alt="QuestMail Logo" 
            width={32} 
            height={32}
            className="w-8 h-8 object-contain"
          />
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">QuestMail</h1>
            <p className="text-gray-400 text-sm">{user?.email?.replace('@questmail.com', '?questmail.com')}</p>
          </div>
        </div>

        {/* Compose Button */}
        <button 
          onClick={onCompose}
          className="w-full bg-[#eb9e2b] hover:bg-[#eb9e2b]/80 text-black font-medium py-2.5 px-3 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 group"
        >
          <PencilSquareIcon className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          <span>Compose</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5">
        {navItems.map(item => {
          const isActive = currentFolder === item.folder;
          return (
            <button
              key={item.folder}
              onClick={() => router.push(`/mail?folder=${item.folder}`)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-left font-medium transition-all duration-300 group ${
                isActive
                  ? 'bg-[#eb9e2b]/20 text-[#eb9e2b] border border-[#eb9e2b]/30 shadow-md'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <item.icon className={`w-4 h-4 ${isActive ? 'text-[#eb9e2b]' : 'text-gray-400 group-hover:text-white'}`} />
                <span>{item.name}</span>
              </div>
              {item.count > 0 && (
                <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Storage Usage */}
      <div className="p-3 border-t border-white/10">
        <div className="bg-white/5 rounded-2xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <CloudIcon className="w-4 h-4 text-gray-400" />
              <span className="text-white font-medium text-sm">Storage</span>
            </div>
            <span className="text-gray-400 text-xs">
              {formatStorage(storageUsage)} / 100MB
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-white/10 rounded-full h-1.5 mb-2">
            <div 
              className={`h-1.5 rounded-full transition-all duration-500 ${
                storagePercentage > 90 ? 'bg-white' : 
                storagePercentage > 70 ? 'bg-gray-300' : 'bg-gray-400'
              }`}
              style={{ width: `${Math.min(storagePercentage, 100)}%` }}
            />
          </div>
          
          <div className="text-xs text-gray-400">
            {storagePercentage > 90 ? 'Storage almost full' :
             storagePercentage > 70 ? 'Storage getting full' : 'Plenty of space left'}
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-2xl font-medium transition-all duration-300 group"
        >
          <ArrowLeftOnRectangleIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
