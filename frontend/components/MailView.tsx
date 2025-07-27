import { XMarkIcon, TrashIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
// @ts-ignore
import DOMPurify from 'dompurify';
import type { Mail } from './MailList';

interface Attachment {
  id: string;
  file_url: string;
  size_bytes: number;
  mail_id: string;
}

interface ThreadMail {
  id: string;
  sender: { email: string } | null;
  body: string;
  created_at: string;
  thread_id?: string;
  html?: boolean;
}

interface MailViewProps {
  mail: Mail | null;
  onClose?: () => void;
  onRefresh?: () => void;
}

const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
const isVideo = (url: string) => /\.(mp4|webm|ogg)$/i.test(url);

const MailView: React.FC<MailViewProps> = ({ mail, onClose, onRefresh }) => {
  const [deleted, setDeleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [dragging, setDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(600);
  const [thread, setThread] = useState<ThreadMail[]>([]);
  const [reply, setReply] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  // New state for reply features
  const [replyHtmlMode, setReplyHtmlMode] = useState(false);
  const [replyAttachments, setReplyAttachments] = useState<FileList | null>(null);
  const [replyError, setReplyError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!mail) return;

    // Mark as read and handle one-time read
    const markAsRead = async () => {
      if (!mail.read) {
        await supabase.from('mails').update({ read: true }).eq('id', mail.id);
        // Do NOT delete here for one-time mails; deletion is handled on close
      }
    };
    markAsRead();

    // --- THREAD LOGIC FIX ---
    // Find the root thread id (if mail.thread_id exists, use it, else use mail.id)
    const rootThreadId = mail.thread_id || mail.id;
    console.log('Fetching thread for rootThreadId:', rootThreadId);
    
    // Fetch all mails in this thread (including the root mail)
    supabase
      .from('mails')
      .select('id, sender, body, created_at, html')
      .or(`thread_id.eq.${rootThreadId},id.eq.${rootThreadId}`)
      .order('created_at', { ascending: true })
      .then(async ({ data, error }) => {
        console.log('Raw thread data:', data);
        if (!error && data) {
          // Remove duplicates based on id
          const uniqueMails = data.filter((mail, index, self) => 
            index === self.findIndex(m => m.id === mail.id)
          );
          console.log('Unique mails after filter:', uniqueMails);
          // Fetch email addresses for sender IDs
          const threadWithEmails = await Promise.all(
            uniqueMails.map(async (threadMail) => {
              const { data: senderData } = await supabase
                .from('public_users')
                .select('email')
                .eq('id', threadMail.sender)
                .single();
              return {
                ...threadMail,
                sender: { email: senderData?.email || 'Unknown' }
              };
            })
          );
          console.log('Final thread with emails:', threadWithEmails);
          setThread(threadWithEmails);
          // Fetch all attachments for all mails in the thread
          const mailIds = uniqueMails.map(m => m.id);
          console.log('Fetching attachments for mail IDs:', mailIds);
          if (mailIds.length > 0) {
            const { data: allAtts, error: attError } = await supabase
              .from('attachments')
              .select('*')
              .in('mail_id', mailIds);
            console.log('Attachments fetch result:', { allAtts, attError });
            setAttachments(allAtts || []);
          } else {
            setAttachments([]);
          }
        }
      });
  }, [mail?.id, onRefresh]);

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setStartX(e.clientX);
    setStartWidth(width);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (dragging) {
      const newWidth = startWidth - (e.clientX - startX);
      setWidth(Math.max(400, Math.min(800, newWidth)));
    }
  };

  const onMouseUp = () => {
    setDragging(false);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !mail) return;
    setReplyLoading(true);
    setReplyError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setReplyLoading(false);
      return;
    }
    // Find recipient (original sender) using public_users view
    const { data: recipientUser } = await supabase
      .from('public_users')
      .select('id')
      .eq('email', mail.sender?.email)
      .single();
    // Find the root thread id (if mail.thread_id exists, use it, else use mail.id)
    const rootThreadId = mail.thread_id || mail.id;
    let newMailId = null;
    if (recipientUser) {
      // Insert reply mail
      const { data: replyMail, error: replyMailErr } = await supabase.from('mails').insert({
        sender: user.id,
        recipient: recipientUser.id,
        subject: `Re: ${mail.subject}`,
        body: reply,
        html: replyHtmlMode,
        thread_id: rootThreadId,
        folder: 'inbox',
      }).select().single();
      if (replyMailErr || !replyMail) {
        setReplyError('Failed to send reply.');
        setReplyLoading(false);
        return;
      }
      newMailId = replyMail.id;
      // Upload attachments if any
      if (replyAttachments && replyAttachments.length > 0) {
        for (let i = 0; i < replyAttachments.length; i++) {
          const file = replyAttachments[i];
          const { data: upload, error: uploadErr } = await supabase.storage
            .from('attachments')
            .upload(`${user.id}/${newMailId}/${file.name}`, file, { upsert: false });
          if (uploadErr) {
            setReplyError(`Failed to upload ${file.name}`);
            setReplyLoading(false);
            return;
          }
          const file_url = upload.path ? supabase.storage.from('attachments').getPublicUrl(upload.path).data.publicUrl : '';
          await supabase.from('attachments').insert({
            mail_id: newMailId,
            file_url,
            size_bytes: file.size,
            uploader: user.id,
          });
        }
      }
      setReply('');
      setReplyHtmlMode(false);
      setReplyAttachments(null);
      // Refresh the thread to show the new reply
      supabase
        .from('mails')
        .select('id, sender, body, created_at, html')
        .or(`thread_id.eq.${rootThreadId},id.eq.${rootThreadId}`)
        .order('created_at', { ascending: true })
        .then(async ({ data, error }) => {
          if (!error && data) {
            // Remove duplicates based on id
            const uniqueMails = data.filter((mail, index, self) => 
              index === self.findIndex(m => m.id === mail.id)
            );
            const threadWithEmails = await Promise.all(
              uniqueMails.map(async (threadMail) => {
                const { data: senderData } = await supabase
                  .from('public_users')
                  .select('email')
                  .eq('id', threadMail.sender)
                  .single();
                return {
                  ...threadMail,
                  sender: { email: senderData?.email || 'Unknown' }
                };
              })
            );
            setThread(threadWithEmails);
          }
        });
      if (onRefresh) onRefresh();
    }
    setReplyLoading(false);
  };

  const handleDelete = async () => {
    if (!mail) return;
    
    console.log('Simple delete from MailView for mail:', mail.id);
    
    await supabase.from('mails').update({ folder: 'trash' }).eq('id', mail.id);
    
    if (onClose) onClose();
  };

  // Custom close handler for one-time mails
  const handleClose = async () => {
    if (mail?.onetime) {
      // Delete attachments first
      await supabase.from('attachments').delete().eq('mail_id', mail.id);
      // Then delete the mail
      await supabase.from('mails').delete().eq('id', mail.id);
      setDeleted(true);
      if (onRefresh) onRefresh();
      if (onClose) onClose();
      return;
    }
    if (onClose) onClose();
  };

  if (!mail) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (deleted) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <XMarkIcon className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Mail Deleted</h3>
          <p className="text-gray-400">This one-time read mail has been deleted.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className="min-h-full bg-white/5 backdrop-blur-sm border-l border-white/10 flex flex-col transition-all min-w-0"
      style={{ minWidth: width }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b border-white/10 p-5 flex-shrink-0">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-xl font-bold text-white">{mail.subject || '(No subject)'}</h2>
            {mail.onetime && (
              <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded-full border border-white/20">
                One-time
              </span>
            )}
          </div>
          <div className="space-y-1">
            <div className="text-sm text-gray-400">
              From: <span className="text-white">{(mail.sender?.email || 'Unknown').replace('@questmail.com', '?questmail.com')}</span>
            </div>
            <div className="text-sm text-gray-400">
              {new Date(mail.created_at).toLocaleString()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-1.5 rounded-2xl hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            title="Delete"
            onClick={handleDelete}
          >
            <TrashIcon className="w-5 h-5" />
          </button>
          {onClose && (
            <button
              className="p-1.5 rounded-2xl hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              onClick={handleClose}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 min-h-0">
        {/* Threaded conversation: render all mails in thread, including the main mail */}
        {thread.length > 0 && (
          <div className="space-y-4">
            {thread.map((reply, index) => (
              <div key={reply.id} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-medium text-sm">
                    {(reply.sender?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium">
                      {(reply.sender?.email || 'Unknown').replace('@questmail.com', '?questmail.com')}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(reply.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="text-gray-300 text-sm whitespace-pre-wrap">
                    {reply.html
                      ? <div
                          className="prose prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(reply.body) }}
                        />
                      : reply.body}
                  </div>
                  {/* Attachments for this message */}
                  {attachments.filter(att => att.mail_id === reply.id).length > 0 && (
                    <div className="mt-2 grid grid-cols-1 gap-3">
                      {attachments.filter(att => att.mail_id === reply.id).map(att => {
                        console.log('Rendering attachment:', att);
                        return (
                          <div key={att.id} className="bg-white/5 rounded-2xl p-3 border border-white/10">
                            {isImage(att.file_url) ? (
                              <img
                                src={att.file_url}
                                alt="attachment"
                                className="max-w-full max-h-80 rounded-2xl shadow-lg mb-3"
                                onError={(e) => console.log('Image failed to load:', att.file_url, e)}
                              />
                            ) : isVideo(att.file_url) ? (
                              <video
                                src={att.file_url}
                                controls
                                className="max-w-full max-h-80 rounded-2xl shadow-lg mb-3"
                                onError={(e) => console.log('Video failed to load:', att.file_url, e)}
                              />
                            ) : null}
                            <a
                              href={att.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-300 hover:text-white text-sm font-medium flex items-center gap-2"
                            >
                              <span>{att.file_url.split('/').pop()}</span>
                              <span className="text-gray-400">
                                ({(att.size_bytes / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reply box: only show if not one-time mail */}
        {!mail.onetime && (
          <form onSubmit={handleReply} className="mt-6">
            {replyHtmlMode ? (
              <textarea
                className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 resize-none mb-3 font-mono"
                placeholder="Write your reply (HTML supported)..."
                value={reply}
                onChange={e => setReply(e.target.value)}
                rows={3}
              />
            ) : (
              <textarea
                className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 resize-none mb-3"
                placeholder="Write your reply..."
                value={reply}
                onChange={e => setReply(e.target.value)}
                rows={3}
              />
            )}
            <div className="flex items-center gap-3 mb-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-[#eb9e2b] hover:bg-[#eb9e2b]/80 text-black font-medium rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={replyLoading || !reply.trim()}
              >
                <PaperAirplaneIcon className="w-4 h-4" />
                {replyLoading ? 'Sending...' : 'Send'}
              </button>
              <button
                type="button"
                className={`p-2 text-gray-400 hover:text-white transition-all ${replyHtmlMode ? 'bg-white/10 text-white' : ''}`}
                title="Format (HTML mode)"
                onClick={() => setReplyHtmlMode(v => !v)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </button>
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-white transition-all"
                title="Attach file"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <input
                type="file"
                multiple
                ref={fileInputRef}
                className="hidden"
                onChange={e => setReplyAttachments(e.target.files)}
              />
            </div>
            {/* Show selected attachments */}
            {replyAttachments && replyAttachments.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {Array.from(replyAttachments).map(file => (
                  <span key={file.name} className="bg-white/10 text-white px-2 py-1 rounded-2xl text-xs border border-white/20">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                ))}
              </div>
            )}
            {replyError && <div className="text-red-400 text-sm mb-2">{replyError}</div>}
          </form>
        )}
      </div>

      {/* Resize handle */}
      <div
        className="absolute left-0 top-0 h-full w-1 cursor-ew-resize bg-white/10 hover:bg-white/20 transition-colors"
        onMouseDown={onMouseDown}
      />
    </div>
  );
};

export default MailView;
