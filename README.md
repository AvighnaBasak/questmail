# QuestMail
![QuestMail Screenshot](https://i.postimg.cc/VvTWwH4q/logo.png)
> **A free, privacy-focused Email**

QuestMail is a modern, open-source email platform inspired by Gmail and TwoBlade, built for privacy lovers. It features a beautiful, dark, minimalist UI, one-time read mails, large attachments, and a focus on user control. Powered by Next.js, Tailwind CSS, and Supabase.

---

## ✨ Features

- **Privacy-First:** No tracking, no ads, no spam. Your emails are yours alone.
- **One-Time Read:** Send self-destructing emails that vanish after being read.
- **Big Attachments:** Send files up to 25MB each, with 100MB total storage per user.
- **HTML & Media:** Send and view beautiful HTML emails, including images and rich formatting.
- **Threaded Conversations:** Reply and view emails as threads, just like Gmail.
- **Real-time Chat:** Live chat feature for users to communicate in real-time.
- **Folders:** Inbox, Sent, Spam, Chat, Trash, and custom folders.
- **Draggable, Resizable Sidebar:** Customizable mail view for productivity.
- **Live Storage Usage:** See your storage usage in real time.
- **Modern UI/UX:** Inspired by TwoBlade, with a dark, monochrome, highly rounded, and minimal design.
- **Supabase Auth:** Secure email/password authentication with custom domain display.
- **Mobile Responsive:** Works great on all devices.

---

## 🛠️ Tech Stack

- **Frontend:** [Next.js](https://nextjs.org/), [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend:** [Supabase](https://supabase.com/) (Auth, Database, Storage, Real-time)
- **Icons:** [Heroicons](https://heroicons.com/)
- **HTML Sanitization:** [dompurify](https://github.com/cure53/DOMPurify)

---

## 📸 Screenshots

![QuestMail Screenshot](https://i.postimg.cc/L6H6zBkT/Screenshot-2025-07-26-231331.png)

---

## 🚀 Getting Started

### 1. **Clone the repository**
```bash
git clone https://github.com/yourusername/questmail.git
cd questmail/frontend
```

### 2. **Install dependencies**
```bash
npm install
# or
yarn install
```

### 3. **Set up Supabase Projects**

#### **Main Mail Project:**
1. Create a Supabase project for your main mail functionality
2. Set up your database schema for emails, attachments, etc.

#### **Chat Project:**
1. Create a **separate** Supabase project for chat functionality
2. Run these SQL commands in your chat project:

```sql
-- Chat messages table
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Online users tracking
CREATE TABLE online_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_online BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_users ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read/write chat messages
CREATE POLICY "Allow all users to read chat messages" ON chat_messages
  FOR ALL USING (true);

CREATE POLICY "Allow all users to write chat messages" ON chat_messages
  FOR INSERT WITH CHECK (true);

-- Allow all users to manage online status
CREATE POLICY "Allow all users to manage online status" ON online_users
  FOR ALL USING (true);

-- Add unique constraint to prevent duplicate users
ALTER TABLE online_users ADD CONSTRAINT unique_user_id UNIQUE (user_id);

-- Function to clean up old chat messages when count exceeds 50
CREATE OR REPLACE FUNCTION cleanup_chat_messages()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM chat_messages 
  WHERE id NOT IN (
    SELECT id FROM chat_messages 
    ORDER BY created_at DESC 
    LIMIT 50
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run cleanup after each insert
CREATE TRIGGER trigger_cleanup_chat_messages
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_chat_messages();
```

3. **Enable Real-time** in your chat Supabase project:
   - Go to Database → Replication
   - Enable real-time for both `chat_messages` and `online_users` tables

### 4. **Set up environment variables**
Create a `.env.local` file in the `frontend` directory:
```env
# Main mail system
NEXT_PUBLIC_SUPABASE_URL=your-mail-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-mail-supabase-anon-key

# Chat system (separate project)
NEXT_PUBLIC_CHAT_SUPABASE_URL=your-chat-supabase-url
NEXT_PUBLIC_CHAT_SUPABASE_ANON_KEY=your-chat-supabase-anon-key
```

### 5. **Run the development server**
```bash
npm run dev
# or
yarn dev
```
Visit [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🌐 Deployment

### **Deploy for Free with [Vercel](https://vercel.com/):**
1. Push your code to GitHub/GitLab/Bitbucket.
2. Import your repo into Vercel and select the `frontend` directory.
3. Set the environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
   - `NEXT_PUBLIC_CHAT_SUPABASE_URL`
   - `NEXT_PUBLIC_CHAT_SUPABASE_ANON_KEY`
4. Click **Deploy**. Your site will be live on a `.vercel.app` domain!

> _Supabase is fully managed in the cloud. No backend deployment needed._

---

## ⚙️ Environment Variables

### **Mail System:**
- `NEXT_PUBLIC_SUPABASE_URL` – Your main Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` – Your main Supabase anon/public key

### **Chat System:**
- `NEXT_PUBLIC_CHAT_SUPABASE_URL` – Your chat Supabase project URL
- `NEXT_PUBLIC_CHAT_SUPABASE_ANON_KEY` – Your chat Supabase anon/public key

> _Never commit secrets or service role keys!_

---

## 💬 Chat Feature

The chat feature provides real-time messaging for QuestMail users:

### **Features:**
- **Real-time messaging** with instant message delivery
- **Online users tracking** with live user count
- **50-message limit** with automatic cleanup of oldest messages
- **User avatars** with initials in circles
- **Typing indicators** when users are composing messages
- **Separate database** from mail system for security

### **How to Access:**
- Click on "Chat" in the sidebar (located under Spam)
- Chat interface opens in the main content area
- Real-time updates across all connected users

### **Technical Details:**
- Uses separate Supabase project for isolation
- Real-time subscriptions for live updates
- Automatic user presence tracking
- Server-side message cleanup

---

## 🙏 Credits
- **Founder:** Avighna Basak
- **Tech:** Next.js, Supabase, Tailwind CSS, Heroicons, DOMPurify

---

