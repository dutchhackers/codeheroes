require('dotenv').config();
const fs = require('fs');

const template = fs.readFileSync('.firebaserc.template', 'utf8');
const config = template.replace(
  '${FIREBASE_PROJECT_ID}',
  process.env.FIREBASE_PROJECT_ID
);
fs.writeFileSync('.firebaserc', config);
