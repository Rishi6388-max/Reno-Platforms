export interface Notice {
  id: string;
  title: string;
  body: string;
  category: 'Exam' | 'Event' | 'General';
  priority: 'Normal' | 'Urgent';
  publishDate: string; // ISO string returned from API
  image: string | null; // Optional base64 or URL string
  createdAt: string;
}

export interface NoticeFormData {
  title: string;
  body: string;
  category: 'Exam' | 'Event' | 'General';
  priority: 'Normal' | 'Urgent';
  publishDate: string; // YYYY-MM-DD for form input
  image: string | null;
}
