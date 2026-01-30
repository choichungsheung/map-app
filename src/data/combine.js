const fs = require('fs');
const path = require('path');

const districtFiles = [
  'Central and Western.json',
  'Eastern.json',
  'Islands.json',
  'Kowloon City.json',
  'Kwai Tsing.json',
  'Kwun Tong.json',
  'North.json',
  'Sai Kung.json',
  'Sha Tin.json',
  'Sham Shui Po.json',
  'Southern.json',
  'Tai Po.json',
  'Tsuen Wan.json',
  'Tuen Mun.json',
  'Wan Chai.json',
  'Wong Tai Sin.json',
  'Yau Tsim Mong.json',
  'Yuen Long.json'
];

const combined = {
  "type": "FeatureCollection",
  "features": []
};

const hongKongIsland = ['Central and Western.json', 'Wan Chai.json', 'Eastern.json', 'Southern.json'];
const kowloon = ['Yau Tsim Mong.json', 'Sham Shui Po.json', 'Kowloon City.json', 'Wong Tai Sin.json', 'Kwun Tong.json'];
const newTerritories = ['Kwai Tsing.json', 'Tsuen Wan.json', 'Tuen Mun.json', 'Yuen Long.json', 'North.json', 'Tai Po.json', 'Sha Tin.json', 'Sai Kung.json', 'Islands.json'];

districtFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (data.features && data.features.length > 0) {
      data.features.forEach(feature => {
        if (hongKongIsland.includes(file)) {
          feature.properties.area = 'Hong Kong Island';
        } else if (kowloon.includes(file)) {
          feature.properties.area = 'Kowloon';
        } else if (newTerritories.includes(file)) {
          feature.properties.area = 'New Territories';
        }
        combined.features.push(feature);
      });
    }
  }
});

fs.writeFileSync('combined_districts.json', JSON.stringify(combined, null, 2));
console.log('Combined GeoJSON saved to combined_districts.json');