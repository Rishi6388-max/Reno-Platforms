import React, { useState, useEffect } from 'react';
import { Megaphone, Search, SlidersHorizontal, Plus, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { Notice } from './types';
import NoticeCard from './components/NoticeCard';
import NoticeForm from './components/NoticeForm';

export default function App() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Exam' | 'Event' | 'General'>('All');
  const [selectedPriority, setSelectedPriority] = useState<'All' | 'Normal' | 'Urgent'>('All');

  // Form State
  const [noticeToEdit, setNoticeToEdit] = useState<Notice | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Fetch notices on mount
  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/notices');
      if (!response.ok) {
        throw new Error('Failed to load notices from full-stack backend.');
      }
      const data = await response.json();
      setNotices(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Could not fetch notices. Please make sure the backend is active.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/notices/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete notice.');
      }
      // If we are currently editing the deleted notice, clear edit state
      if (noticeToEdit && noticeToEdit.id === id) {
        setNoticeToEdit(null);
      }
      fetchNotices();
    } catch (err) {
      console.error(err);
      alert('Failed to delete notice. Please try again.');
    }
  };

  const handleEditSelect = (notice: Notice) => {
    setNoticeToEdit(notice);
    setIsFormOpen(true);
    // Smooth scroll to form on mobile devices
    document.getElementById('notice-form-container')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFormSave = () => {
    setNoticeToEdit(null);
    setIsFormOpen(false);
    fetchNotices();
  };

  const handleCancelEdit = () => {
    setNoticeToEdit(null);
    setIsFormOpen(false);
  };

  // Strict filtering based on search query AND active category/priority tabs
  const strictFilteredNotices = notices.filter((notice) => {
    const matchesSearch =
      notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.body.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || notice.category === selectedCategory;
    const matchesPriority = selectedPriority === 'All' || notice.priority === selectedPriority;

    return matchesSearch && matchesCategory && matchesPriority;
  });

  // Loose filtering based ONLY on search query (ignoring tabs)
  const searchOnlyFilteredNotices = notices.filter((notice) => {
    return (
      notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.body.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Detect if there's a conflict: search query typed, strict results are empty, but global search has results
  const isConflicting =
    searchQuery.trim() !== '' &&
    strictFilteredNotices.length === 0 &&
    searchOnlyFilteredNotices.length > 0;

  // Final filtered notices: if conflicting, fall back to showing search results globally to avoid empty screen
  const filteredNotices = isConflicting ? searchOnlyFilteredNotices : strictFilteredNotices;

  // Calculate statistics for Notice Board summary cards
  const urgentCount = notices.filter(n => n.priority === 'Urgent').length;
  const examCount = notices.filter(n => n.category === 'Exam').length;
  const eventCount = notices.filter(n => n.category === 'Event').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Visual Navigation Bar */}
      <header id="main-header" className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
                <Megaphone className="h-4.5 w-4.5" />
              </div>
              <div>
                <h1 className="text-lg font-bold font-display text-slate-800 tracking-tight leading-tight">
                  Campus Notice Board
                </h1>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Academic Announcement Hub</p>
              </div>
            </div>

            {/* Sync Status Button and Admin Widget */}
            <div className="flex items-center gap-4">
              <button
                id="refresh-board-btn"
                onClick={fetchNotices}
                disabled={isLoading}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Refresh Board"
              >
                <RefreshCw className={`h-4.5 w-4.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold font-display text-sm">
                  AD
                </div>
                <div className="text-sm hidden md:block text-left">
                  <p className="font-bold text-slate-800">Academic Admin</p>
                  <p className="text-xs text-blue-600 font-medium">Registrar Office</p>
                </div>
              </div>

              <button
                id="toggle-form-mobile"
                onClick={() => {
                  setNoticeToEdit(null);
                  setIsFormOpen(!isFormOpen);
                }}
                className="md:hidden inline-flex items-center gap-1 bg-blue-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-sm transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                {isFormOpen ? 'Close Form' : 'Add Notice'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Core Quick KPI Panel */}
        <div id="metric-dashboard" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-blue-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Total Notices</p>
            <p className="text-2xl font-bold text-slate-800 font-display mt-1">{notices.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm transition-all hover:border-rose-300">
            <p className="text-[10px] font-bold text-rose-600 uppercase tracking-[0.1em] flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
              Urgent Priority
            </p>
            <p className="text-2xl font-bold text-rose-700 font-display mt-1">{urgentCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm transition-all hover:border-amber-300">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-[0.1em]">Exam Board</p>
            <p className="text-2xl font-bold text-amber-700 font-display mt-1">{examCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm transition-all hover:border-blue-300">
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.1em]">Events Scheduled</p>
            <p className="text-2xl font-bold text-blue-700 font-display mt-1">{eventCount}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* NOTICE BOARD COL (left 7/8 columns on desktop) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Search & Filter Component Wrapper */}
            <div id="filter-wrapper" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center">
              
              {/* Search Bar */}
              <div className="relative w-full md:w-1/3">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  id="search-input"
                  type="text"
                  placeholder="Search announcements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/40 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Responsive Category Selector */}
              <div className="w-full md:flex-1 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider md:mr-1 flex items-center gap-1">
                  <SlidersHorizontal className="h-3 w-3" />
                  Category:
                </span>
                {['All', 'Exam', 'Event', 'General'].map((cat) => (
                  <button
                    key={cat}
                    id={`filter-cat-${cat}`}
                    onClick={() => {
                      setSelectedCategory(cat as any);
                      setSearchQuery('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-100'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Priority Selector */}
              <div className="w-full md:w-auto flex items-center gap-2 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  Priority:
                </span>
                {['All', 'Normal', 'Urgent'].map((pri) => (
                  <button
                    key={pri}
                    id={`filter-pri-${pri}`}
                    onClick={() => {
                      setSelectedPriority(pri as any);
                      setSearchQuery('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      selectedPriority === pri
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-100'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {pri}
                  </button>
                ))}
              </div>

            </div>

            {/* Filter Conflict Banner */}
            {isConflicting && (
              <div id="filter-conflict-banner" className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm transition-all animate-fade-in">
                <div className="flex items-start sm:items-center gap-2.5">
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse mt-1.5 sm:mt-0 shrink-0"></div>
                  <p className="font-medium text-amber-900">
                    Showing search results globally. Active filters for Category (<span className="font-bold">{selectedCategory}</span>) and Priority (<span className="font-bold">{selectedPriority}</span>) are temporarily bypassed because no matches were found under them.
                  </p>
                </div>
                <button
                  id="bypass-clear-btn"
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedPriority('All');
                  }}
                  className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors shrink-0 self-start sm:self-center"
                >
                  Reset Tab Filters
                </button>
              </div>
            )}

            {/* Error banner */}
            {errorMsg && (
              <div id="main-error-banner" className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-rose-900">Connection Error</h4>
                  <p className="text-xs text-rose-700 mt-1">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Notice Grid / Loading state */}
            {isLoading ? (
              <div id="loading-spinner" className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <svg className="animate-spin h-8 w-8 text-blue-600 mb-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-xs text-slate-500">Syncing database assets...</p>
              </div>
            ) : filteredNotices.length === 0 ? (
              <div id="empty-state-card" className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center shadow-sm">
                <div className="p-4 rounded-full bg-slate-50 text-slate-400 border border-slate-200 shadow-sm mb-4">
                  <Layers className="h-6 w-6 text-slate-500" />
                </div>
                <h3 className="text-base font-bold text-slate-800 font-display">No notices found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  We couldn't find any announcements matching those filters. Try adjusting your search query or creating a new notice.
                </p>
                <button
                  id="reset-filters-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setSelectedPriority('All');
                  }}
                  className="mt-4 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div id="notice-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredNotices.map((notice) => (
                  <NoticeCard
                    key={notice.id}
                    notice={notice}
                    onEdit={handleEditSelect}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>

          {/* FORM COL (right 4 columns on desktop) */}
          <div className={`lg:col-span-4 ${isFormOpen ? 'block' : 'hidden md:block'}`}>
            <div className="sticky top-24">
              <NoticeForm
                noticeToEdit={noticeToEdit}
                onSave={handleFormSave}
                onCancel={handleCancelEdit}
              />
            </div>
          </div>

        </div>
      </main>

      {/* Humble literal footer */}
      <footer id="main-footer" className="bg-white border-t border-gray-100 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[10px] text-gray-400 font-mono">
            Reno Platforms Web Assignment © 2026. Made with Google AI Studio.
          </p>
        </div>
      </footer>
    </div>
  );
}
