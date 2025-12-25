'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Shield, Users, Calendar, AlertTriangle, Scale } from 'lucide-react';

export default function TermsPage() {
  const lastUpdated = 'December 11, 2025';

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <FileText className="h-4 w-4" />
            Legal
          </div>
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-foreground mb-2">
            Terms and Conditions
          </h1>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6 prose prose-neutral dark:prose-invert max-w-none">
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Scale className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold m-0">1. Acceptance of Terms</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using Campus Hub, you accept and agree to be bound by the terms and 
                conditions of this agreement. If you do not agree to these terms, please do not use 
                our service. These terms apply to all visitors, users, and others who access or use 
                the platform.
              </p>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold m-0">2. User Accounts</h2>
              </div>
              <ul className="text-muted-foreground space-y-2 list-disc pl-6">
                <li>You must provide accurate and complete information when creating an account.</li>
                <li>You are responsible for maintaining the security of your account credentials.</li>
                <li>You must be a student, faculty, or staff member of a recognized educational institution.</li>
                <li>You are responsible for all activities that occur under your account.</li>
                <li>You must notify us immediately of any unauthorized use of your account.</li>
              </ul>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Calendar className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold m-0">3. Event Guidelines</h2>
              </div>
              <ul className="text-muted-foreground space-y-2 list-disc pl-6">
                <li>Event organizers must provide accurate event information including date, time, venue, and description.</li>
                <li>Events must comply with campus policies and local regulations.</li>
                <li>Organizers are responsible for managing their events and attendees.</li>
                <li>Events promoting illegal activities, discrimination, or harassment are strictly prohibited.</li>
                <li>Campus Hub reserves the right to remove any event that violates these guidelines.</li>
              </ul>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Shield className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold m-0">4. User Conduct</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Users agree not to:
              </p>
              <ul className="text-muted-foreground space-y-2 list-disc pl-6">
                <li>Post false, misleading, or fraudulent content.</li>
                <li>Harass, abuse, or harm other users.</li>
                <li>Use the platform for any illegal purposes.</li>
                <li>Attempt to gain unauthorized access to other accounts or systems.</li>
                <li>Spam or send unsolicited communications.</li>
                <li>Impersonate other users or entities.</li>
                <li>Upload malicious code or interfere with platform operations.</li>
              </ul>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold m-0">5. Intellectual Property</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                All content, features, and functionality of Campus Hub are owned by us and are protected 
                by international copyright, trademark, and other intellectual property laws. Users retain 
                ownership of content they create but grant us a license to use, display, and distribute 
                such content on the platform.
              </p>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold m-0">6. Limitation of Liability</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Campus Hub is provided "as is" without warranties of any kind. We are not liable for 
                any damages arising from your use of the platform, including but not limited to direct, 
                indirect, incidental, or consequential damages. We do not guarantee the accuracy of 
                event information posted by users.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to suspend or terminate your account at any time for violations 
                of these terms or for any other reason at our discretion. Upon termination, your right 
                to use the platform will immediately cease.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update these terms from time to time. We will notify users of any material 
                changes by posting the new terms on this page and updating the "Last updated" date. 
                Your continued use of the platform after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">9. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms and Conditions, please contact us at{' '}
                <a href="mailto:support@campushub.com" className="text-primary hover:underline">
                  support@campushub.com
                </a>
              </p>
            </section>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
