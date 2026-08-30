import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StickyNote as StickyNoteIcon, X, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const StickyNote: React.FC = () => {
  const { userId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [loaded, setLoaded] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Charge la note existante au montage
  useEffect(() => {
    if (!userId) return;

    const loadNote = async () => {
      try {
        const { data, error } = await supabase
          .from('sticky_notes')
          .select('content')
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data) {
          setContent(data.content || '');
        }
      } catch {
        // silencieux : pas grave si ça échoue au chargement
      } finally {
        setLoaded(true);
      }
    };

    loadNote();
  }, [userId]);

  // Sauvegarde en base avec un léger debounce pour éviter trop d'appels
  const saveNote = useCallback((value: string) => {
    if (!userId) return;

    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    saveTimeout.current = setTimeout(async () => {
      try {
        await supabase
          .from('sticky_notes')
          .upsert({ user_id: userId, content: value, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      } catch {
        // silencieux
      }
    }, 600);
  }, [userId]);

  const handleChange = (value: string) => {
    setContent(value);
    saveNote(value);
  };

  const handleDelete = () => {
    if (!content.trim()) return;
    if (!confirm('Effacer le pense-bête ?')) return;
    setContent('');
    saveNote('');
  };

  if (!userId || !loaded) return null;

  const hasContent = content.trim().length > 0;

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {isOpen ? (
        <div className="w-72 bg-yellow-100 rounded-xl shadow-2xl shadow-black/50 border border-yellow-200 overflow-hidden animate-fade-in flex flex-col">
          {/* Header du post-it */}
          <div className="flex items-center justify-between px-3 py-2 bg-yellow-200/60 border-b border-yellow-300/50">
            <span className="text-xs font-bold text-yellow-900/70 uppercase tracking-wide flex items-center gap-1.5">
              <StickyNoteIcon size={14} />
              Pense-bête
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                disabled={!hasContent}
                title="Effacer"
                className="p-1 rounded text-yellow-900/50 hover:text-red-600 hover:bg-yellow-300/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Replier"
                className="p-1 rounded text-yellow-900/50 hover:text-yellow-900 hover:bg-yellow-300/50 transition-all"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Écris ce que tu veux ici..."
            rows={8}
            autoFocus
            className="w-full p-3 bg-transparent text-yellow-950 placeholder-yellow-800/40 text-sm resize-none focus:outline-none font-medium leading-relaxed"
            style={{ fontFamily: "'Comic Sans MS', 'Segoe Print', cursive" }}
          />
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className={`relative w-12 h-12 rounded-xl shadow-lg flex items-center justify-center transition-all hover:scale-105 ${
            hasContent
              ? 'bg-yellow-300 shadow-yellow-500/30'
              : 'bg-white/10 backdrop-blur-xl border border-white/10 hover:bg-white/20'
          }`}
          title="Pense-bête"
        >
          <StickyNoteIcon size={20} className={hasContent ? 'text-yellow-900' : 'text-gray-300'} />
          {hasContent && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-violet-500 rounded-full border-2 border-black" />
          )}
        </button>
      )}
    </div>
  );
};
