import type { Timestamp } from 'firebase/firestore';

export type Event = {
  id: string;
  title: string;
  description:string;
  venue: string;
  location: string;
  date: string; // ISO string
  type: 'college' | 'other';
  mapLink?: string;
  registrationLink?: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
  attendees: number;
  attendeeUids: string[];
  checkedInUids?: string[];
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
