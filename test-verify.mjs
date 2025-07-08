// test-verify.js
import argon2 from 'argon2';

const plain = 'ghazalgxz123';
const hash = '$argon2id$v=19$m=65536,t=3,p=4$LUvoIG4BkSaxF6BxMVUSMQ$x7JfWTAkRb1yhAknMPMWZKA8TZwDhzQ6IitYUrTRLU8';

const match = await argon2.verify(hash, plain);
console.log('MATCH:', match);
