/* eslint-disable no-unused-vars */
import { useContext } from 'react';
import { Video, PhoneOff, MicOff, VideoOff } from 'lucide-react';
import { DataContext } from '../app/contexts.js';
import { Avatar } from '../components/SharedComponents.jsx';

export const ActiveCallOverlay = () => {
  const { activeCall, setActiveCall } = useContext(DataContext);
  if (!activeCall) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-50 flex flex-col items-center justify-between p-8 text-white animate-fade-in">
      <div className="text-center space-y-2 mt-8">
        <Avatar src={activeCall.user?.avatar} size="xl" className="mx-auto" />
        <h2 className="text-2xl font-bold">{activeCall.user?.name}</h2>
        <p className="text-xs text-violet-400 font-medium">Vibely Encrypted {activeCall.type === 'video' ? 'Video' : 'Voice'} Call...</p>
      </div>

      <div className="flex items-center space-x-6 mb-12">
        <button className="p-4 rounded-full bg-white/10 hover:bg-white/20 transition-all">
          <MicOff size={22} />
        </button>
        <button onClick={() => setActiveCall(null)} className="p-5 rounded-full bg-rose-600 hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/40">
          <PhoneOff size={28} />
        </button>
        {activeCall.type === 'video' && (
          <button className="p-4 rounded-full bg-white/10 hover:bg-white/20 transition-all">
            <VideoOff size={22} />
          </button>
        )}
      </div>
    </div>
  );
};


