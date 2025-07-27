import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import Image from 'next/image';

const QUESTMAIL_DISPLAY_DOMAIN = '?questmail.com';
const QUESTMAIL_AUTH_DOMAIN = '@questmail.com';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/mail');
    }
  }, [user, authLoading, router]);

  const getEmail = () => `${username}${QUESTMAIL_AUTH_DOMAIN}`;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: getEmail(),
      password,
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({
      email: getEmail(),
      password,
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  if (authLoading || user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white relative overflow-hidden text-[90%]">
      <div className="absolute inset-0 z-0">
        {/* Subtle background pattern */}
        <div className="w-full h-full bg-gradient-to-br from-black via-gray-900 to-black opacity-80" />
      </div>
      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl rounded-3xl px-8 py-10 flex flex-col items-center animate-fadein">
          <div className="flex items-center space-x-3 mb-4">
            <Image 
              src="/logo.png" 
              alt="QuestMail Logo" 
              width={48} 
              height={48}
              className="w-12 h-12 object-contain"
            />
            <h1 className="text-3xl font-extrabold text-white drop-shadow-lg tracking-widest">QuestMail</h1>
          </div>
          <p className="text-base text-gray-300 mb-7 text-center">Sign in or create your private mailbox</p>
          <form className="space-y-4 w-full" onSubmit={handleSignIn}>
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Username"
                className="flex-1 min-w-0 px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 text-sm"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                pattern="^[^@]+$"
                title="Do not include @ or domain, just your username"
                style={{ width: '0', flexGrow: 1 }}
              />
              <span className="ml-2 text-gray-400 font-mono text-sm whitespace-nowrap select-none">{QUESTMAIL_DISPLAY_DOMAIN}</span>
            </div>
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 text-sm"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {error && <div className="text-red-400 text-xs text-center">{error}</div>}
            <button
              type="submit"
              className="w-full py-3 mt-2 bg-[#eb9e2b] hover:bg-[#eb9e2b]/80 text-black font-bold rounded-2xl shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-300 text-base"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div className="text-gray-400 text-center my-4 w-full text-xs">or</div>
          <form className="space-y-4 w-full" onSubmit={handleSignUp}>
            <button
              type="submit"
              className="w-full py-3 bg-black border border-[#eb9e2b]/30 text-white font-bold rounded-2xl shadow-xl hover:scale-105 hover:bg-[#eb9e2b]/10 hover:shadow-2xl transition-all duration-300 text-base"
              disabled={loading}
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>
        </div>
      </div>
      <style jsx>{`
        @keyframes fadein {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: none; }
        }
        .animate-fadein { animation: fadein 0.7s cubic-bezier(.4,0,.2,1) both; }
      `}</style>
    </div>
  );
};

export default Login;
