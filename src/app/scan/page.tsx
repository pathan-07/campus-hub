'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, QrCode, User, ScanLine, XCircle, CheckCircle, Camera, PartyPopper, AlertTriangle, Info, Mail } from 'lucide-react';
import jsQR from 'jsqr';
import { checkInUser } from '@/lib/events';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getUsersByUIDs } from '@/lib/users';
import type { UserProfile } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type QrPayload = {
  userId: string;
  eventId: string;
};

export default function ScanPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scannedData, setScannedData] = useState<QrPayload | null>(null);
  const [scannedUser, setScannedUser] = useState<UserProfile | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [scanResult, setScanResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);

  const loadScannedUser = useCallback(async (uid: string) => {
    try {
      const [profile] = await getUsersByUIDs([uid]);
      setScannedUser(profile ?? null);
    } catch (error) {
      console.error('Error loading scanned user profile:', error);
      setScannedUser(null);
    }
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      if(videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsScanning(false);
      setCameraStarted(false);
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (streamRef.current) stopCamera();
    
    setCameraStarted(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasCameraPermission(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      setIsScanning(false);
      setCameraStarted(false);
    }
  }, [stopCamera]);


  useEffect(() => {
     return () => {
      stopCamera();
    };
  }, [stopCamera]);


  // QR Code Scanning Loop
  useEffect(() => {
    let animationFrameId: number;

    const scan = () => {
      if (!isScanning || !videoRef.current || !canvasRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
        animationFrameId = requestAnimationFrame(scan);
        return;
      }

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code) {
          try {
            const data = JSON.parse(code.data) as QrPayload;
            if (data.userId && data.eventId) {
              setScannedData(data);
              setScanResult(null);
              setIsScanning(false);
              stopCamera();
              void loadScannedUser(data.userId);
            }
          } catch (e) {
            // Not a valid JSON QR code for our app, just ignore
          }
        }
      }
      animationFrameId = requestAnimationFrame(scan);
    };

    if(isScanning) {
        animationFrameId = requestAnimationFrame(scan);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isScanning, stopCamera, loadScannedUser]);


  const handleCheckIn = async () => {
    if (!scannedData) return;

    setIsCheckingIn(true);
    setScanResult(null);

    try {
      const result = await checkInUser(scannedData.eventId, scannedData.userId);

      if (result.success) {
        setScanResult({ type: 'success', message: result.message });
        toast({
          title: 'Check-in Successful',
          description: result.message,
        });
      } else {
        setScanResult({ type: 'error', message: result.message });
        toast({
          variant: 'destructive',
          title: 'Check-in Failed',
          description: result.message,
        });
      }
    } catch (error: any) {
      setScanResult({ type: 'error', message: error.message || 'An unknown error occurred.' });
      toast({
        variant: 'destructive',
        title: 'Scan Failed',
        description: error.message || 'Could not process check-in.',
      });
    } finally {
      setIsCheckingIn(false);
    }
  };
  
  const handleScanAgain = () => {
    setScannedData(null);
    setScannedUser(null);
    setScanResult(null);
    startCamera();
  }

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
      <main className="flex-1 container mx-auto p-4 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <QrCode className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-headline text-2xl">Event Check-in</CardTitle>
            <CardDescription>
              Scan attendee QR tickets to verify and check them into your event.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Camera Permission Error */}
            {hasCameraPermission === false && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Camera Access Denied</AlertTitle>
                <AlertDescription>
                  Please enable camera permissions in your browser settings to use the scanner.
                </AlertDescription>
              </Alert>
            )}

            {/* Scanner Area */}
            <div className="relative w-full aspect-square bg-muted rounded-xl overflow-hidden">
              <video 
                ref={videoRef} 
                className={cn('w-full h-full object-cover', !cameraStarted && 'hidden')} 
                autoPlay 
                playsInline 
                muted 
                onCanPlay={() => setIsScanning(true)} 
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Ready State */}
              {!cameraStarted && hasCameraPermission !== false && !scanResult && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-muted to-muted/80">
                  <div className="p-4 rounded-full bg-background/80 mb-4">
                    <Camera className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">Ready to Scan</h3>
                  <p className="text-muted-foreground text-sm">
                    Tap the button below to activate your camera
                  </p>
                </div>
              )}
              
              {/* Scanning State */}
              {isScanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {/* Scan Frame Overlay */}
                  <div className="absolute inset-8 border-2 border-white/50 rounded-2xl">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
                  </div>
                  {/* Scanning Line Animation */}
                  <div className="absolute inset-x-8 top-8 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
                  <div className="absolute bottom-6 left-0 right-0 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm">
                      <ScanLine className="h-4 w-4 text-white animate-pulse" />
                      <span className="text-white text-sm font-medium">Scanning...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Scanned User Preview */}
              {scannedData && !scanResult && (
                <div className="absolute inset-0 p-6 bg-background flex flex-col items-center justify-center text-center">
                  <Avatar className="h-20 w-20 mb-4 ring-4 ring-primary/20">
                    <AvatarImage src={scannedUser?.photoURL ?? undefined} />
                    <AvatarFallback className="text-2xl bg-primary/10">
                      {scannedUser?.displayName?.[0].toUpperCase() ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-bold">{scannedUser?.displayName ?? 'Attendee'}</h3>
                  {scannedUser?.email && (
                    <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                      <Mail className="h-3 w-3" />
                      {scannedUser.email}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-4 text-sm">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Ready to check in</span>
                  </div>
                </div>
              )}

              {/* Success State */}
              {scanResult?.type === 'success' && (
                <div className="absolute inset-0 p-6 bg-gradient-to-b from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/30 flex flex-col items-center justify-center text-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                    <div className="relative p-4 rounded-full bg-green-500">
                      <CheckCircle className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <div className="mt-6 flex items-center gap-2">
                    <PartyPopper className="h-5 w-5 text-green-600" />
                    <h3 className="text-xl font-bold text-green-700 dark:text-green-400">
                      Check-in Complete!
                    </h3>
                  </div>
                  <p className="text-green-600 dark:text-green-500 mt-2">{scanResult.message}</p>
                  {scannedUser && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {scannedUser.displayName} has been checked in
                    </p>
                  )}
                </div>
              )}

              {/* Error State */}
              {scanResult?.type === 'error' && (
                <div className="absolute inset-0 p-6 bg-gradient-to-b from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30 flex flex-col items-center justify-center text-center">
                  <div className="p-4 rounded-full bg-destructive">
                    <XCircle className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-destructive mt-6">
                    Check-in Failed
                  </h3>
                  <p className="text-destructive/80 mt-2 max-w-xs">{scanResult.message}</p>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-2">
            {/* Start Scanner Button */}
            {!cameraStarted && !scanResult && hasCameraPermission !== false && (
              <Button className="w-full" size="lg" onClick={startCamera}>
                <Camera className="mr-2 h-5 w-5" />
                Start Scanner
              </Button>
            )}

            {/* Stop Scanner Button */}
            {isScanning && (
              <Button className="w-full" onClick={stopCamera} variant="outline">
                Stop Scanner
              </Button>
            )}

            {/* Confirm Check-in Buttons */}
            {scannedData && !scanResult && (
              <>
                <Button className="w-full" size="lg" onClick={handleCheckIn} disabled={isCheckingIn}>
                  {isCheckingIn ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Checking in...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Confirm Check-in
                    </>
                  )}
                </Button>
                <Button variant="ghost" className="w-full" onClick={handleScanAgain} disabled={isCheckingIn}>
                  Cancel
                </Button>
              </>
            )}

            {/* Scan Again Button */}
            {(scanResult || hasCameraPermission === false) && (
              <Button className="w-full" size="lg" onClick={handleScanAgain}>
                <QrCode className="mr-2 h-5 w-5" />
                Scan Another Ticket
              </Button>
            )}
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
