import { Header } from '@/components/Header';
import { EventList } from '@/components/EventList';
import { CreateEventButton } from '@/components/CreateEventButton';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-5xl font-headline text-foreground">
            Upcoming Events
          </h1>
          <CreateEventButton />
        </div>
        <EventList />
      </main>
      <footer className="py-6 text-center text-muted-foreground">
        <p>Campus Hub &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
