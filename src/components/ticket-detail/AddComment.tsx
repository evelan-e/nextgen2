import { useRef, useState } from 'react';
import { useTicketContext } from '../../context/TicketContext';
import ticketService, { generateCommentId } from '../../services/ticketService';
import type { Comment } from '../../types';

interface AddCommentProps {
  ticketId: string;
}

export default function AddComment({ ticketId }: AddCommentProps) {
  const { dispatch } = useTicketContext();
  const [body, setBody] = useState('');
  const [type, setType] = useState<'public' | 'internal'>('public');
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const submit = () => {
    if (!body.trim()) {
      setError('Comment cannot be empty.');
      return;
    }
    setError('');

    const comment: Comment = {
      id: generateCommentId(),
      author: 'John Doe',
      authorInitials: 'JD',
      body: body.trim(),
      type,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update — reducer also bumps updatedAt on the ticket
    dispatch({ type: 'ADD_COMMENT', ticketId, comment });

    // Persist in service layer
    ticketService.addComment(ticketId, {
      author: comment.author,
      authorInitials: comment.authorInitials,
      body: comment.body,
      type: comment.type,
    });

    setBody('');

    // Scroll the new entry into view
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white p-4 space-y-3">
      {/* Toggle: Public reply vs Internal note */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType('public')}
          className={[
            'px-3 py-1 rounded-full border text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
            type === 'public'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
          ].join(' ')}
        >
          Public reply
        </button>
        <button
          type="button"
          onClick={() => setType('internal')}
          className={[
            'px-3 py-1 rounded-full border text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
            type === 'internal'
              ? 'bg-amber-500 text-white border-amber-500'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
          ].join(' ')}
        >
          Internal note
        </button>
      </div>

      {/* Textarea */}
      <textarea
        value={body}
        onChange={(e) => { setBody(e.target.value); if (error) setError(''); }}
        onKeyDown={handleKeyDown}
        rows={3}
        placeholder={type === 'internal' ? 'Add an internal note…' : 'Write a reply…'}
        className={[
          'w-full resize-y rounded-md border px-3 py-2 text-sm text-gray-700 placeholder-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          type === 'internal' ? 'border-amber-300 bg-amber-50' : 'border-gray-300 bg-white',
        ].join(' ')}
        aria-label={type === 'internal' ? 'Internal note body' : 'Public reply body'}
      />

      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">Cmd/Ctrl+Enter to submit</span>
        <button
          type="button"
          onClick={submit}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Reply
        </button>
      </div>

      <div ref={bottomRef} />
    </div>
  );
}
