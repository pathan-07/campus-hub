'use server';

import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { app } from './firebase';

const storage = getStorage(app);

/**
 * Uploads a base64 encoded image string to Firebase Storage.
 * @param path - The path in storage to save the file (e.g., 'event-images/some-id.png').
 * @param base64String - The base64 encoded image data string (without the 'data:image/png;base64,' prefix).
 * @returns The public download URL of the uploaded image.
 */
export async function uploadImageFromBase64(path: string, base64String: string): Promise<string> {
  const storageRef = ref(storage, path);
  try {
    const snapshot = await uploadString(storageRef, `data:image/png;base64,${base64String}`, 'data_url');
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image to Firebase Storage:", error);
    throw new Error("Failed to upload image.");
  }
}
