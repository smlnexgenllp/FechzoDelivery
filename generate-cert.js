import fs from 'fs';
import path from 'path';
import selfsignedPkg from 'selfsigned'; // use default import
const selfsigned = selfsignedPkg.default || selfsignedPkg; // ensures we get the function

// Generate certificate
const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, { days: 365 });

if (!pems || !pems.cert || !pems.private) {
  throw new Error('Failed to generate self-signed certificate');
}

// Create cert folder if it doesn't exist
const certDir = path.resolve('./cert');
if (!fs.existsSync(certDir)) fs.mkdirSync(certDir);

// Write certificate files
fs.writeFileSync(path.join(certDir, 'cert.pem'), pems.cert);
fs.writeFileSync(path.join(certDir, 'key.pem'), pems.private);

console.log('✅ Self-signed certificate generated in ./cert folder');
