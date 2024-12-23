export const DATABASE_URL = process.env.DATABASE_URL;
export const SERVICE_ACCOUNT = process.env.SERVICE_ACCOUNT;
export const PUB_SUB_PROJECT_ID = JSON.parse(process.env.FIREBASE_CONFIG).projectId; //process.env.GCLOUD_PROJECT || null;
