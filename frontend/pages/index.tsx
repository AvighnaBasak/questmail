import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { LockClosedIcon, FireIcon, PaperClipIcon, PhotoIcon, ChatBubbleLeftRightIcon, ShieldCheckIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

const features = [
  {
    icon: <LockClosedIcon className="w-7 h-7 text-white mx-auto" />,
    title: 'Privacy-First',
    desc: 'No tracking, no ads, no spam. Your emails are yours alone.'
  },
  {
    icon: <FireIcon className="w-7 h-7 text-white mx-auto" />,
    title: 'One-Time Read',
    desc: 'Send self-destructing emails that vanish after being read.'
  },
  {
    icon: <PaperClipIcon className="w-7 h-7 text-white mx-auto" />,
    title: 'Big Attachments',
    desc: 'Send files up to 25MB each, with 100MB total storage per user.'
  },
  {
    icon: <PhotoIcon className="w-7 h-7 text-white mx-auto" />,
    title: 'HTML & Media',
    desc: 'Send and view beautiful HTML emails, images, and videos.'
  },
  {
    icon: <ChatBubbleLeftRightIcon className="w-7 h-7 text-white mx-auto" />,
    title: 'Threaded Replies',
    desc: 'Conversations are grouped in clean, chat-like threads.'
  },
  {
    icon: <ShieldCheckIcon className="w-7 h-7 text-white mx-auto" />,
    title: 'Supabase Security',
    desc: 'Built on Supabase with strong RLS and secure storage.'
  },
];

const reviews = [
  {
    name: 'Anwesha',
    avatar: 'A',
    text: 'I LOVE THIS OMG FIREE MAIL ITS SO PERFORMATIVE..but dubai chocolate labubu pilates clairo collab when.'
  },
  {
    name: 'Chandrashekar',
    avatar: 'C',
    text: 'This is quest mail. Its another mail. You can mail people and recieve male. U can send pics by mail. U can get pics by mail. It has search opshun. I like questmail.'
  },
  {
    name: 'Guga',
    avatar: 'G',
    text: 'ty ill be using questmail to share my Cyber Punk files 😍🙏. The CIA and IRS cant catch me anymore'
  },
];

const founderQuote = {
  avatar: 'https://i.postimg.cc/htYZJNX7/images.jpg', 
  name: 'Avighna Basak',
  text: '"QuestMail is built for people who value privacy and uhhh i dont know what to write here umm i basically just watched a lot of yt vids and made ts cus its cool and all but ya USE QUESTMAIL PLEASE ITS SO COOL AND PERFORMATIVE THE HUZZ LOVE QUESTMAIL...RIGHT LADIES? RIGHT? anyway i was watching memento while making this projects its a really cool movie yall should check it out but idk whats going on in the movie. also debugging this took me ages but like ya it works now YIPEE."'
};

const Home = () => {
  const router = useRouter();
  const [learnMoreText, setLearnMoreText] = useState('LEARN MORE');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col text-[90%] relative overflow-hidden">


      {/* Floating Navbar */}
      <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-20 flex justify-between items-center px-8 py-4 bg-gray-900/90 backdrop-blur-xl border border-gray-700 rounded-full shadow-lg" style={{ fontSize: '90%' }}>
        <div className="flex items-center space-x-2.5 group">
          <Image 
            src="/logo.png" 
            alt="QuestMail Logo" 
            width={48} 
            height={48}
            className="w-12 h-12 object-contain transition-all duration-300 transform group-hover:scale-105"
          />
          <span className="text-xl font-bold tracking-widest uppercase ml-2 text-white">QuestMail</span>
        </div>
        <div className="space-x-6">
          <button className="uppercase font-semibold text-xs tracking-wider hover:text-[#eb9e2b] hover:underline transition-all duration-300 pl-4" onClick={() => router.push('/login')}>Sign In</button>
          <button className="bg-[#eb9e2b] text-black px-5 py-1.5 rounded-full font-bold uppercase tracking-wider hover:bg-[#eb9e2b]/80 transition-all duration-300 text-sm" onClick={() => router.push('/login')}>Create Account</button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-3 mt-32 md:mt-40 relative z-10" style={{ fontSize: '90%' }}>
        <div className="relative">
          <h1 className="text-4xl md:text-7xl font-extrabold tracking-widest mb-4 leading-tight animate-fade-in-up text-white">
            MAIL?REINVENTED?
          </h1>
        </div>
        <p className="text-gray-300 text-base md:text-xl max-w-2xl mx-auto mb-7 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          QuestMail is a privacy-first, self-destructing, ultra-modern email platform.<br />
          No spam. No tracking. No external email. Just mail, done right.
        </p>
        <div className="mt-2 space-x-3 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <button className="bg-[#eb9e2b] text-black px-7 py-2.5 rounded-2xl font-bold uppercase tracking-wider text-base hover:bg-[#eb9e2b]/80 transition-all duration-300" onClick={() => router.push('/login')}>
            Create Account
          </button>
          <button className="border border-[#eb9e2b] px-7 py-2.5 rounded-2xl font-bold uppercase tracking-wider text-base hover:bg-[#eb9e2b] hover:text-black transition-all duration-300" onClick={() => setLearnMoreText('sybau')}>
            {learnMoreText}
          </button>
        </div>
        <div className="mt-7 text-white/80 text-base font-semibold tracking-wide animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
          Trusted by <span className="text-[#eb9e2b] font-bold">thousands</span> of privacy lovers
        </div>
      </main>

      {/* Features Section */}
      <section className="mt-20 px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto w-full relative z-10" style={{ fontSize: '90%' }}>
        {features.map((f, i) => (
          <div 
            key={f.title} 
            className="bg-gray-900 p-6 rounded-3xl border border-gray-700 flex flex-col items-center text-center hover:scale-105 transition-all duration-300 group animate-fade-in-up"
            style={{ animationDelay: `${0.3 + i * 0.1}s` }}
          >
            <div className="mb-3 group-hover:scale-110 transition-transform duration-300">
              <div className="p-3 bg-gray-800 rounded-2xl border border-[#eb9e2b]/20">
                {f.icon}
              </div>
            </div>
            <div className="font-bold text-lg mb-1 tracking-wide text-white">{f.title}</div>
            <div className="text-gray-300 text-sm">{f.desc}</div>
          </div>
        ))}
      </section>

      {/* Reviews Section */}
      <section className="mt-20 max-w-4xl mx-auto w-full px-4 relative z-10" style={{ fontSize: '90%' }}>
        <h2 className="text-2xl font-bold text-white mb-6 text-center animate-fade-in-up">What our users say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((r, i) => {
            const profileImages = [
              'https://i.postimg.cc/ryZpct2F/Whats-App-Image-2025-07-26-at-10-45-44-PM.jpg',
              'https://i.postimg.cc/gkw20kGy/Whats-App-Image-2025-07-26-at-11-00-44-PM.jpg',
              'https://i.postimg.cc/3wZKqkZh/4e09a95fdcdb8cc0cf3f2e4c569bbd13.jpg'
            ];
            
            return (
              <div 
                key={i} 
                className="bg-gray-900 rounded-3xl p-8 flex flex-col items-center border border-gray-700 hover:scale-105 transition-all duration-300 animate-fade-in-up min-h-[220px]"
                style={{ animationDelay: `${0.5 + i * 0.2}s` }}
              >
                <div className="w-20 h-20 rounded-full overflow-hidden mb-6">
                  <img 
                    src={profileImages[i]} 
                    alt={`${r.name}'s profile`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-xl text-white font-semibold mb-3">{r.name}</div>
                <div className="text-gray-300 text-base italic leading-relaxed">"{r.text}"</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Founder Quote Section */}
      <section className="mt-20 flex flex-col items-center justify-center px-4 relative z-10" style={{ fontSize: '90%' }}>
        <h2 className="text-3xl font-bold text-center mb-12 animate-fade-in-up text-white">Founders Words</h2>
        <div className="max-w-4xl mx-auto bg-gray-900 rounded-3xl p-8 flex items-center gap-8 border border-gray-700 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <div className="flex-shrink-0 flex items-center justify-center">
            <div className="relative">
              <img src="https://i.postimg.cc/htYZJNX7/images.jpg" alt="Avighna Basak" className="w-32 h-32 rounded-full object-cover border-4 border-[#eb9e2b]/30 bg-gray-800" />
            </div>
          </div>
          <div className="flex-1 text-center">
            <p className="text-lg text-gray-300 leading-relaxed mb-6 italic">
            "QuestMail is built for people who value privacy and uhhh i dont know what to write here umm i basically just watched a lot of yt vids and made ts cus its cool and all but ya USE QUESTMAIL PLEASE ITS SO COOL AND PERFORMATIVE THE HUZZ LOVE QUESTMAIL...RIGHT LADIES? RIGHT? anyway i was watching memento while making this projects its a really cool movie yall should check it out but idk whats going on in the movie. also debugging this took me ages but like ya it works now YIPEE."
            </p>
            <div className="space-y-1">
              <p className="font-bold text-[#eb9e2b] text-lg">Avighna Basak</p>
              <p className="text-gray-400 text-base">Founder and CEO</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-20 text-center text-gray-400 text-xs py-7 border-t border-[#eb9e2b]/20 relative z-10" style={{ fontSize: '90%' }}>
        <div className="mb-1">© 2025 QuestMail. All rights reserved.</div>
        <div>Made by <span className="text-[#eb9e2b]">Avighna Basak</span></div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default Home;
