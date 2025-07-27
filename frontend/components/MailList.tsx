import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from 'next/router';
import { TrashIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

interface Mail {
  id: string;
  subject: string;
  body: string;
  read: boolean;
  onetime: boolean;
  html: boolean;
  created_at: string;
  sender?: { email: string } | null;
  recipient?: { email: string } | null;
  thread_id?: string;
}

export type { Mail };

interface MailListProps {
  onSelect?: (mail: Mail) => void;
  refreshKey?: number;
  selectedMailId?: string;
  folder?: string;
  onRefresh?: () => void; // Add callback for refresh
  searchQuery?: string; // New prop for search
}

const MailList: React.FC<MailListProps> = ({ onSelect, refreshKey, selectedMailId, folder = 'inbox', onRefresh, searchQuery }) => {
  const { user } = useAuth();
  const [mails, setMails] = useState<Mail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    
    console.log('MailList query:', { user: user.id, folder }); // Debug log
    
    // Use a simpler query approach that was working
    let query = supabase.from('mails').select('*');
    
    if (folder === 'sent') {
      // For sent mail, filter by sender
      query = query.eq('sender', user.id);
    } else {
      // For other folders, filter by recipient and folder
      query = query.eq('recipient', user.id).eq('folder', folder);
    }
    
    query.order('created_at', { ascending: false })
      .then(async ({ data, error }) => {
        console.log('Mail query result:', { folder, user: user.id, data, error }); // Debug log
        
        if (!error && data) {
          // Fetch email addresses for sender and recipient IDs
          const mailsWithEmails = await Promise.all(
            data.map(async (mail) => {
              // Get sender email
              const { data: senderData } = await supabase
                .from('public_users')
                .select('email')
                .eq('id', mail.sender)
                .single();
              
              // Get recipient email
              const { data: recipientData } = await supabase
                .from('public_users')
                .select('email')
                .eq('id', mail.recipient)
                .single();
              
              return {
                ...mail,
                sender: { email: senderData?.email || 'Unknown' },
                recipient: { email: recipientData?.email || 'Unknown' }
              };
            })
          );
          
          setMails(mailsWithEmails as Mail[]);
        } else {
          console.log('Query error:', error);
          setMails([]);
        }
        setLoading(false);
      });
  }, [user, folder, refreshKey]);

  const handleDelete = async (mailId: string) => {
    console.log('Simple delete for mail:', mailId);
    
    try {
      if (folder === 'sent') {
        // For sent mail, delete attachments first, then delete the mail permanently
        const { error: attachmentError } = await supabase
          .from('attachments')
          .delete()
          .eq('mail_id', mailId);
        
        if (attachmentError) {
          console.log('Attachment delete error:', attachmentError);
        }
        
        const { error: mailError } = await supabase
          .from('mails')
          .delete()
          .eq('id', mailId);
        
        if (mailError) {
          console.log('Mail delete error:', mailError);
          return;
        }
      } else {
        // For inbox, move to trash (revert to previous logic)
        const { error: mailError } = await supabase
          .from('mails')
          .update({ folder: 'trash' })
          .eq('id', mailId);
        
        if (mailError) {
          console.log('Mail update error:', mailError);
          return;
        }
      }
      
      // Remove from UI immediately
      setMails(mails => mails.filter(m => m.id !== mailId));
    } catch (error) {
      console.log('Delete error:', error);
    }
  };

  const getSenderDisplay = (mail: Mail) => {
    if (folder === 'sent') {
      return mail.recipient?.email || 'Unknown';
    }
    return mail.sender?.email || 'Unknown';
  };

  const getSenderLabel = () => {
    return folder === 'sent' ? 'To:' : 'From:';
  };

  let filteredMails = mails;
  if (searchQuery && searchQuery.trim() !== '') {
    const q = searchQuery.trim().toLowerCase();
    filteredMails = mails.filter(mail =>
      (mail.subject && mail.subject.toLowerCase().includes(q)) ||
      (mail.body && mail.body.toLowerCase().includes(q)) ||
      (mail.sender?.email && mail.sender.email.toLowerCase().includes(q)) ||
      (mail.recipient?.email && mail.recipient.email.toLowerCase().includes(q))
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-400">Loading mails...</p>
        </div>
      </div>
    );
  }

  if (filteredMails.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <EnvelopeIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No mails</h3>
          <p className="text-gray-400">
            {folder === 'sent' ? 'No sent messages yet' : 'No messages in this folder'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-white/10">
      {filteredMails.map(mail => (
        <li
          key={mail.id}
          className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-white/5 transition-all group ${
            mail.read ? 'opacity-70' : ''
          } ${selectedMailId === mail.id ? 'bg-white/10 border-l-4 border-white' : ''}`}
        >
          <div className="flex-1" onClick={() => onSelect && onSelect(mail)}>
            <div className="flex items-center gap-2 mb-2">
              {!mail.read && <span className="w-1.5 h-1.5 bg-white rounded-full inline-block" title="Unread" />}
              <EnvelopeIcon className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-semibold text-white truncate max-w-[60%]">
                {mail.subject || '(No subject)'}
              </span>
              {mail.onetime && (
                <span className="ml-2 text-xs text-gray-400 bg-white/10 px-1.5 py-0.5 rounded-full border border-white/20">
                  One-time
                </span>
              )}
            </div>
            <div className="text-sm text-gray-400 truncate">
              {getSenderLabel()} {(getSenderDisplay(mail)).replace('@questmail.com', '?questmail.com')}
            </div>
            <div className="text-gray-500 text-xs mt-1">
              {new Date(mail.created_at).toLocaleString([], { 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
          <button
            className="p-1.5 rounded-2xl hover:bg-white/10 text-gray-400 hover:text-white transition-all opacity-0 group-hover:opacity-100"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(mail.id);
            }}
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </li>
      ))}
    </ul>
  );
};

export default MailList;
