import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Tag, AlertCircle, Upload, X, Check, FileText } from 'lucide-react';
import { Notice, NoticeFormData } from '../types';

interface NoticeFormProps {
  noticeToEdit: Notice | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function NoticeForm({ noticeToEdit, onSave, onCancel }: NoticeFormProps) {
  const [formData, setFormData] = useState<NoticeFormData>({
    title: '',
    body: '',
    category: 'General',
    priority: 'Normal',
    publishDate: new Date().toISOString().split('T')[0],
    image: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with noticeToEdit when it changes (Edit Mode)
  useEffect(() => {
    if (noticeToEdit) {
      setFormData({
        title: noticeToEdit.title,
        body: noticeToEdit.body,
        category: noticeToEdit.category,
        priority: noticeToEdit.priority,
        publishDate: new Date(noticeToEdit.publishDate).toISOString().split('T')[0],
        image: noticeToEdit.image,
      });
      setValidationErrors([]);
    } else {
      // Clear form when exiting edit mode
      setFormData({
        title: '',
        body: '',
        category: 'General',
        priority: 'Normal',
        publishDate: new Date().toISOString().split('T')[0],
        image: null,
      });
    }
  }, [noticeToEdit]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePriorityChange = (priority: 'Normal' | 'Urgent') => {
    setFormData((prev) => ({ ...prev, priority }));
  };

  // Convert uploaded image file to base64
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setValidationErrors(['Please upload an image file (PNG, JPG, WebP, etc.).']);
      return;
    }
    // Limit to 4MB to keep base64 storage fast and safe
    if (file.size > 4 * 1024 * 1024) {
      setValidationErrors(['Image is too large. Please select an image under 4MB.']);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, image: reader.result as string }));
      setValidationErrors([]);
    };
    reader.onerror = () => {
      setValidationErrors(['Error reading image file.']);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);
    setSuccessMessage(null);

    // Client-side quick check
    const errors: string[] = [];
    if (!formData.title.trim()) errors.push('Title cannot be empty.');
    if (!formData.body.trim()) errors.push('Content body cannot be empty.');
    if (!formData.publishDate) errors.push('Please pick a publication date.');

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const url = noticeToEdit ? `/api/notices/${noticeToEdit.id}` : '/api/notices';
      const method = noticeToEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          setValidationErrors(result.errors);
        } else if (result.error) {
          setValidationErrors([result.error]);
        } else {
          setValidationErrors(['An unknown server error occurred.']);
        }
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(noticeToEdit ? 'Notice updated successfully!' : 'Notice created successfully!');
      setTimeout(() => {
        onSave();
        setIsSubmitting(false);
        if (!noticeToEdit) {
          // Reset form on create
          setFormData({
            title: '',
            body: '',
            category: 'General',
            priority: 'Normal',
            publishDate: new Date().toISOString().split('T')[0],
            image: null,
          });
        }
      }, 1000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setValidationErrors(['Network connection failed. Make sure your server is running.']);
      setIsSubmitting(false);
    }
  };

  return (
    <div id="notice-form-container" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-800 tracking-tight">
            {noticeToEdit ? 'Edit Notice' : 'Add New Notice'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {noticeToEdit ? 'Modify active fields and persist changes.' : 'Create a new notice entry for the institution.'}
          </p>
        </div>
        {noticeToEdit && (
          <button
            id="cancel-edit-btn"
            onClick={onCancel}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 py-1.5 px-3 rounded-full transition-colors border border-slate-200"
          >
            Cancel Edit
          </button>
        )}
      </div>

      {successMessage && (
        <div id="success-banner" className="mb-6 bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-xl flex items-center gap-3">
          <div className="p-1 rounded-full bg-emerald-100 text-emerald-600">
            <Check className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div id="error-banner" className="mb-6 bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2 text-rose-900 font-semibold text-sm">
            <AlertCircle className="h-4 w-4 text-rose-600" />
            <span>Validation Failure:</span>
          </div>
          <ul className="list-disc pl-5 text-xs space-y-1 text-rose-700">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <form id="notice-submission-form" onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <label htmlFor="title-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Notice Title *
          </label>
          <input
            id="title-input"
            type="text"
            name="title"
            required
            placeholder="e.g. Semester End Examination Schedule"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all placeholder:text-slate-400 bg-slate-50/50"
          />
        </div>

        {/* Body Content */}
        <div className="space-y-1.5">
          <label htmlFor="body-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Notice Content *
          </label>
          <textarea
            id="body-input"
            name="body"
            rows={4}
            required
            placeholder="Provide complete announcements details here..."
            value={formData.body}
            onChange={handleInputChange}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all placeholder:text-slate-400 bg-slate-50/50"
          />
        </div>

        {/* Category & Publish Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="category-select" className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="h-3 w-3 text-slate-400" />
              Category *
            </label>
            <select
              id="category-select"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
            >
              <option value="General">General Announcement</option>
              <option value="Exam">Exam Announcement</option>
              <option value="Event">Event Announcement</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="publish-date-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3 w-3 text-slate-400" />
              Publish Date *
            </label>
            <input
              id="publish-date-input"
              type="date"
              name="publishDate"
              required
              value={formData.publishDate}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
            />
          </div>
        </div>

        {/* Priority Radio Cards */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Priority Level *
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              id="priority-normal-btn"
              type="button"
              onClick={() => handlePriorityChange('Normal')}
              className={`p-3.5 rounded-xl border text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                formData.priority === 'Normal'
                  ? 'border-blue-600 bg-blue-50/50 text-blue-700 font-semibold ring-1 ring-blue-500'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className={`h-2 w-2 rounded-full ${formData.priority === 'Normal' ? 'bg-blue-600' : 'bg-slate-300'}`} />
              Normal Priority
            </button>

            <button
              id="priority-urgent-btn"
              type="button"
              onClick={() => handlePriorityChange('Urgent')}
              className={`p-3.5 rounded-xl border text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                formData.priority === 'Urgent'
                  ? 'border-rose-500 bg-rose-50/50 text-rose-700 font-semibold ring-1 ring-rose-400'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className={`h-2 w-2 rounded-full animate-pulse ${formData.priority === 'Urgent' ? 'bg-rose-600' : 'bg-slate-300'}`} />
              Urgent Priority
            </button>
          </div>
        </div>

        {/* Optional Image Upload Container (Drag-and-Drop + Click-to-upload) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Upload className="h-3 w-3 text-slate-400" />
            Optional Banner Image
          </label>

          <input
            id="image-file-input"
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {!formData.image ? (
            <div
              id="image-drag-area"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                dragActive
                  ? 'border-blue-500 bg-blue-50/50 text-blue-700'
                  : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/40 text-slate-500'
              }`}
            >
              <div className="p-3 rounded-full bg-slate-50 border border-slate-200 shadow-sm text-slate-400">
                <Upload className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  <span className="text-blue-600 font-bold">Click to upload</span> or drag and drop
                </p>
                <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, WebP up to 4MB</p>
              </div>
            </div>
          ) : (
            <div id="image-preview-card" className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2 flex items-center gap-3">
              <img
                src={formData.image}
                alt="Upload preview"
                className="h-16 w-16 object-cover rounded-lg border border-slate-100"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 truncate">Notice Banner Loaded</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Stored as base64 asset</p>
              </div>
              <button
                id="remove-image-btn"
                type="button"
                onClick={removeImage}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                title="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-3">
          <button
            id="submit-form-btn"
            type="submit"
            disabled={isSubmitting}
            className={`flex-1 py-3 px-4 rounded-xl text-white font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
              isSubmitting
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </>
            ) : noticeToEdit ? (
              'Save Changes'
            ) : (
              'Publish Notice'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
