'use client';

import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/Header';
import { EventList } from '@/components/EventList';
import { CreateEventButton } from '@/components/CreateEventButton';
import { Footer } from '@/components/Footer';
import { Loader } from '@/components/Loader';
import { Calendar, Users, MapPin, Sparkles, ArrowRight, Trophy, QrCode, Bell } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { user, loading } = useAuth();

  // Show loader while checking auth status
  if (loading) {
    return <Loader fullScreen size="lg" text="Loading..." />;
  }

  // If user is logged in, show events page directly (no landing page)
  if (user) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 container mx-auto p-4 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-headline font-bold text-foreground">
                Upcoming Events
              </h1>
              <p className="text-muted-foreground mt-2">
                Explore and join exciting events happening around you
              </p>
            </div>
            <CreateEventButton />
          </div>
          <EventList />
        </main>
        <Footer />
      </div>
    );
  }

  // Landing page for non-logged-in users
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-accent/20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 md:px-8 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Your Campus, Your Events
            </div>
            <h1 className="text-4xl md:text-6xl font-headline font-bold text-foreground leading-tight">
              Discover & Create Amazing
              <span className="text-primary"> Campus Events</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect with your campus community. Find exciting events, meet new people, 
              and create unforgettable experiences all in one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <CreateEventButton />
              <Button variant="outline" size="lg" asChild>
                <Link href="#events" className="group">
                  Explore Events
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent/30 rounded-full blur-3xl"></div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-card/50">
        <div className="container mx-auto px-4 md:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-3xl font-bold text-foreground">100+</h3>
              <p className="text-sm text-muted-foreground">Events Hosted</p>
            </div>
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/20 text-accent-foreground mx-auto">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-3xl font-bold text-foreground">500+</h3>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="text-3xl font-bold text-foreground">20+</h3>
              <p className="text-sm text-muted-foreground">Locations</p>
            </div>
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/20 text-accent-foreground mx-auto">
                <Trophy className="h-6 w-6" />
              </div>
              <h3 className="text-3xl font-bold text-foreground">50+</h3>
              <p className="text-sm text-muted-foreground">Top Organizers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-foreground mb-4">
              Why Choose Campus Hub?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to stay connected with campus life
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group p-6 rounded-2xl border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Discover Events</h3>
              <p className="text-muted-foreground">
                Browse through a variety of campus events from tech talks to sports tournaments, 
                all in one convenient place.
              </p>
            </div>
            <div className="group p-6 rounded-2xl border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-accent/20 text-accent-foreground flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <QrCode className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Easy Check-in</h3>
              <p className="text-muted-foreground">
                Get digital tickets with QR codes for seamless event check-in. 
                No more paper tickets or long queues.
              </p>
            </div>
            <div className="group p-6 rounded-2xl border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Bell className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Stay Updated</h3>
              <p className="text-muted-foreground">
                Never miss an event! Get notifications and updates about events 
                you're interested in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <main id="events" className="flex-1 container mx-auto p-4 md:p-8 scroll-mt-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-foreground">
              Upcoming Events
            </h2>
            <p className="text-muted-foreground mt-2">
              Explore and join exciting events happening around you
            </p>
          </div>
          <CreateEventButton />
        </div>
        <EventList />
      </main>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Join Campus Hub today and become part of the vibrant campus community. 
            Create events, connect with peers, and make memories.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/login">
                Sign Up Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/leaderboard">
                <Trophy className="mr-2 h-4 w-4" />
                View Leaderboard
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
