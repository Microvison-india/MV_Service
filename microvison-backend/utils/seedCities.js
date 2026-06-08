/**
 * utils/seedCities.js
 * Run once: node utils/seedCities.js
 * Seeds the cities master list for Rajasthan and Punjab.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const City = require('../models/City');

const cities = [
  // ─── RAJASTHAN ────────────────────────────────────────────
  { name: 'Jaipur', district: 'Jaipur', state: 'Rajasthan' },
  { name: 'Jodhpur', district: 'Jodhpur', state: 'Rajasthan' },
  { name: 'Kota', district: 'Kota', state: 'Rajasthan' },
  { name: 'Udaipur', district: 'Udaipur', state: 'Rajasthan' },
  { name: 'Ajmer', district: 'Ajmer', state: 'Rajasthan' },
  { name: 'Bikaner', district: 'Bikaner', state: 'Rajasthan' },
  { name: 'Alwar', district: 'Alwar', state: 'Rajasthan' },
  { name: 'Bhilwara', district: 'Bhilwara', state: 'Rajasthan' },
  { name: 'Bharatpur', district: 'Bharatpur', state: 'Rajasthan' },
  { name: 'Sikar', district: 'Sikar', state: 'Rajasthan' },
  { name: 'Pali', district: 'Pali', state: 'Rajasthan' },
  { name: 'Sri Ganganagar', district: 'Sri Ganganagar', state: 'Rajasthan' },
  { name: 'Jhunjhunu', district: 'Jhunjhunu', state: 'Rajasthan' },
  { name: 'Tonk', district: 'Tonk', state: 'Rajasthan' },
  { name: 'Nagaur', district: 'Nagaur', state: 'Rajasthan' },
  { name: 'Churu', district: 'Churu', state: 'Rajasthan' },
  { name: 'Hanumangarh', district: 'Hanumangarh', state: 'Rajasthan' },
  { name: 'Dausa', district: 'Dausa', state: 'Rajasthan' },
  { name: 'Sawai Madhopur', district: 'Sawai Madhopur', state: 'Rajasthan' },
  { name: 'Barmer', district: 'Barmer', state: 'Rajasthan' },
  { name: 'Jaisalmer', district: 'Jaisalmer', state: 'Rajasthan' },
  { name: 'Jalore', district: 'Jalore', state: 'Rajasthan' },
  { name: 'Sirohi', district: 'Sirohi', state: 'Rajasthan' },
  { name: 'Dungarpur', district: 'Dungarpur', state: 'Rajasthan' },
  { name: 'Banswara', district: 'Banswara', state: 'Rajasthan' },
  { name: 'Bundi', district: 'Bundi', state: 'Rajasthan' },
  { name: 'Jhalawar', district: 'Jhalawar', state: 'Rajasthan' },
  { name: 'Baran', district: 'Baran', state: 'Rajasthan' },
  { name: 'Rajsamand', district: 'Rajsamand', state: 'Rajasthan' },
  { name: 'Pratapgarh', district: 'Pratapgarh', state: 'Rajasthan' },
  { name: 'Karauli', district: 'Karauli', state: 'Rajasthan' },
  { name: 'Dholpur', district: 'Dholpur', state: 'Rajasthan' },
  { name: 'Chittorgarh', district: 'Chittorgarh', state: 'Rajasthan' },
  { name: 'Sriganganagar', district: 'Sri Ganganagar', state: 'Rajasthan' },
  { name: 'Kishangarh', district: 'Ajmer', state: 'Rajasthan' },
  { name: 'Beawar', district: 'Ajmer', state: 'Rajasthan' },
  { name: 'Makrana', district: 'Nagaur', state: 'Rajasthan' },
  { name: 'Nokha', district: 'Bikaner', state: 'Rajasthan' },
  { name: 'Sujangarh', district: 'Churu', state: 'Rajasthan' },
  { name: 'Sardarshahar', district: 'Churu', state: 'Rajasthan' },
  { name: 'Ratangarh', district: 'Churu', state: 'Rajasthan' },
  { name: 'Pilani', district: 'Jhunjhunu', state: 'Rajasthan' },
  { name: 'Fatehpur', district: 'Sikar', state: 'Rajasthan' },
  { name: 'Laxmangarh', district: 'Sikar', state: 'Rajasthan' },
  { name: 'Neem ka Thana', district: 'Sikar', state: 'Rajasthan' },
  { name: 'Kotputli', district: 'Jaipur', state: 'Rajasthan' },
  { name: 'Chomu', district: 'Jaipur', state: 'Rajasthan' },
  { name: 'Phulera', district: 'Jaipur', state: 'Rajasthan' },
  { name: 'Bandikui', district: 'Dausa', state: 'Rajasthan' },
  { name: 'Lalsot', district: 'Dausa', state: 'Rajasthan' },
  { name: 'Gangapur City', district: 'Sawai Madhopur', state: 'Rajasthan' },
  { name: 'Hindaun', district: 'Karauli', state: 'Rajasthan' },

  // ─── PUNJAB ───────────────────────────────────────────────
  { name: 'Ludhiana', district: 'Ludhiana', state: 'Punjab' },
  { name: 'Amritsar', district: 'Amritsar', state: 'Punjab' },
  { name: 'Jalandhar', district: 'Jalandhar', state: 'Punjab' },
  { name: 'Patiala', district: 'Patiala', state: 'Punjab' },
  { name: 'Bathinda', district: 'Bathinda', state: 'Punjab' },
  { name: 'Mohali', district: 'SAS Nagar', state: 'Punjab' },
  { name: 'Hoshiarpur', district: 'Hoshiarpur', state: 'Punjab' },
  { name: 'Gurdaspur', district: 'Gurdaspur', state: 'Punjab' },
  { name: 'Pathankot', district: 'Pathankot', state: 'Punjab' },
  { name: 'Moga', district: 'Moga', state: 'Punjab' },
  { name: 'Firozpur', district: 'Firozpur', state: 'Punjab' },
  { name: 'Sangrur', district: 'Sangrur', state: 'Punjab' },
  { name: 'Faridkot', district: 'Faridkot', state: 'Punjab' },
  { name: 'Muktsar', district: 'Sri Muktsar Sahib', state: 'Punjab' },
  { name: 'Barnala', district: 'Barnala', state: 'Punjab' },
  { name: 'Ropar', district: 'Rupnagar', state: 'Punjab' },
  { name: 'Nawanshahr', district: 'Shahid Bhagat Singh Nagar', state: 'Punjab' },
  { name: 'Kapurthala', district: 'Kapurthala', state: 'Punjab' },
  { name: 'Tarn Taran', district: 'Tarn Taran', state: 'Punjab' },
  { name: 'Fatehgarh Sahib', district: 'Fatehgarh Sahib', state: 'Punjab' },
  { name: 'Mansa', district: 'Mansa', state: 'Punjab' },
  { name: 'Fazilka', district: 'Fazilka', state: 'Punjab' },
  { name: 'Malerkotla', district: 'Malerkotla', state: 'Punjab' },
  { name: 'Abohar', district: 'Fazilka', state: 'Punjab' },
  { name: 'Khanna', district: 'Ludhiana', state: 'Punjab' },
  { name: 'Phagwara', district: 'Kapurthala', state: 'Punjab' },
  { name: 'Morinda', district: 'Rupnagar', state: 'Punjab' },
  { name: 'Zirakpur', district: 'SAS Nagar', state: 'Punjab' },
  { name: 'Rajpura', district: 'Patiala', state: 'Punjab' },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    await City.deleteMany({});
    console.log('Cleared existing cities');

    const inserted = await City.insertMany(cities);
    console.log(`✅ Seeded ${inserted.length} cities successfully`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
