const admin = require('firebase-admin');
const ServiceAccount = require('./ServiceAccount.json');

admin.initializeApp({ credential: admin.credential.cert(ServiceAccount) });

const db = admin.firestore();


const omu_riceRef = db.collection('龍谷食堂').doc('オムライス');

const omurice = omu_riceRef.set({
  store_name: '龍谷食堂',
  cuisinn_name: 'omurice',
  cuisine_URL: 'image\money_coin_america_10_reverse.png',
  discountAmount: 100,
  discountRate: null,
});

const tamagoyakiRef = db.collection('龍谷食堂').doc('卵焼き');

const tamagoyaki = tamagoyakiRef.set({
  store_name: '龍谷食堂',
  cuisinn_name: 'tamagoyaki',
  cuisine_URL: 'image\money_coin_america_10_reverse.png',
  discountAmount: null,
  discountRate: 30,
});

const tonkoturamenRef = db.collection('宮本屋').doc('豚骨ラーメン');

const ramen = tonkoturamenRef.set({
  store_name: '宮本屋',
  cuisinn_name: 'tonkotu_ramen',
  cuisine_URL: 'image\money_coin_america_10_reverse.png',
  discountAmount: null,
  discountRate: 14,
});

/*
db.collection('store_name')
  .get()
  .then(snapshot => {
    snapshot.forEach(doc => {
      console.log(doc.id, '=>', doc.data());
    });
  })
  .catch(err => {
    console.log('Error getting documents', err);
  });
*/