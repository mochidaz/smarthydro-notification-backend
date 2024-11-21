require('dotenv').config();

const admin = require('firebase-admin');

const serviceAccountKeyPath = require(process.env.FIREBASE_CREDENTIALS); 
const databaseURL = process.env.FIREBASE_DATABASE_URL; 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKeyPath),
  databaseURL: databaseURL, 
});

const db = admin.database();
const waterLevelRef = db.ref('water-level'); 
const fcmTokenRef = db.ref('fcm-token'); 

const sendFCMNotification = () => {
  fcmTokenRef.once('value', (snapshot) => {
    const data = snapshot.val();

    for (const key in data) {
      const fcmToken = data[key].token;
      const message = {
        notification: {
          title: 'Water Alert!',
          body: 'Salah satu level air telah mencapai 0 dan area tidak basah!',
        },
        token: fcmToken,
      };

      admin.messaging().send(message)
        .then((response) => {
          console.log('Notifikasi FCM berhasil dikirim:', response);
        })
        .catch((error) => {
          console.log('Notifikasi FCM gagal dikirim:', error);
        });
    }
    
  });
};

waterLevelRef.on('child_changed', (snapshot) => {
  const data = snapshot.val();

  console.log(data)

  if (data.wet === 'NO' && data.level === '0') {
    sendFCMNotification();
  }
});

console.log('Menunggu perubahan pada RTDB...');
