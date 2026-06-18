import { loadAppData } from './storage';
import { replaceFirebaseAppData } from './firebaseDataProvider';

export async function seedFirebaseFromLocalDemoData(): Promise<void> {
  await replaceFirebaseAppData(loadAppData());
}
