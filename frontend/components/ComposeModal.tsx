import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import UploadBar from './UploadBar';

interface ComposeModalProps {
  open: boolean;
  onClose: () => void;
}

const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_USER_STORAGE = 100 * 1024 * 1024; // 100MB

const ComposeModal: React.FC<ComposeModalProps> = ({ open, onClose }) => {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [htmlMode, setHtmlMode] = useState(false);
  const [oneTime, setOneTime] = useState(false);
  const [attachments, setAttachments] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const [usage, setUsage] = useState<number | null>(null);
  const QUESTMAIL_DOMAIN = '@questmail.com';

  React.useEffect(() => {
    if (!user) return;
    // Skip attachments query for now since uploader column doesn't exist
    setUsage(0);
  }, [user, open]);

  const getRecipientEmail = () => `${recipient}${QUESTMAIL_DOMAIN}`;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!user) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }
    // Check recipient using public_users view
    const { data: recipientUser, error: recErr } = await supabase
      .from('public_users')
      .select('id')
      .eq('email', getRecipientEmail())
      .single();
    if (recErr || !recipientUser) {
      setError('Recipient not found');
      setLoading(false);
      return;
    }
    // Check storage usage
    let totalSize = usage || 0;
    let files: File[] = attachments ? Array.from(attachments) : [];
    for (let file of files) {
      if (file.size > MAX_ATTACHMENT_SIZE) {
        setError(`File ${file.name} exceeds 25MB limit.`);
        setLoading(false);
        return;
      }
      totalSize += file.size;
    }
    if (totalSize > MAX_USER_STORAGE) {
      setError('Total storage usage exceeds 100MB. Delete some attachments.');
      setLoading(false);
      return;
    }
    // Insert mail with user IDs
    const { data: mail, error: mailErr } = await supabase
      .from('mails')
      .insert({
        sender: user.id, // Store user ID
        recipient: recipientUser.id, // Store user ID
        subject,
        body,
        html: htmlMode,
        onetime: oneTime,
        folder: 'inbox', // Explicitly set folder for received mail
      })
      .select()
      .single();
    
    console.log('Mail creation result:', { mail, mailErr, recipientUser }); // Debug log
    
    if (mailErr || !mail) {
      setError('Failed to send mail.');
      setLoading(false);
      return;
    }
    // Upload attachments
    for (let file of files) {
      const { data: upload, error: uploadErr } = await supabase.storage
        .from('attachments')
        .upload(`${user.id}/${mail.id}/${file.name}`, file, { upsert: false });
      if (uploadErr) {
        setError(`Failed to upload ${file.name}`);
        setLoading(false);
        return;
      }
      const file_url = upload.path ? supabase.storage.from('attachments').getPublicUrl(upload.path).data.publicUrl : '';
      await supabase.from('attachments').insert({
        mail_id: mail.id,
        file_url,
        size_bytes: file.size,
        uploader: user.id, // Store user ID
      });
    }
    // Reset and close
    setRecipient('');
    setSubject('');
    setBody('');
    setHtmlMode(false);
    setOneTime(false);
    setAttachments(null);
    setLoading(false);
    setError('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80">
      <div className="bg-black w-full max-w-lg h-full shadow-2xl p-6 flex flex-col relative animate-slideInRight border-l border-white/10">
        <button className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold text-white mb-5">Compose Mail</h2>
        <form className="flex flex-col gap-4 flex-1" onSubmit={handleSend}>
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Recipient username"
              className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 flex-1"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              required
            />
            <span className="ml-2 text-gray-400 font-mono">?questmail.com</span>
          </div>
          <input
            type="text"
            placeholder="Subject"
            className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20"
            value={subject}
            onChange={e => setSubject(e.target.value)}
          />
          <textarea
            placeholder="Message body"
            className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 min-h-[120px] resize-none"
            value={body}
            onChange={e => setBody(e.target.value)}
          />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-gray-300">
              <input type="checkbox" checked={htmlMode} onChange={e => setHtmlMode(e.target.checked)} className="rounded" /> HTML mode
            </label>
            <label className="flex items-center gap-2 text-gray-300">
              <input type="checkbox" checked={oneTime} onChange={e => setOneTime(e.target.checked)} className="rounded" /> One-time read
            </label>
          </div>
          <input
            type="file"
            multiple
            className="text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-2xl file:border-0 file:text-sm file:font-medium file:bg-white/10 file:text-white hover:file:bg-white/20 file:cursor-pointer"
            onChange={e => setAttachments(e.target.files)}
          />
          <UploadBar usage={usage || 0} />
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <button
            type="submit"
            className="mt-4 py-3 bg-[#eb9e2b] hover:bg-[#eb9e2b]/80 text-black font-medium rounded-2xl transition-all duration-300"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ComposeModal;
