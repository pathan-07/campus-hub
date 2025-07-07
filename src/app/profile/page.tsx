'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User } from 'lucide-react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '@/lib/firebase';
import imageCompression from 'browser-image-compression';

const storage = getStorage(app);

export default function ProfilePage() {
  const { user, loading, updateUserProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState('');
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      setDisplayName(user.displayName || '');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (profilePicFile) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(profilePicFile);
    } else {
        setPreviewUrl(null);
    }
  }, [profilePicFile]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please select an image smaller than 10MB.',
        });
        return;
      }

      setIsCompressing(true);
      try {
        const options = {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1024,
            useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        setProfilePicFile(compressedFile);
      } catch (error) {
        console.error("Image compression failed:", error)
        toast({
          variant: 'destructive',
          title: 'Compression Failed',
          description: 'There was an error processing your image. Please try a different one.',
        });
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
        let photoURL = user.photoURL;
        if (profilePicFile) {
            const filePath = `profile-pictures/${user.uid}`;
            const storageRef = ref(storage, filePath);
            const snapshot = await uploadBytes(storageRef, profilePicFile);
            photoURL = await getDownloadURL(snapshot.ref);
        }

        await updateUserProfile({
            displayName: displayName,
            photoURL: photoURL || undefined,
        });

        toast({
            title: 'Profile Updated',
            description: 'Your profile has been successfully updated.',
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message,
        });
    } finally {
        setIsSubmitting(false);
        setProfilePicFile(null);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <h1 className="text-3xl md:text-5xl font-headline text-foreground mb-8">
          My Profile
        </h1>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your display name and profile picture.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center space-x-6">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={previewUrl || user.photoURL || undefined} />
                        <AvatarFallback className="text-3xl">
                            <User className="h-12 w-12 text-muted-foreground"/>
                        </AvatarFallback>
                    </Avatar>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="picture">Profile Picture</Label>
                        <Input id="picture" type="file" accept="image/png, image/jpeg" onChange={handleFileChange} disabled={isCompressing || isSubmitting} />
                        <p className="text-sm text-muted-foreground">PNG, JPG up to 10MB.</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input 
                        id="displayName" 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your Name"
                        disabled={isCompressing || isSubmitting}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                        id="email" 
                        value={user.email || ''}
                        disabled
                        className="cursor-not-allowed"
                    />
                </div>

                <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || isCompressing}>
                    {isCompressing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
