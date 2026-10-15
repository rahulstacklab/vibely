import { useContext } from 'react';
import { Bookmark } from 'lucide-react';
import { DataContext } from '../app/contexts.js';

export const SavedMessagesView = () => {
  const { savedMessages } = useContext(DataContext);

  return (
    <div className="flex-1 p-4 md:p-8 bg-slate-50 dark:bg-slate-900 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Starred Messages</h1>
        {savedMessages.length === 0 ? (
          <div className="bg-white dark:bg-slate-950 p-12 rounded-3xl text-center space-y-3 border border-slate-200 dark:border-slate-800">
            <Bookmark className="mx-auto text-slate-300" size={40} />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No starred messages yet</p>
            <p className="text-xs text-slate-400">Click the star icon on any message to store it here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedMessages.map(m => (
              <div key={m.id} className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-900 dark:text-white">{m.text}</p>
                <span className="text-[10px] text-slate-400">{m.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

