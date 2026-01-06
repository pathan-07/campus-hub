export type Event = {
  id: string;
  title: string;
  description:string;
  venue: string;
  location: string;
  date: string; // ISO string
  type: 'college' | 'other';
  category: 'Tech' | 'Sports' | 'Music' | 'Workshop' | 'Social' | 'Other';
  mapLink?: string | null;
  registrationLink?: string | null;
  authorId: string;
  authorName: string | null;
  createdAt: string | null;
  attendees: number;
  attendeeUids: string[];
  checkedInUids: string[];
};

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  bio?: string;
  points: number;
  badges: string[];
  eventsAttended: number;
};

export type CommentAuthor = {
  uid: string;
  name: string;
  photoURL: string | null;
};

export type Comment = {
  id: string;
  text: string;
  createdAt: Date;
  author: CommentAuthor;
};
