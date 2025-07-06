import type { Timestamp } from 'firebase/firestore';

export type Event = {
  id: string;
  title: string;
  description:string;
  location: string;
  date: string; // ISO string
  registrationLink?: string;
  imageUrl?: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
};
