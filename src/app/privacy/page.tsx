'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Eye, Lock, Database, Share2, UserCheck, Mail, Trash2 } from 'lucide-react';

export default function PrivacyPage() {
  const lastUpdated = 'December 11, 2025';

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Shield className="h-4 w-4" />
            Legal
          </div>
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-foreground mb-2">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6 prose prose-neutral dark:prose-invert max-w-none">
            <section className="mb-8">
              <p className="text-muted-foreground leading-relaxed">
                At Campus Hub, we take your privacy seriously. This Privacy Policy explains how we 
                collect, use, disclose, and safeguard your information when you use our platform. 
                Please read this policy carefully to understand our practices regarding your personal data.
              </p>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Database className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold m-0">1. Information We Collect</h2>
              </div>
              <h3 className="text-lg font-medium mt-4 mb-2">Personal Information</h3>
              <ul className="text-muted-foreground space-y-2 list-disc pl-6">
                <li>Name and email address</li>
                <li>Profile photo (optional)</li>
                <li>Bio and display name</li>
                <li>Educational institution affiliation</li>
              </ul>
              <h3 className="text-lg font-medium mt-4 mb-2">Usage Information</h3>
              <ul className="text-muted-foreground space-y-2 list-disc pl-6">
                <li>Events you create, attend, or interact with</li>
                <li>Comments and feedback you provide</li>
                <li>Points and badges earned</li>
                <li>Device and browser information</li>
                <li>IP address and location data</li>
              </ul>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Eye className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold m-0">2. How We Use Your Information</h2>
              </div>
              <ul className="text-muted-foreground space-y-2 list-disc pl-6">
                <li>To provide and maintain our platform</li>
                <li>To create and manage your account</li>
                <li>To enable event creation, registration, and check-in</li>
                <li>To send you event updates and notifications</li>
                <li>To display leaderboards and gamification features</li>
                <li>To improve our services and user experience</li>
                <li>To communicate with you about platform updates</li>
                <li>To detect and prevent fraud or abuse</li>
              </ul>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Share2 className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold m-0">3. Information Sharing</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We may share your information in the following circumstances:
              </p>
              <ul className="text-muted-foreground space-y-2 list-disc pl-6">
                <li><strong>Event Organizers:</strong> When you register for an event, your basic profile information may be shared with the organizer.</li>
                <li><strong>Public Profile:</strong> Your display name, photo, and points are visible on public leaderboards.</li>
                <li><strong>Service Providers:</strong> We use third-party services (Supabase, Google AI) to operate our platform.</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights.</li>
              </ul>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Lock className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold m-0">4. Data Security</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational security measures to protect 
                your personal information. This includes encryption, secure authentication, and 
                regular security assessments. However, no method of transmission over the internet 
                is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <UserCheck className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold m-0">5. Your Rights</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You have the following rights regarding your personal data:
              </p>
              <ul className="text-muted-foreground space-y-2 list-disc pl-6">
                <li><strong>Access:</strong> Request a copy of your personal data.</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information.</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data.</li>
                <li><strong>Portability:</strong> Request your data in a portable format.</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications.</li>
              </ul>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Trash2 className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold m-0">6. Data Retention</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                We retain your personal information for as long as your account is active or as 
                needed to provide you services. If you delete your account, we will delete your 
                personal data within 30 days, except where we need to retain it for legal or 
                legitimate business purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. Cookies and Tracking</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar technologies to maintain your session, remember your 
                preferences, and analyze platform usage. You can control cookies through your 
                browser settings, but disabling them may affect platform functionality.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Campus Hub is not intended for users under the age of 13. We do not knowingly 
                collect personal information from children under 13. If we become aware of such 
                data, we will delete it immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">9. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any 
                changes by posting the new policy on this page and updating the "Last updated" date. 
                We encourage you to review this policy periodically.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Mail className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold m-0">10. Contact Us</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy or our data practices, please contact us at{' '}
                <a href="mailto:privacy@campushub.com" className="text-primary hover:underline">
                  privacy@campushub.com
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
