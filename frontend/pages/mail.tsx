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

const Mail = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showCompose, setShowCompose] = useState(false);
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [storageUsage, setStorageUsage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

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
    <div className="h-screen bg-black flex">
      {/* Left Sidebar */}
      <Sidebar 
        onCompose={() => setShowCompose(true)} 
        storageUsage={storageUsage}
        currentFolder={folder}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-5 min-h-0 overflow-hidden">
        {/* Header */}
        <div className="mb-5 flex items-center gap-4">
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
              className="ml-4 px-5 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-full focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 text-sm transition-all shadow-inner flex-1"
              style={{ borderRadius: '2rem', minWidth: 0 }}
            />
          )}
        </div>

        {/* Content Box */}
        <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex min-h-0 h-full">
          {folder === 'chat' ? (
            /* Chat View */
            <div className="w-full h-full">
              <ChatView />
            </div>
          ) : (
            <>
              {/* Mail List Section */}
              <div className="w-1/2 border-r border-white/10 relative h-full min-h-0 overflow-y-auto">
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

              {/* Mail View Section */}
              <div className="flex-1 relative h-full min-h-0 overflow-y-auto">
                {selectedMail ? (
                  <MailView 
                    mail={selectedMail} 
                    onClose={() => setSelectedMail(null)}
                    onRefresh={() => setRefreshKey(k => k + 1)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
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
