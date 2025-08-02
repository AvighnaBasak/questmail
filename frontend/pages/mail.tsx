import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/AuthContext';
import Sidebar from '../components/Sidebar';
import MailList from '../components/MailList';
import MailView from '../components/MailView';
import ChatView from '../components/ChatView';
import ComposeModal from '../components/ComposeModal';
import type { Mail } from '../components/MailList';
import { supabase } from '../lib/supabaseClient';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const Mail = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showCompose, setShowCompose] = useState(false);
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [storageUsage, setStorageUsage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchStorageUsage();
    }
  }, [user]);

  const fetchStorageUsage = async () => {
    if (!user) return;
    
    // Calculate actual storage usage from attachments table
    const { data: attachments, error } = await supabase
      .from('attachments')
      .select('size_bytes')
      .eq('uploader', user.id);
    
    if (!error && attachments) {
      const totalBytes = attachments.reduce((sum, att) => sum + (att.size_bytes || 0), 0);
      setStorageUsage(totalBytes);
    } else {
      console.log('Storage calculation error:', error);
      setStorageUsage(0);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const folder = (router.query.folder as string) || 'inbox';

  const handleClearTrash = async () => {
    if (!user) return;
    console.log('Clear trash for user:', user.id);

    // First, get all mail IDs in trash for this user
    const { data: trashMails } = await supabase
      .from('mails')
      .select('id')
      .or(`and(recipient.eq.${user.id},folder.eq.trash),and(sender.eq.${user.id},folder.eq.trash)`);

    if (trashMails && trashMails.length > 0) {
      const mailIds = trashMails.map(mail => mail.id);
      
      // Delete attachments first
      const { error: attachmentError } = await supabase
        .from('attachments')
        .delete()
        .in('mail_id', mailIds);
      
      console.log('Attachment delete result:', attachmentError);

      // Then delete mails where user is recipient and folder is trash
      const { error: recipientError } = await supabase
        .from('mails')
        .delete()
        .eq('recipient', user.id)
        .eq('folder', 'trash');
      
      console.log('Recipient delete result:', recipientError);

      // Delete mails where user is sender and folder is trash  
      const { error: senderError } = await supabase
        .from('mails')
        .delete()
        .eq('sender', user.id)
        .eq('folder', 'trash');
      
      console.log('Sender delete result:', senderError);
    }

    setRefreshKey(k => k + 1);
  };

  return (
    <div className="h-screen bg-black flex flex-col lg:flex-row">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      
      {/* Left Sidebar */}
      <div className={`fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} transition-transform duration-300 ease-in-out`}>
        <Sidebar 
          onCompose={() => setShowCompose(true)} 
          storageUsage={storageUsage}
          currentFolder={folder}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden p-4 border-b border-white/10 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-white capitalize">
            {folder === 'inbox' ? 'Inbox' : 
             folder === 'sent' ? 'Sent Mail' :
             folder === 'spam' ? 'Spam' :
             folder === 'chat' ? 'Chat' : 'Trash'}
          </h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex mb-5 items-center gap-4 p-5">
          <h1 className="text-2xl font-bold text-white capitalize whitespace-nowrap">
            {folder === 'inbox' ? 'Inbox' : 
             folder === 'sent' ? 'Sent Mail' :
             folder === 'spam' ? 'Spam' :
             folder === 'chat' ? '' : 'Trash'}
          </h1>
          {folder !== 'chat' && (
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search mail..."
            className="flex-1 px-5 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-full focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 text-sm transition-all shadow-inner"
            style={{ borderRadius: '2rem', minWidth: 0 }}
          />
          )}
        </div>

        {/* Mobile Search */}
        {folder !== 'chat' && (
          <div className="lg:hidden px-4 pb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search mail..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-full focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 text-sm transition-all shadow-inner"
              style={{ borderRadius: '2rem' }}
            />
          </div>
        )}

        {/* Content Box */}
        <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl lg:rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-0 h-full">
          {folder === 'chat' ? (
            /* Chat View */
            <div className="w-full h-full">
              <ChatView />
            </div>
          ) : (
            <>
          {/* Mail List Section */}
          <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-white/10 relative h-full min-h-0 overflow-y-auto">
            {folder === 'trash' && (
              <button
                className="absolute top-3 right-3 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-medium shadow-md transition-all z-10 border border-white/20"
                onClick={handleClearTrash}
              >
                Clear All
              </button>
            )}
            <MailList 
              onSelect={setSelectedMail} 
              refreshKey={refreshKey} 
              selectedMailId={selectedMail?.id}
              folder={folder}
              onRefresh={() => setRefreshKey(k => k + 1)}
              searchQuery={searchQuery}
            />
          </div>

          {/* Desktop Mail View Section */}
          <div className="hidden lg:flex flex-1 relative h-full min-h-0 overflow-y-auto">
            {selectedMail ? (
              <MailView 
                mail={selectedMail} 
                onClose={() => setSelectedMail(null)}
                onRefresh={() => setRefreshKey(k => k + 1)}
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Select a Mail</h3>
                  <p className="text-gray-400">Choose a message from the list to read</p>
                </div>
              </div>
            )}
          </div>
            </>
          )}
        </div>

        {/* Mobile Mail Overlay */}
        {selectedMail && (
          <div className="lg:hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-white/10 w-full h-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Mail</h3>
                <button
                  onClick={() => setSelectedMail(null)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <MailView 
                  mail={selectedMail} 
                  onClose={() => setSelectedMail(null)}
                  onRefresh={() => setRefreshKey(k => k + 1)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      <ComposeModal 
        open={showCompose} 
        onClose={() => { 
          setShowCompose(false); 
          setRefreshKey(k => k + 1);
        }} 
      />
    </div>
  );
};

export default Mail;
