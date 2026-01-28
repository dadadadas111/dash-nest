import { registerAs } from '@nestjs/config';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
export const firebaseConfig = registerAs('firebase', () => {
  const serviceAccountKeyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;

  if (!serviceAccountKeyJson) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY_JSON environment variable is not set',
    );
  }

  let serviceAccountKey: Record<string, any>;
  try {
    serviceAccountKey = JSON.parse(serviceAccountKeyJson);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY_JSON is not valid JSON');
  }

  return {
    projectId: serviceAccountKey.project_id,

    serviceAccountKey,
  };
});
/* eslint-enable @typescript-eslint/no-unsafe-assignment */
