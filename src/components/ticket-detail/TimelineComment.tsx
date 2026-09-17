import type { Comment } from '../../types';
import { formatRelative } from '../../utils/time';

interface TimelineCommentProps {
  comment: Comment;
}

export default function TimelineComment({ comment }: TimelineCommentProps) {
  const isInternal = comment.type === 'internal';

  return (
    <article
      className={`rounded-lg p-4 ${
        isInternal
          ? 'bg-amber-50 border border-amber-200'
          : 'bg-white border border-gray-200'
      }`}
      aria-label={`${isInternal ? 'Internal note' : 'Public reply'} from ${comment.author}`}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="bg-blue-100 text-blue-700 rounded-full h-8 w-8 flex items-center justify-center text-xs font-semibold shrink-0"
          aria-hidden="true"
        >
          {comment.authorInitials}
        </div>

        {/* Meta */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-900">{comment.author}</span>

            {isInternal && (
              <span className="bg-amber-100 text-amber-800 text-xs rounded px-1.5 py-0.5 font-medium">
                Internal note
              </span>
            )}

            <time
              dateTime={comment.createdAt}
              className="text-xs text-gray-500 ml-auto"
              title={comment.createdAt}
            >
              {formatRelative(comment.createdAt)}
            </time>
          </div>

          {/* Body */}
          <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{comment.body}</p>
        </div>
      </div>
    </article>
  );
}
