/**
 * Generate VAPID keys for Web Push Notifications
 * Run: npm run generate-vapid
 */

import webpush from 'web-push';

const vapidKeys = webpush.generateVAPIDKeys();

console.log('\n🔑 VAPID Keys Generated!\n');
console.log('Add these to your .env file:\n');
console.log('# VAPID Keys for Push Notifications');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:admin@shusseki.co.in`);
console.log('\n⚠️  Keep the private key secret! Do not commit to git.\n');
