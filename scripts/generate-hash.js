// scripts/generate-hash.js
// scripts/generate-hash.js
const argon2 = require('argon2');

const password = 'ghazalgxz123';

argon2.hash(password)
  .then(hash => {
    console.log('✅ Hashed password:', hash);
  })
  .catch(err => {
    console.error('❌ Error hashing password:', err);
  });



