const https = require('https');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../resources/driver');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const dest = path.join(dir, 'AudioDeviceCmdlets.dll');
const url = 'https://raw.githubusercontent.com/frgnca/AudioDeviceCmdlets/master/Source/AudioDeviceCmdlets.dll';

console.log('Downloading AudioDeviceCmdlets.dll...');

https.get(url, (res) => {
  if (res.statusCode !== 200) {
    console.error(`Failed to download: ${res.statusCode}`);
    return;
  }
  const file = fs.createWriteStream(dest);
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Download complete: ' + dest);
  });
}).on('error', (err) => {
  console.error('Error downloading: ' + err.message);
});
