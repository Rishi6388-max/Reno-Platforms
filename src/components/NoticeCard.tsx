import React, { useState } from 'react';
import { Calendar, Tag, AlertTriangle, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import { Notice } from '../types';

interface NoticeCardProps {
  notice: Notice;
  onEdit: (notice: Notice) => void;
  onDelete: (id: string) => Promise<void>;
}

export default function NoticeCard({ notice, onEdit, onDelete }: NoticeCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsSubmitting] = useState(false);

  // Format date helper
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Color mappings for Categories
  const categoryStyles = {
    Exam: {
      badge: 'bg-amber-50 text-amber-800 border-amber-200/60',
      iconColor: 'text-amber-600',
    },
    Event: {
      badge: 'bg-blue-50 text-blue-800 border-blue-200/60',
      iconColor: 'text-blue-600',
    },
    General: {
      badge: 'bg-slate-100 text-slate-800 border-slate-200',
      iconColor: 'text-slate-600',
    },
  }[notice.category] || {
    badge: 'bg-gray-50 text-gray-800 border-gray-200',
    iconColor: 'text-gray-600',
  };

  const isUrgent = notice.priority === 'Urgent';

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    await onDelete(notice.id);
    setIsSubmitting(false);
    setShowConfirm(false);
  };

  return (
    <div
      id={`notice-card-${notice.id}`}
      className={`relative bg-white rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col group ${
        isUrgent
          ? 'border-rose-200/80 shadow-[0_4px_20px_-4px_rgba(244,63,94,0.08)] hover:shadow-[0_8px_30px_rgba(244,63,94,0.14)] ring-1 ring-rose-50'
          : 'border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Visual Badge Header */}
      <div className="p-5 pb-3 flex justify-between items-start gap-4">
        <div className="flex flex-wrap gap-2">
          {/* Category Tag */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${categoryStyles.badge}`}
          >
            <Tag className={`h-3 w-3 ${categoryStyles.iconColor}`} />
            {notice.category}
          </span>

          {/* Date Tag */}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 border border-slate-200 text-slate-500">
            <Calendar className="h-3 w-3" />
            {formatDate(notice.publishDate)}
          </span>
        </div>

        {/* Priority Badge */}
        {isUrgent ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500 text-white border border-rose-500/10 shadow-[0_2px_8px_rgba(244,63,94,0.2)] animate-pulse-slow">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
            Urgent
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 border border-slate-200 text-slate-400">
            Normal
          </span>
        )}
      </div>

      {/* Notice optional banner image */}
      {notice.image && (
        <div className="px-5 pb-3">
          <div className="h-36 w-full rounded-xl overflow-hidden border border-gray-50 relative">
            <img
              src={notice.image}
              alt={notice.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
        </div>
      )}

      {/* Main Copy Area */}
      <div className="px-5 py-2 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold font-display text-slate-800 leading-snug tracking-tight mb-2 group-hover:text-blue-600 transition-colors">
            {notice.title}
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap font-sans break-words mb-4">
            {notice.body}
          </p>
        </div>
      </div>

      {/* Action Footer Divider */}
      <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center gap-2 mt-auto">
        <span className="text-[10px] text-slate-400 font-mono">
          ID: {notice.id.split('-')[0].toUpperCase()}
        </span>

        <div className="flex gap-2">
          {/* Edit Button */}
          <button
            id={`edit-notice-${notice.id}`}
            onClick={() => onEdit(notice)}
            disabled={showConfirm}
            className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100/50 transition-all cursor-pointer"
            title="Edit notice"
          >
            <Edit2 className="h-4 w-4" />
          </button>

          {/* Delete Button */}
          <button
            id={`delete-notice-${notice.id}`}
            onClick={() => setShowConfirm(true)}
            disabled={showConfirm}
            className="p-2 rounded-xl text-gray-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100/50 transition-all cursor-pointer"
            title="Delete notice"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Beautiful Inline In-Card Confirmation Drawer */}
      {showConfirm && (
        <div
          id={`delete-confirm-overlay-${notice.id}`}
          className="absolute inset-0 bg-slate-900/95 backdrop-blur-[2px] p-5 flex flex-col items-center justify-center text-center z-10 animate-fade-in"
        >
          <div className="p-3 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 mb-3">
            <ShieldAlert className="h-6 w-6 animate-bounce-slow" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">Confirm Deletion</h4>
          <p className="text-xs text-gray-300 max-w-[200px] leading-relaxed mb-4">
            Are you sure you want to delete this notice? This action is permanent.
          </p>
          <div className="flex gap-2">
            <button
              id={`cancel-delete-${notice.id}`}
              onClick={() => setShowConfirm(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id={`confirm-delete-${notice.id}`}
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-colors cursor-pointer"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
