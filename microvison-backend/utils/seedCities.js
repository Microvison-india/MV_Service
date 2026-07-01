/**
 * utils/seedCities.js
 * Run once: node utils/seedCities.js
 * Seeds master city list for Rajasthan (41 dist), Punjab (23 dist),
 * Haryana (22 dist), Gujarat (33 dist), Maharashtra (36 dist)
 * Districts verified against LGD + official sources (2026)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const City = require('../models/City');

const cities = [

  // ═══════════════════════════════════════════════════════════
  // RAJASTHAN — 41 districts (LGD verified, includes all new 2023 districts)
  // ═══════════════════════════════════════════════════════════

  // Ajmer
  { name: 'Ajmer', district: 'Ajmer', state: 'Rajasthan' },
  { name: 'Kishangarh', district: 'Ajmer', state: 'Rajasthan' },
  { name: 'Beawar', district: 'Beawar', state: 'Rajasthan' },
  { name: 'Nasirabad', district: 'Ajmer', state: 'Rajasthan' },
  { name: 'Pushkar', district: 'Ajmer', state: 'Rajasthan' },
  { name: 'Kekri', district: 'Ajmer', state: 'Rajasthan' },
  { name: 'Masuda', district: 'Ajmer', state: 'Rajasthan' },

  // Alwar
  { name: 'Alwar', district: 'Alwar', state: 'Rajasthan' },
  { name: 'Bhiwadi', district: 'Alwar', state: 'Rajasthan' },
  { name: 'Behror', district: 'Kotputli-Behror', state: 'Rajasthan' },
  { name: 'Tijara', district: 'Khairthal-Tijara', state: 'Rajasthan' },
  { name: 'Rajgarh', district: 'Alwar', state: 'Rajasthan' },
  { name: 'Ramgarh', district: 'Alwar', state: 'Rajasthan' },
  { name: 'Mundawar', district: 'Alwar', state: 'Rajasthan' },
  { name: 'Neemrana', district: 'Kotputli-Behror', state: 'Rajasthan' },
  { name: 'Laxmangarh', district: 'Alwar', state: 'Rajasthan' },
  { name: 'Khairthal', district: 'Khairthal-Tijara', state: 'Rajasthan' },

  // Balotra (new district)
  { name: 'Balotra', district: 'Balotra', state: 'Rajasthan' },
  { name: 'Pachpadra', district: 'Balotra', state: 'Rajasthan' },
  { name: 'Siwana', district: 'Balotra', state: 'Rajasthan' },
  { name: 'Sindhari', district: 'Balotra', state: 'Rajasthan' },

  // Banswara
  { name: 'Banswara', district: 'Banswara', state: 'Rajasthan' },
  { name: 'Kushalgarh', district: 'Banswara', state: 'Rajasthan' },
  { name: 'Ghatol', district: 'Banswara', state: 'Rajasthan' },

  // Baran
  { name: 'Baran', district: 'Baran', state: 'Rajasthan' },
  { name: 'Atru', district: 'Baran', state: 'Rajasthan' },
  { name: 'Chhabra', district: 'Baran', state: 'Rajasthan' },
  { name: 'Shahabad', district: 'Baran', state: 'Rajasthan' },
  { name: 'Mangrol', district: 'Baran', state: 'Rajasthan' },
  { name: 'Chhipabarod', district: 'Baran', state: 'Rajasthan' },

  // Barmer
  { name: 'Barmer', district: 'Barmer', state: 'Rajasthan' },
  { name: 'Sheo', district: 'Barmer', state: 'Rajasthan' },
  { name: 'Gudamalani', district: 'Barmer', state: 'Rajasthan' },
  { name: 'Chohtan', district: 'Barmer', state: 'Rajasthan' },
  { name: 'Baytu', district: 'Barmer', state: 'Rajasthan' },

  // Beawar (new district)
  { name: 'Masuda', district: 'Beawar', state: 'Rajasthan' },
  { name: 'Jawaja', district: 'Beawar', state: 'Rajasthan' },

  // Bharatpur
  { name: 'Bharatpur', district: 'Bharatpur', state: 'Rajasthan' },
  { name: 'Nagar', district: 'Bharatpur', state: 'Rajasthan' },
  { name: 'Weir', district: 'Bharatpur', state: 'Rajasthan' },
  { name: 'Nadbai', district: 'Bharatpur', state: 'Rajasthan' },
  { name: 'Rupbas', district: 'Bharatpur', state: 'Rajasthan' },
  { name: 'Kumher', district: 'Deeg', state: 'Rajasthan' },
  { name: 'Kaman', district: 'Deeg', state: 'Rajasthan' },
  { name: 'Deeg', district: 'Deeg', state: 'Rajasthan' },

  // Bhilwara
  { name: 'Bhilwara', district: 'Bhilwara', state: 'Rajasthan' },
  { name: 'Shahpura', district: 'Bhilwara', state: 'Rajasthan' },
  { name: 'Gulabpura', district: 'Bhilwara', state: 'Rajasthan' },
  { name: 'Gangapur', district: 'Bhilwara', state: 'Rajasthan' },
  { name: 'Mandalgarh', district: 'Bhilwara', state: 'Rajasthan' },
  { name: 'Asind', district: 'Bhilwara', state: 'Rajasthan' },
  { name: 'Mandal', district: 'Bhilwara', state: 'Rajasthan' },

  // Bikaner
  { name: 'Bikaner', district: 'Bikaner', state: 'Rajasthan' },
  { name: 'Nokha', district: 'Bikaner', state: 'Rajasthan' },
  { name: 'Lunkaransar', district: 'Bikaner', state: 'Rajasthan' },
  { name: 'Kolayat', district: 'Bikaner', state: 'Rajasthan' },
  { name: 'Dungargarh', district: 'Bikaner', state: 'Rajasthan' },
  { name: 'Phalodi', district: 'Phalodi', state: 'Rajasthan' },
  { name: 'Osian', district: 'Phalodi', state: 'Rajasthan' },

  // Bundi
  { name: 'Bundi', district: 'Bundi', state: 'Rajasthan' },
  { name: 'Nainwa', district: 'Bundi', state: 'Rajasthan' },
  { name: 'Indergarh', district: 'Bundi', state: 'Rajasthan' },
  { name: 'Hindoli', district: 'Bundi', state: 'Rajasthan' },
  { name: 'Keshoraipatan', district: 'Bundi', state: 'Rajasthan' },

  // Chittorgarh
  { name: 'Chittorgarh', district: 'Chittorgarh', state: 'Rajasthan' },
  { name: 'Nimbahera', district: 'Chittorgarh', state: 'Rajasthan' },
  { name: 'Begun', district: 'Chittorgarh', state: 'Rajasthan' },
  { name: 'Kapasan', district: 'Chittorgarh', state: 'Rajasthan' },
  { name: 'Rawatbhata', district: 'Chittorgarh', state: 'Rajasthan' },
  { name: 'Bari Sadri', district: 'Chittorgarh', state: 'Rajasthan' },

  // Churu
  { name: 'Churu', district: 'Churu', state: 'Rajasthan' },
  { name: 'Sujangarh', district: 'Churu', state: 'Rajasthan' },
  { name: 'Sardarshahar', district: 'Churu', state: 'Rajasthan' },
  { name: 'Ratangarh', district: 'Churu', state: 'Rajasthan' },
  { name: 'Rajgarh', district: 'Churu', state: 'Rajasthan' },
  { name: 'Taranagar', district: 'Churu', state: 'Rajasthan' },
  { name: 'Salasar', district: 'Churu', state: 'Rajasthan' },
  { name: 'Bidasar', district: 'Churu', state: 'Rajasthan' },

  // Dausa
  { name: 'Dausa', district: 'Dausa', state: 'Rajasthan' },
  { name: 'Bandikui', district: 'Dausa', state: 'Rajasthan' },
  { name: 'Lalsot', district: 'Dausa', state: 'Rajasthan' },
  { name: 'Sikrai', district: 'Dausa', state: 'Rajasthan' },
  { name: 'Mahwa', district: 'Dausa', state: 'Rajasthan' },
  { name: 'Baswa', district: 'Dausa', state: 'Rajasthan' },

  // Deeg (new district)
  { name: 'Pahari', district: 'Deeg', state: 'Rajasthan' },
  { name: 'Nagar', district: 'Deeg', state: 'Rajasthan' },

  // Dholpur
  { name: 'Dholpur', district: 'Dholpur', state: 'Rajasthan' },
  { name: 'Bari', district: 'Dholpur', state: 'Rajasthan' },
  { name: 'Rajakhera', district: 'Dholpur', state: 'Rajasthan' },
  { name: 'Baseri', district: 'Dholpur', state: 'Rajasthan' },

  // Didwana-Kuchaman (new district)
  { name: 'Didwana', district: 'Didwana-Kuchaman', state: 'Rajasthan' },
  { name: 'Kuchaman City', district: 'Didwana-Kuchaman', state: 'Rajasthan' },
  { name: 'Ladnun', district: 'Didwana-Kuchaman', state: 'Rajasthan' },
  { name: 'Nawa', district: 'Didwana-Kuchaman', state: 'Rajasthan' },
  { name: 'Jayal', district: 'Didwana-Kuchaman', state: 'Rajasthan' },

  // Dungarpur
  { name: 'Dungarpur', district: 'Dungarpur', state: 'Rajasthan' },
  { name: 'Sagwara', district: 'Dungarpur', state: 'Rajasthan' },
  { name: 'Simalwara', district: 'Dungarpur', state: 'Rajasthan' },

  // Ganganagar
  { name: 'Sri Ganganagar', district: 'Ganganagar', state: 'Rajasthan' },
  { name: 'Suratgarh', district: 'Ganganagar', state: 'Rajasthan' },
  { name: 'Raisinghnagar', district: 'Ganganagar', state: 'Rajasthan' },
  { name: 'Anupgarh', district: 'Ganganagar', state: 'Rajasthan' },
  { name: 'Gharsana', district: 'Ganganagar', state: 'Rajasthan' },
  { name: 'Padampur', district: 'Ganganagar', state: 'Rajasthan' },
  { name: 'Karanpur', district: 'Ganganagar', state: 'Rajasthan' },
  { name: 'Vijaynagar', district: 'Ganganagar', state: 'Rajasthan' },

  // Hanumangarh
  { name: 'Hanumangarh', district: 'Hanumangarh', state: 'Rajasthan' },
  { name: 'Sangaria', district: 'Hanumangarh', state: 'Rajasthan' },
  { name: 'Pilibanga', district: 'Hanumangarh', state: 'Rajasthan' },
  { name: 'Nohar', district: 'Hanumangarh', state: 'Rajasthan' },
  { name: 'Bhadra', district: 'Hanumangarh', state: 'Rajasthan' },
  { name: 'Rawatsar', district: 'Hanumangarh', state: 'Rajasthan' },
  { name: 'Tibbi', district: 'Hanumangarh', state: 'Rajasthan' },

  // Jaipur
  { name: 'Jaipur', district: 'Jaipur', state: 'Rajasthan' },
  { name: 'Kotputli', district: 'Kotputli-Behror', state: 'Rajasthan' },
  { name: 'Chomu', district: 'Jaipur', state: 'Rajasthan' },
  { name: 'Phulera', district: 'Jaipur', state: 'Rajasthan' },
  { name: 'Shahpura', district: 'Jaipur', state: 'Rajasthan' },
  { name: 'Sambhar', district: 'Jaipur', state: 'Rajasthan' },
  { name: 'Jobner', district: 'Jaipur', state: 'Rajasthan' },
  { name: 'Chaksu', district: 'Jaipur', state: 'Rajasthan' },
  { name: 'Dudu', district: 'Jaipur', state: 'Rajasthan' },

  // Jaisalmer
  { name: 'Jaisalmer', district: 'Jaisalmer', state: 'Rajasthan' },
  { name: 'Pokaran', district: 'Jaisalmer', state: 'Rajasthan' },
  { name: 'Fatehgarh', district: 'Jaisalmer', state: 'Rajasthan' },

  // Jalore
  { name: 'Jalore', district: 'Jalore', state: 'Rajasthan' },
  { name: 'Sanchore', district: 'Jalore', state: 'Rajasthan' },
  { name: 'Bhinmal', district: 'Jalore', state: 'Rajasthan' },
  { name: 'Ahore', district: 'Jalore', state: 'Rajasthan' },
  { name: 'Sayla', district: 'Jalore', state: 'Rajasthan' },

  // Jhalawar
  { name: 'Jhalawar', district: 'Jhalawar', state: 'Rajasthan' },
  { name: 'Jhalarapatan', district: 'Jhalawar', state: 'Rajasthan' },
  { name: 'Khanpur', district: 'Jhalawar', state: 'Rajasthan' },
  { name: 'Aklera', district: 'Jhalawar', state: 'Rajasthan' },
  { name: 'Dag', district: 'Jhalawar', state: 'Rajasthan' },
  { name: 'Pirawa', district: 'Jhalawar', state: 'Rajasthan' },

  // Jhunjhunu
  { name: 'Jhunjhunu', district: 'Jhunjhunu', state: 'Rajasthan' },
  { name: 'Pilani', district: 'Jhunjhunu', state: 'Rajasthan' },
  { name: 'Chirawa', district: 'Jhunjhunu', state: 'Rajasthan' },
  { name: 'Nawalgarh', district: 'Jhunjhunu', state: 'Rajasthan' },
  { name: 'Mandawa', district: 'Jhunjhunu', state: 'Rajasthan' },
  { name: 'Udaipurwati', district: 'Jhunjhunu', state: 'Rajasthan' },
  { name: 'Surajgarh', district: 'Jhunjhunu', state: 'Rajasthan' },
  { name: 'Bissau', district: 'Jhunjhunu', state: 'Rajasthan' },

  // Jodhpur
  { name: 'Jodhpur', district: 'Jodhpur', state: 'Rajasthan' },
  { name: 'Bilara', district: 'Jodhpur', state: 'Rajasthan' },
  { name: 'Luni', district: 'Jodhpur', state: 'Rajasthan' },
  { name: 'Pipar City', district: 'Jodhpur', state: 'Rajasthan' },
  { name: 'Bhopalgarh', district: 'Jodhpur', state: 'Rajasthan' },
  { name: 'Shergarh', district: 'Jodhpur', state: 'Rajasthan' },

  // Karauli
  { name: 'Karauli', district: 'Karauli', state: 'Rajasthan' },
  { name: 'Hindaun', district: 'Karauli', state: 'Rajasthan' },
  { name: 'Sapotra', district: 'Karauli', state: 'Rajasthan' },
  { name: 'Nadoti', district: 'Karauli', state: 'Rajasthan' },
  { name: 'Todabhim', district: 'Karauli', state: 'Rajasthan' },

  // Khairthal-Tijara (new district)
  { name: 'Kotkasim', district: 'Khairthal-Tijara', state: 'Rajasthan' },

  // Kota
  { name: 'Kota', district: 'Kota', state: 'Rajasthan' },
  { name: 'Sangod', district: 'Kota', state: 'Rajasthan' },
  { name: 'Sultanpur', district: 'Kota', state: 'Rajasthan' },
  { name: 'Ramganj Mandi', district: 'Kota', state: 'Rajasthan' },
  { name: 'Ladpura', district: 'Kota', state: 'Rajasthan' },

  // Kotputli-Behror (new district)
  { name: 'Shahpura', district: 'Kotputli-Behror', state: 'Rajasthan' },
  { name: 'Viratnagar', district: 'Kotputli-Behror', state: 'Rajasthan' },

  // Nagaur
  { name: 'Nagaur', district: 'Nagaur', state: 'Rajasthan' },
  { name: 'Makrana', district: 'Nagaur', state: 'Rajasthan' },
  { name: 'Merta City', district: 'Nagaur', state: 'Rajasthan' },
  { name: 'Mundwa', district: 'Nagaur', state: 'Rajasthan' },
  { name: 'Parbatsar', district: 'Nagaur', state: 'Rajasthan' },
  { name: 'Degana', district: 'Nagaur', state: 'Rajasthan' },
  { name: 'Nawan', district: 'Nagaur', state: 'Rajasthan' },
  { name: 'Khinwsar', district: 'Nagaur', state: 'Rajasthan' },

  // Pali
  { name: 'Pali', district: 'Pali', state: 'Rajasthan' },
  { name: 'Sojat', district: 'Pali', state: 'Rajasthan' },
  { name: 'Sumerpur', district: 'Pali', state: 'Rajasthan' },
  { name: 'Jaitaran', district: 'Pali', state: 'Rajasthan' },
  { name: 'Desuri', district: 'Pali', state: 'Rajasthan' },
  { name: 'Bali', district: 'Pali', state: 'Rajasthan' },
  { name: 'Marwar Junction', district: 'Pali', state: 'Rajasthan' },
  { name: 'Rohat', district: 'Pali', state: 'Rajasthan' },

  // Phalodi (new district)
  { name: 'Phalodi', district: 'Phalodi', state: 'Rajasthan' },
  { name: 'Bap', district: 'Phalodi', state: 'Rajasthan' },

  // Pratapgarh
  { name: 'Pratapgarh', district: 'Pratapgarh', state: 'Rajasthan' },
  { name: 'Arnod', district: 'Pratapgarh', state: 'Rajasthan' },
  { name: 'Chhoti Sadri', district: 'Pratapgarh', state: 'Rajasthan' },
  { name: 'Dhariawad', district: 'Pratapgarh', state: 'Rajasthan' },

  // Rajsamand
  { name: 'Rajsamand', district: 'Rajsamand', state: 'Rajasthan' },
  { name: 'Nathdwara', district: 'Rajsamand', state: 'Rajasthan' },
  { name: 'Railmagra', district: 'Rajsamand', state: 'Rajasthan' },
  { name: 'Bhim', district: 'Rajsamand', state: 'Rajasthan' },
  { name: 'Deogarh', district: 'Rajsamand', state: 'Rajasthan' },
  { name: 'Kankroli', district: 'Rajsamand', state: 'Rajasthan' },
  { name: 'Amet', district: 'Rajsamand', state: 'Rajasthan' },

  // Salumbar (new district)
  { name: 'Salumbar', district: 'Salumbar', state: 'Rajasthan' },
  { name: 'Lasadiya', district: 'Salumbar', state: 'Rajasthan' },
  { name: 'Semari', district: 'Salumbar', state: 'Rajasthan' },

  // Sawai Madhopur
  { name: 'Sawai Madhopur', district: 'Sawai Madhopur', state: 'Rajasthan' },
  { name: 'Gangapur City', district: 'Sawai Madhopur', state: 'Rajasthan' },
  { name: 'Bonli', district: 'Sawai Madhopur', state: 'Rajasthan' },
  { name: 'Bamanwas', district: 'Sawai Madhopur', state: 'Rajasthan' },

  // Sikar
  { name: 'Sikar', district: 'Sikar', state: 'Rajasthan' },
  { name: 'Fatehpur', district: 'Sikar', state: 'Rajasthan' },
  { name: 'Laxmangarh', district: 'Sikar', state: 'Rajasthan' },
  { name: 'Neem ka Thana', district: 'Sikar', state: 'Rajasthan' },
  { name: 'Sri Madhopur', district: 'Sikar', state: 'Rajasthan' },
  { name: 'Danta Ramgarh', district: 'Sikar', state: 'Rajasthan' },
  { name: 'Dhod', district: 'Sikar', state: 'Rajasthan' },
  { name: 'Ringas', district: 'Sikar', state: 'Rajasthan' },

  // Sirohi
  { name: 'Sirohi', district: 'Sirohi', state: 'Rajasthan' },
  { name: 'Abu Road', district: 'Sirohi', state: 'Rajasthan' },
  { name: 'Mount Abu', district: 'Sirohi', state: 'Rajasthan' },
  { name: 'Pindwara', district: 'Sirohi', state: 'Rajasthan' },
  { name: 'Sheoganj', district: 'Sirohi', state: 'Rajasthan' },
  { name: 'Reodar', district: 'Sirohi', state: 'Rajasthan' },

  // Tonk
  { name: 'Tonk', district: 'Tonk', state: 'Rajasthan' },
  { name: 'Uniara', district: 'Tonk', state: 'Rajasthan' },
  { name: 'Malpura', district: 'Tonk', state: 'Rajasthan' },
  { name: 'Deoli', district: 'Tonk', state: 'Rajasthan' },
  { name: 'Niwai', district: 'Tonk', state: 'Rajasthan' },
  { name: 'Peeplu', district: 'Tonk', state: 'Rajasthan' },

  // Udaipur
  { name: 'Udaipur', district: 'Udaipur', state: 'Rajasthan' },
  { name: 'Mavli', district: 'Udaipur', state: 'Rajasthan' },
  { name: 'Gogunda', district: 'Udaipur', state: 'Rajasthan' },
  { name: 'Girwa', district: 'Udaipur', state: 'Rajasthan' },
  { name: 'Salumber', district: 'Salumbar', state: 'Rajasthan' },
  { name: 'Kherwara', district: 'Udaipur', state: 'Rajasthan' },
  { name: 'Rishabhdeo', district: 'Udaipur', state: 'Rajasthan' },

  // ═══════════════════════════════════════════════════════════
  // PUNJAB — 23 districts
  // ═══════════════════════════════════════════════════════════

  { name: 'Ludhiana', district: 'Ludhiana', state: 'Punjab' },
  { name: 'Khanna', district: 'Ludhiana', state: 'Punjab' },
  { name: 'Jagraon', district: 'Ludhiana', state: 'Punjab' },
  { name: 'Samrala', district: 'Ludhiana', state: 'Punjab' },
  { name: 'Raikot', district: 'Ludhiana', state: 'Punjab' },
  { name: 'Payal', district: 'Ludhiana', state: 'Punjab' },
  { name: 'Doraha', district: 'Ludhiana', state: 'Punjab' },
  { name: 'Machhiwara', district: 'Ludhiana', state: 'Punjab' },

  { name: 'Amritsar', district: 'Amritsar', state: 'Punjab' },
  { name: 'Ajnala', district: 'Amritsar', state: 'Punjab' },
  { name: 'Ramdas', district: 'Amritsar', state: 'Punjab' },
  { name: 'Baba Bakala', district: 'Amritsar', state: 'Punjab' },

  { name: 'Tarn Taran', district: 'Tarn Taran', state: 'Punjab' },
  { name: 'Patti', district: 'Tarn Taran', state: 'Punjab' },
  { name: 'Khadur Sahib', district: 'Tarn Taran', state: 'Punjab' },

  { name: 'Jalandhar', district: 'Jalandhar', state: 'Punjab' },
  { name: 'Nakodar', district: 'Jalandhar', state: 'Punjab' },
  { name: 'Shahkot', district: 'Jalandhar', state: 'Punjab' },
  { name: 'Phillaur', district: 'Jalandhar', state: 'Punjab' },
  { name: 'Nurmahal', district: 'Jalandhar', state: 'Punjab' },
  { name: 'Lohian Khas', district: 'Jalandhar', state: 'Punjab' },

  { name: 'Patiala', district: 'Patiala', state: 'Punjab' },
  { name: 'Rajpura', district: 'Patiala', state: 'Punjab' },
  { name: 'Nabha', district: 'Patiala', state: 'Punjab' },
  { name: 'Samana', district: 'Patiala', state: 'Punjab' },

  { name: 'Fatehgarh Sahib', district: 'Fatehgarh Sahib', state: 'Punjab' },
  { name: 'Sirhind', district: 'Fatehgarh Sahib', state: 'Punjab' },
  { name: 'Amloh', district: 'Fatehgarh Sahib', state: 'Punjab' },

  { name: 'Bathinda', district: 'Bathinda', state: 'Punjab' },
  { name: 'Rampura Phul', district: 'Bathinda', state: 'Punjab' },
  { name: 'Talwandi Sabo', district: 'Bathinda', state: 'Punjab' },
  { name: 'Goniana', district: 'Bathinda', state: 'Punjab' },

  { name: 'Mansa', district: 'Mansa', state: 'Punjab' },
  { name: 'Sardulgarh', district: 'Mansa', state: 'Punjab' },
  { name: 'Budhlada', district: 'Mansa', state: 'Punjab' },

  { name: 'Mohali', district: 'SAS Nagar', state: 'Punjab' },
  { name: 'Zirakpur', district: 'SAS Nagar', state: 'Punjab' },
  { name: 'Kharar', district: 'SAS Nagar', state: 'Punjab' },
  { name: 'Derabassi', district: 'SAS Nagar', state: 'Punjab' },

  { name: 'Ropar', district: 'Rupnagar', state: 'Punjab' },
  { name: 'Morinda', district: 'Rupnagar', state: 'Punjab' },
  { name: 'Anandpur Sahib', district: 'Rupnagar', state: 'Punjab' },
  { name: 'Nangal', district: 'Rupnagar', state: 'Punjab' },

  { name: 'Hoshiarpur', district: 'Hoshiarpur', state: 'Punjab' },
  { name: 'Mukerian', district: 'Hoshiarpur', state: 'Punjab' },
  { name: 'Dasuya', district: 'Hoshiarpur', state: 'Punjab' },
  { name: 'Garhshankar', district: 'Hoshiarpur', state: 'Punjab' },
  { name: 'Tanda', district: 'Hoshiarpur', state: 'Punjab' },
  { name: 'Mahilpur', district: 'Hoshiarpur', state: 'Punjab' },

  { name: 'Nawanshahr', district: 'Shahid Bhagat Singh Nagar', state: 'Punjab' },
  { name: 'Balachaur', district: 'Shahid Bhagat Singh Nagar', state: 'Punjab' },
  { name: 'Banga', district: 'Shahid Bhagat Singh Nagar', state: 'Punjab' },

  { name: 'Gurdaspur', district: 'Gurdaspur', state: 'Punjab' },
  { name: 'Batala', district: 'Gurdaspur', state: 'Punjab' },
  { name: 'Dhariwal', district: 'Gurdaspur', state: 'Punjab' },
  { name: 'Qadian', district: 'Gurdaspur', state: 'Punjab' },
  { name: 'Dinanagar', district: 'Gurdaspur', state: 'Punjab' },
  { name: 'Dera Baba Nanak', district: 'Gurdaspur', state: 'Punjab' },

  { name: 'Pathankot', district: 'Pathankot', state: 'Punjab' },
  { name: 'Sujanpur', district: 'Pathankot', state: 'Punjab' },

  { name: 'Kapurthala', district: 'Kapurthala', state: 'Punjab' },
  { name: 'Phagwara', district: 'Kapurthala', state: 'Punjab' },
  { name: 'Sultanpur Lodhi', district: 'Kapurthala', state: 'Punjab' },

  { name: 'Moga', district: 'Moga', state: 'Punjab' },
  { name: 'Baghapurana', district: 'Moga', state: 'Punjab' },
  { name: 'Nihal Singh Wala', district: 'Moga', state: 'Punjab' },
  { name: 'Dharamkot', district: 'Moga', state: 'Punjab' },

  { name: 'Firozpur', district: 'Firozpur', state: 'Punjab' },
  { name: 'Zira', district: 'Firozpur', state: 'Punjab' },
  { name: 'Guru Har Sahai', district: 'Firozpur', state: 'Punjab' },

  { name: 'Fazilka', district: 'Fazilka', state: 'Punjab' },
  { name: 'Abohar', district: 'Fazilka', state: 'Punjab' },
  { name: 'Jalalabad', district: 'Fazilka', state: 'Punjab' },

  { name: 'Sangrur', district: 'Sangrur', state: 'Punjab' },
  { name: 'Sunam', district: 'Sangrur', state: 'Punjab' },
  { name: 'Dhuri', district: 'Sangrur', state: 'Punjab' },
  { name: 'Lehra Gaga', district: 'Sangrur', state: 'Punjab' },
  { name: 'Moonak', district: 'Sangrur', state: 'Punjab' },
  { name: 'Longowal', district: 'Sangrur', state: 'Punjab' },

  { name: 'Malerkotla', district: 'Malerkotla', state: 'Punjab' },

  { name: 'Barnala', district: 'Barnala', state: 'Punjab' },

  { name: 'Faridkot', district: 'Faridkot', state: 'Punjab' },
  { name: 'Jaitu', district: 'Faridkot', state: 'Punjab' },
  { name: 'Kotkapura', district: 'Faridkot', state: 'Punjab' },

  { name: 'Muktsar', district: 'Sri Muktsar Sahib', state: 'Punjab' },
  { name: 'Giddarbaha', district: 'Sri Muktsar Sahib', state: 'Punjab' },
  { name: 'Malout', district: 'Sri Muktsar Sahib', state: 'Punjab' },

  // ═══════════════════════════════════════════════════════════
  // HARYANA — 22 districts
  // ═══════════════════════════════════════════════════════════

  { name: 'Ambala', district: 'Ambala', state: 'Haryana' },
  { name: 'Ambala City', district: 'Ambala', state: 'Haryana' },
  { name: 'Barara', district: 'Ambala', state: 'Haryana' },
  { name: 'Naraingarh', district: 'Ambala', state: 'Haryana' },
  { name: 'Saha', district: 'Ambala', state: 'Haryana' },
  { name: 'Mullana', district: 'Ambala', state: 'Haryana' },

  { name: 'Panchkula', district: 'Panchkula', state: 'Haryana' },
  { name: 'Kalka', district: 'Panchkula', state: 'Haryana' },
  { name: 'Morni', district: 'Panchkula', state: 'Haryana' },
  { name: 'Raipur Rani', district: 'Panchkula', state: 'Haryana' },

  { name: 'Yamunanagar', district: 'Yamunanagar', state: 'Haryana' },
  { name: 'Jagadhri', district: 'Yamunanagar', state: 'Haryana' },
  { name: 'Sadhaura', district: 'Yamunanagar', state: 'Haryana' },
  { name: 'Bilaspur', district: 'Yamunanagar', state: 'Haryana' },
  { name: 'Chhachhrauli', district: 'Yamunanagar', state: 'Haryana' },

  { name: 'Kurukshetra', district: 'Kurukshetra', state: 'Haryana' },
  { name: 'Thanesar', district: 'Kurukshetra', state: 'Haryana' },
  { name: 'Pehowa', district: 'Kurukshetra', state: 'Haryana' },
  { name: 'Shahabad', district: 'Kurukshetra', state: 'Haryana' },
  { name: 'Ladwa', district: 'Kurukshetra', state: 'Haryana' },
  { name: 'Ismailabad', district: 'Kurukshetra', state: 'Haryana' },

  { name: 'Kaithal', district: 'Kaithal', state: 'Haryana' },
  { name: 'Cheeka', district: 'Kaithal', state: 'Haryana' },
  { name: 'Pundri', district: 'Kaithal', state: 'Haryana' },
  { name: 'Guhla', district: 'Kaithal', state: 'Haryana' },
  { name: 'Siwan', district: 'Kaithal', state: 'Haryana' },

  { name: 'Karnal', district: 'Karnal', state: 'Haryana' },
  { name: 'Panipat', district: 'Panipat', state: 'Haryana' },
  { name: 'Samalkha', district: 'Panipat', state: 'Haryana' },
  { name: 'Israna', district: 'Panipat', state: 'Haryana' },
  { name: 'Madlauda', district: 'Panipat', state: 'Haryana' },

  { name: 'Nilokheri', district: 'Karnal', state: 'Haryana' },
  { name: 'Gharaunda', district: 'Karnal', state: 'Haryana' },
  { name: 'Assandh', district: 'Karnal', state: 'Haryana' },
  { name: 'Indri', district: 'Karnal', state: 'Haryana' },

  { name: 'Sonipat', district: 'Sonipat', state: 'Haryana' },
  { name: 'Gohana', district: 'Sonipat', state: 'Haryana' },
  { name: 'Kharkhoda', district: 'Sonipat', state: 'Haryana' },
  { name: 'Gannaur', district: 'Sonipat', state: 'Haryana' },
  { name: 'Rai', district: 'Sonipat', state: 'Haryana' },

  { name: 'Rohtak', district: 'Rohtak', state: 'Haryana' },
  { name: 'Maham', district: 'Rohtak', state: 'Haryana' },
  { name: 'Sampla', district: 'Rohtak', state: 'Haryana' },
  { name: 'Asthal Bohar', district: 'Rohtak', state: 'Haryana' },
  { name: 'Kalanaur', district: 'Rohtak', state: 'Haryana' },

  { name: 'Jhajjar', district: 'Jhajjar', state: 'Haryana' },
  { name: 'Bahadurgarh', district: 'Jhajjar', state: 'Haryana' },
  { name: 'Beri', district: 'Jhajjar', state: 'Haryana' },
  { name: 'Machhrauli', district: 'Jhajjar', state: 'Haryana' },
  { name: 'Dighal', district: 'Jhajjar', state: 'Haryana' },

  { name: 'Faridabad', district: 'Faridabad', state: 'Haryana' },
  { name: 'Ballabhgarh', district: 'Faridabad', state: 'Haryana' },
  { name: 'Palwal', district: 'Palwal', state: 'Haryana' },
  { name: 'Hathin', district: 'Palwal', state: 'Haryana' },
  { name: 'Hodal', district: 'Palwal', state: 'Haryana' },

  { name: 'Gurugram', district: 'Gurugram', state: 'Haryana' },
  { name: 'Manesar', district: 'Gurugram', state: 'Haryana' },
  { name: 'Sohna', district: 'Gurugram', state: 'Haryana' },
  { name: 'Pataudi', district: 'Gurugram', state: 'Haryana' },
  { name: 'Farukhnagar', district: 'Gurugram', state: 'Haryana' },

  { name: 'Nuh', district: 'Nuh', state: 'Haryana' },
  { name: 'Firozpur Jhirka', district: 'Nuh', state: 'Haryana' },
  { name: 'Tauru', district: 'Nuh', state: 'Haryana' },
  { name: 'Nagina', district: 'Nuh', state: 'Haryana' },

  { name: 'Rewari', district: 'Rewari', state: 'Haryana' },
  { name: 'Bawal', district: 'Rewari', state: 'Haryana' },
  { name: 'Dharuhera', district: 'Rewari', state: 'Haryana' },
  { name: 'Kosli', district: 'Rewari', state: 'Haryana' },

  { name: 'Mahendragarh', district: 'Mahendragarh', state: 'Haryana' },
  { name: 'Narnaul', district: 'Mahendragarh', state: 'Haryana' },
  { name: 'Ateli', district: 'Mahendragarh', state: 'Haryana' },
  { name: 'Nangal Chaudhry', district: 'Mahendragarh', state: 'Haryana' },

  { name: 'Bhiwani', district: 'Bhiwani', state: 'Haryana' },
  { name: 'Loharu', district: 'Bhiwani', state: 'Haryana' },
  { name: 'Tosham', district: 'Bhiwani', state: 'Haryana' },
  { name: 'Siwani', district: 'Bhiwani', state: 'Haryana' },
  { name: 'Bahal', district: 'Bhiwani', state: 'Haryana' },

  { name: 'Charkhi Dadri', district: 'Charkhi Dadri', state: 'Haryana' },
  { name: 'Badhra', district: 'Charkhi Dadri', state: 'Haryana' },
  { name: 'Bond Kalan', district: 'Charkhi Dadri', state: 'Haryana' },

  { name: 'Hisar', district: 'Hisar', state: 'Haryana' },
  { name: 'Hansi', district: 'Hansi', state: 'Haryana' },
  { name: 'Barwala', district: 'Hisar', state: 'Haryana' },
  { name: 'Narnaund', district: 'Hansi', state: 'Haryana' },
  { name: 'Uklana', district: 'Hisar', state: 'Haryana' },

  { name: 'Fatehabad', district: 'Fatehabad', state: 'Haryana' },
  { name: 'Tohana', district: 'Fatehabad', state: 'Haryana' },
  { name: 'Ratia', district: 'Fatehabad', state: 'Haryana' },
  { name: 'Bhuna', district: 'Fatehabad', state: 'Haryana' },

  { name: 'Sirsa', district: 'Sirsa', state: 'Haryana' },
  { name: 'Dabwali', district: 'Sirsa', state: 'Haryana' },
  { name: 'Ellenabad', district: 'Sirsa', state: 'Haryana' },
  { name: 'Rania', district: 'Sirsa', state: 'Haryana' },
  { name: 'Kalanwali', district: 'Sirsa', state: 'Haryana' },

  { name: 'Jind', district: 'Jind', state: 'Haryana' },
  { name: 'Narwana', district: 'Jind', state: 'Haryana' },
  { name: 'Safidon', district: 'Jind', state: 'Haryana' },
  { name: 'Julana', district: 'Jind', state: 'Haryana' },
  { name: 'Uchana', district: 'Jind', state: 'Haryana' },

  // ═══════════════════════════════════════════════════════════
  // GUJARAT — 33 districts
  // ═══════════════════════════════════════════════════════════

  { name: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat' },
  { name: 'Sanand', district: 'Ahmedabad', state: 'Gujarat' },
  { name: 'Dholka', district: 'Ahmedabad', state: 'Gujarat' },
  { name: 'Dhandhuka', district: 'Ahmedabad', state: 'Gujarat' },
  { name: 'Bavla', district: 'Ahmedabad', state: 'Gujarat' },
  { name: 'Viramgam', district: 'Ahmedabad', state: 'Gujarat' },
  { name: 'Detroj', district: 'Ahmedabad', state: 'Gujarat' },

  { name: 'Gandhinagar', district: 'Gandhinagar', state: 'Gujarat' },
  { name: 'Kalol', district: 'Gandhinagar', state: 'Gujarat' },
  { name: 'Dehgam', district: 'Gandhinagar', state: 'Gujarat' },
  { name: 'Mansa', district: 'Gandhinagar', state: 'Gujarat' },

  { name: 'Surat', district: 'Surat', state: 'Gujarat' },
  { name: 'Bardoli', district: 'Surat', state: 'Gujarat' },
  { name: 'Mandvi', district: 'Surat', state: 'Gujarat' },
  { name: 'Olpad', district: 'Surat', state: 'Gujarat' },
  { name: 'Mangrol', district: 'Surat', state: 'Gujarat' },
  { name: 'Vyara', district: 'Tapi', state: 'Gujarat' },

  { name: 'Vadodara', district: 'Vadodara', state: 'Gujarat' },
  { name: 'Padra', district: 'Vadodara', state: 'Gujarat' },
  { name: 'Karjan', district: 'Vadodara', state: 'Gujarat' },
  { name: 'Sinor', district: 'Vadodara', state: 'Gujarat' },
  { name: 'Savli', district: 'Vadodara', state: 'Gujarat' },
  { name: 'Waghodia', district: 'Vadodara', state: 'Gujarat' },
  { name: 'Dabhoi', district: 'Vadodara', state: 'Gujarat' },

  { name: 'Rajkot', district: 'Rajkot', state: 'Gujarat' },
  { name: 'Gondal', district: 'Rajkot', state: 'Gujarat' },
  { name: 'Jetpur', district: 'Rajkot', state: 'Gujarat' },
  { name: 'Wankaner', district: 'Rajkot', state: 'Gujarat' },
  { name: 'Morbi', district: 'Morbi', state: 'Gujarat' },
  { name: 'Maliya Miyana', district: 'Morbi', state: 'Gujarat' },
  { name: 'Tankara', district: 'Morbi', state: 'Gujarat' },

  { name: 'Jamnagar', district: 'Jamnagar', state: 'Gujarat' },
  { name: 'Dwarka', district: 'Devbhumi Dwarka', state: 'Gujarat' },
  { name: 'Khambhalia', district: 'Devbhumi Dwarka', state: 'Gujarat' },
  { name: 'Kalyanpur', district: 'Devbhumi Dwarka', state: 'Gujarat' },
  { name: 'Lalpur', district: 'Jamnagar', state: 'Gujarat' },
  { name: 'Dhrol', district: 'Jamnagar', state: 'Gujarat' },
  { name: 'Kalavad', district: 'Jamnagar', state: 'Gujarat' },

  { name: 'Junagadh', district: 'Junagadh', state: 'Gujarat' },
  { name: 'Veraval', district: 'Gir Somnath', state: 'Gujarat' },
  { name: 'Somnath', district: 'Gir Somnath', state: 'Gujarat' },
  { name: 'Talala', district: 'Gir Somnath', state: 'Gujarat' },
  { name: 'Kodinar', district: 'Gir Somnath', state: 'Gujarat' },
  { name: 'Una', district: 'Gir Somnath', state: 'Gujarat' },
  { name: 'Keshod', district: 'Junagadh', state: 'Gujarat' },
  { name: 'Visavadar', district: 'Junagadh', state: 'Gujarat' },
  { name: 'Mangrol', district: 'Junagadh', state: 'Gujarat' },

  { name: 'Porbandar', district: 'Porbandar', state: 'Gujarat' },
  { name: 'Ranavav', district: 'Porbandar', state: 'Gujarat' },
  { name: 'Kutiyana', district: 'Porbandar', state: 'Gujarat' },

  { name: 'Amreli', district: 'Amreli', state: 'Gujarat' },
  { name: 'Savarkundla', district: 'Amreli', state: 'Gujarat' },
  { name: 'Rajula', district: 'Amreli', state: 'Gujarat' },
  { name: 'Lathi', district: 'Amreli', state: 'Gujarat' },
  { name: 'Jafrabad', district: 'Amreli', state: 'Gujarat' },
  { name: 'Dhari', district: 'Amreli', state: 'Gujarat' },
  { name: 'Babra', district: 'Amreli', state: 'Gujarat' },

  { name: 'Bhavnagar', district: 'Bhavnagar', state: 'Gujarat' },
  { name: 'Sihor', district: 'Bhavnagar', state: 'Gujarat' },
  { name: 'Botad', district: 'Botad', state: 'Gujarat' },
  { name: 'Gadhada', district: 'Botad', state: 'Gujarat' },
  { name: 'Gariadhar', district: 'Bhavnagar', state: 'Gujarat' },
  { name: 'Mahuva', district: 'Bhavnagar', state: 'Gujarat' },
  { name: 'Talaja', district: 'Bhavnagar', state: 'Gujarat' },

  { name: 'Surendranagar', district: 'Surendranagar', state: 'Gujarat' },
  { name: 'Wadhwan', district: 'Surendranagar', state: 'Gujarat' },
  { name: 'Limbdi', district: 'Surendranagar', state: 'Gujarat' },
  { name: 'Dhrangadhra', district: 'Surendranagar', state: 'Gujarat' },
  { name: 'Chotila', district: 'Surendranagar', state: 'Gujarat' },
  { name: 'Dasada', district: 'Surendranagar', state: 'Gujarat' },

  { name: 'Kutch', district: 'Kachchh', state: 'Gujarat' },
  { name: 'Bhuj', district: 'Kachchh', state: 'Gujarat' },
  { name: 'Gandhidham', district: 'Kachchh', state: 'Gujarat' },
  { name: 'Adipur', district: 'Kachchh', state: 'Gujarat' },
  { name: 'Anjar', district: 'Kachchh', state: 'Gujarat' },
  { name: 'Mundra', district: 'Kachchh', state: 'Gujarat' },
  { name: 'Mandvi', district: 'Kachchh', state: 'Gujarat' },
  { name: 'Rapar', district: 'Kachchh', state: 'Gujarat' },

  { name: 'Mehsana', district: 'Mahesana', state: 'Gujarat' },
  { name: 'Visnagar', district: 'Mahesana', state: 'Gujarat' },
  { name: 'Unjha', district: 'Mahesana', state: 'Gujarat' },
  { name: 'Kadi', district: 'Mahesana', state: 'Gujarat' },
  { name: 'Becharaji', district: 'Mahesana', state: 'Gujarat' },
  { name: 'Vadnagar', district: 'Mahesana', state: 'Gujarat' },

  { name: 'Patan', district: 'Patan', state: 'Gujarat' },
  { name: 'Radhanpur', district: 'Patan', state: 'Gujarat' },
  { name: 'Sami', district: 'Patan', state: 'Gujarat' },
  { name: 'Chanasma', district: 'Patan', state: 'Gujarat' },
  { name: 'Harij', district: 'Patan', state: 'Gujarat' },

  { name: 'Banaskantha', district: 'Banaskantha', state: 'Gujarat' },
  { name: 'Palanpur', district: 'Banaskantha', state: 'Gujarat' },
  { name: 'Deesa', district: 'Banaskantha', state: 'Gujarat' },
  { name: 'Dhanera', district: 'Vav-Tharad', state: 'Gujarat' },
  { name: 'Tharad', district: 'Vav-Tharad', state: 'Gujarat' },
  { name: 'Vav', district: 'Vav-Tharad', state: 'Gujarat' },
  { name: 'Danta', district: 'Banaskantha', state: 'Gujarat' },
  { name: 'Wadgam', district: 'Banaskantha', state: 'Gujarat' },

  { name: 'Sabarkantha', district: 'Sabarkantha', state: 'Gujarat' },
  { name: 'Himmatnagar', district: 'Sabarkantha', state: 'Gujarat' },
  { name: 'Idar', district: 'Sabarkantha', state: 'Gujarat' },
  { name: 'Talod', district: 'Sabarkantha', state: 'Gujarat' },
  { name: 'Khedbrahma', district: 'Sabarkantha', state: 'Gujarat' },

  { name: 'Aravalli', district: 'Aravalli', state: 'Gujarat' },
  { name: 'Modasa', district: 'Aravalli', state: 'Gujarat' },
  { name: 'Bayad', district: 'Aravalli', state: 'Gujarat' },
  { name: 'Malpur', district: 'Aravalli', state: 'Gujarat' },

  { name: 'Anand', district: 'Anand', state: 'Gujarat' },
  { name: 'Vallabh Vidyanagar', district: 'Anand', state: 'Gujarat' },
  { name: 'Anklav', district: 'Anand', state: 'Gujarat' },
  { name: 'Borsad', district: 'Anand', state: 'Gujarat' },
  { name: 'Khambhat', district: 'Anand', state: 'Gujarat' },
  { name: 'Umreth', district: 'Anand', state: 'Gujarat' },
  { name: 'Petlad', district: 'Anand', state: 'Gujarat' },

  { name: 'Kheda', district: 'Kheda', state: 'Gujarat' },
  { name: 'Nadiad', district: 'Kheda', state: 'Gujarat' },
  { name: 'Matar', district: 'Kheda', state: 'Gujarat' },
  { name: 'Mahudha', district: 'Kheda', state: 'Gujarat' },
  { name: 'Kapadvanj', district: 'Kheda', state: 'Gujarat' },
  { name: 'Thasra', district: 'Kheda', state: 'Gujarat' },

  { name: 'Mahisagar', district: 'Mahisagar', state: 'Gujarat' },
  { name: 'Lunawada', district: 'Mahisagar', state: 'Gujarat' },
  { name: 'Santrampur', district: 'Mahisagar', state: 'Gujarat' },
  { name: 'Kadana', district: 'Mahisagar', state: 'Gujarat' },

  { name: 'Panchmahal', district: 'Panchmahals', state: 'Gujarat' },
  { name: 'Godhra', district: 'Panchmahals', state: 'Gujarat' },
  { name: 'Lunawada', district: 'Panchmahals', state: 'Gujarat' },
  { name: 'Halol', district: 'Panchmahals', state: 'Gujarat' },
  { name: 'Kalol', district: 'Panchmahals', state: 'Gujarat' },
  { name: 'Shehera', district: 'Panchmahals', state: 'Gujarat' },

  { name: 'Dahod', district: 'Dahod', state: 'Gujarat' },
  { name: 'Limkheda', district: 'Dahod', state: 'Gujarat' },
  { name: 'Garbada', district: 'Dahod', state: 'Gujarat' },
  { name: 'Devgadh Baria', district: 'Dahod', state: 'Gujarat' },

  { name: 'Chhota Udaipur', district: 'Chhota Udepur', state: 'Gujarat' },
  { name: 'Kavant', district: 'Chhota Udepur', state: 'Gujarat' },
  { name: 'Sankheda', district: 'Chhota Udepur', state: 'Gujarat' },

  { name: 'Bharuch', district: 'Bharuch', state: 'Gujarat' },
  { name: 'Ankleshwar', district: 'Bharuch', state: 'Gujarat' },
  { name: 'Jambusar', district: 'Bharuch', state: 'Gujarat' },
  { name: 'Amod', district: 'Bharuch', state: 'Gujarat' },
  { name: 'Vagra', district: 'Bharuch', state: 'Gujarat' },

  { name: 'Narmada', district: 'Narmada', state: 'Gujarat' },
  { name: 'Rajpipla', district: 'Narmada', state: 'Gujarat' },
  { name: 'Garudeshwar', district: 'Narmada', state: 'Gujarat' },
  { name: 'Tilakwada', district: 'Narmada', state: 'Gujarat' },

  { name: 'Tapi', district: 'Tapi', state: 'Gujarat' },
  { name: 'Songadh', district: 'Tapi', state: 'Gujarat' },
  { name: 'Nizar', district: 'Tapi', state: 'Gujarat' },

  { name: 'Navsari', district: 'Navsari', state: 'Gujarat' },
  { name: 'Gandevi', district: 'Navsari', state: 'Gujarat' },
  { name: 'Chikhli', district: 'Navsari', state: 'Gujarat' },
  { name: 'Jalalpore', district: 'Navsari', state: 'Gujarat' },

  { name: 'Valsad', district: 'Valsad', state: 'Gujarat' },
  { name: 'Vapi', district: 'Valsad', state: 'Gujarat' },
  { name: 'Bilimora', district: 'Valsad', state: 'Gujarat' },
  { name: 'Pardi', district: 'Valsad', state: 'Gujarat' },
  { name: 'Umbergaon', district: 'Valsad', state: 'Gujarat' },

  { name: 'Dang', district: 'Dangs', state: 'Gujarat' },
  { name: 'Ahwa', district: 'Dangs', state: 'Gujarat' },

  // ═══════════════════════════════════════════════════════════
  // MAHARASHTRA — 36 districts (official names as per IGOD 2026)
  // Note: Ahilyanagar = official new name for Ahmednagar
  //       Chhatrapati Sambhajinagar = official new name for Aurangabad
  //       Dharashiv = official new name for Osmanabad
  // ═══════════════════════════════════════════════════════════

  { name: 'Mumbai', district: 'Mumbai', state: 'Maharashtra' },
  { name: 'Colaba', district: 'Mumbai', state: 'Maharashtra' },
  { name: 'Fort', district: 'Mumbai', state: 'Maharashtra' },
  { name: 'Kurla', district: 'Mumbai Suburban', state: 'Maharashtra' },
  { name: 'Andheri', district: 'Mumbai Suburban', state: 'Maharashtra' },
  { name: 'Borivali', district: 'Mumbai Suburban', state: 'Maharashtra' },
  { name: 'Bandra', district: 'Mumbai Suburban', state: 'Maharashtra' },
  { name: 'Malad', district: 'Mumbai Suburban', state: 'Maharashtra' },
  { name: 'Kandivali', district: 'Mumbai Suburban', state: 'Maharashtra' },
  { name: 'Goregaon', district: 'Mumbai Suburban', state: 'Maharashtra' },
  { name: 'Vile Parle', district: 'Mumbai Suburban', state: 'Maharashtra' },
  { name: 'Jogeshwari', district: 'Mumbai Suburban', state: 'Maharashtra' },

  { name: 'Thane', district: 'Thane', state: 'Maharashtra' },
  { name: 'Navi Mumbai', district: 'Thane', state: 'Maharashtra' },
  { name: 'Kalyan', district: 'Thane', state: 'Maharashtra' },
  { name: 'Dombivli', district: 'Thane', state: 'Maharashtra' },
  { name: 'Ulhasnagar', district: 'Thane', state: 'Maharashtra' },
  { name: 'Bhiwandi', district: 'Thane', state: 'Maharashtra' },
  { name: 'Mira Road', district: 'Thane', state: 'Maharashtra' },
  { name: 'Vasai', district: 'Palghar', state: 'Maharashtra' },
  { name: 'Virar', district: 'Palghar', state: 'Maharashtra' },
  { name: 'Ambernath', district: 'Thane', state: 'Maharashtra' },
  { name: 'Badlapur', district: 'Thane', state: 'Maharashtra' },
  { name: 'Shahpur', district: 'Thane', state: 'Maharashtra' },

  { name: 'Palghar', district: 'Palghar', state: 'Maharashtra' },
  { name: 'Boisar', district: 'Palghar', state: 'Maharashtra' },
  { name: 'Dahanu', district: 'Palghar', state: 'Maharashtra' },
  { name: 'Talasari', district: 'Palghar', state: 'Maharashtra' },
  { name: 'Jawhar', district: 'Palghar', state: 'Maharashtra' },
  { name: 'Wada', district: 'Palghar', state: 'Maharashtra' },

  { name: 'Raigad', district: 'Raigad', state: 'Maharashtra' },
  { name: 'Alibag', district: 'Raigad', state: 'Maharashtra' },
  { name: 'Panvel', district: 'Raigad', state: 'Maharashtra' },
  { name: 'Pen', district: 'Raigad', state: 'Maharashtra' },
  { name: 'Khopoli', district: 'Raigad', state: 'Maharashtra' },
  { name: 'Mahad', district: 'Raigad', state: 'Maharashtra' },
  { name: 'Uran', district: 'Raigad', state: 'Maharashtra' },

  { name: 'Pune', district: 'Pune', state: 'Maharashtra' },
  { name: 'Pimpri-Chinchwad', district: 'Pune', state: 'Maharashtra' },
  { name: 'Baramati', district: 'Pune', state: 'Maharashtra' },
  { name: 'Shirur', district: 'Pune', state: 'Maharashtra' },
  { name: 'Bhor', district: 'Pune', state: 'Maharashtra' },
  { name: 'Maval', district: 'Pune', state: 'Maharashtra' },
  { name: 'Indapur', district: 'Pune', state: 'Maharashtra' },
  { name: 'Talegaon Dabhade', district: 'Pune', state: 'Maharashtra' },
  { name: 'Jejuri', district: 'Pune', state: 'Maharashtra' },
  { name: 'Velhe', district: 'Pune', state: 'Maharashtra' },

  { name: 'Satara', district: 'Satara', state: 'Maharashtra' },
  { name: 'Karad', district: 'Satara', state: 'Maharashtra' },
  { name: 'Wai', district: 'Satara', state: 'Maharashtra' },
  { name: 'Phaltan', district: 'Satara', state: 'Maharashtra' },
  { name: 'Mahabaleshwar', district: 'Satara', state: 'Maharashtra' },
  { name: 'Khandala', district: 'Satara', state: 'Maharashtra' },

  { name: 'Ratnagiri', district: 'Ratnagiri', state: 'Maharashtra' },
  { name: 'Chiplun', district: 'Ratnagiri', state: 'Maharashtra' },
  { name: 'Khed', district: 'Ratnagiri', state: 'Maharashtra' },
  { name: 'Guhagar', district: 'Ratnagiri', state: 'Maharashtra' },
  { name: 'Dapoli', district: 'Ratnagiri', state: 'Maharashtra' },
  { name: 'Mandangad', district: 'Ratnagiri', state: 'Maharashtra' },

  { name: 'Sindhudurg', district: 'Sindhudurg', state: 'Maharashtra' },
  { name: 'Kudal', district: 'Sindhudurg', state: 'Maharashtra' },
  { name: 'Sawantwadi', district: 'Sindhudurg', state: 'Maharashtra' },
  { name: 'Malvan', district: 'Sindhudurg', state: 'Maharashtra' },
  { name: 'Vengurla', district: 'Sindhudurg', state: 'Maharashtra' },

  { name: 'Kolhapur', district: 'Kolhapur', state: 'Maharashtra' },
  { name: 'Ichalkaranji', district: 'Kolhapur', state: 'Maharashtra' },
  { name: 'Hatkanangale', district: 'Kolhapur', state: 'Maharashtra' },
  { name: 'Karvir', district: 'Kolhapur', state: 'Maharashtra' },
  { name: 'Gadhinglaj', district: 'Kolhapur', state: 'Maharashtra' },
  { name: 'Panhala', district: 'Kolhapur', state: 'Maharashtra' },

  { name: 'Sangli', district: 'Sangli', state: 'Maharashtra' },
  { name: 'Miraj', district: 'Sangli', state: 'Maharashtra' },
  { name: 'Kupwad', district: 'Sangli', state: 'Maharashtra' },
  { name: 'Islampur', district: 'Sangli', state: 'Maharashtra' },
  { name: 'Tasgaon', district: 'Sangli', state: 'Maharashtra' },
  { name: 'Khanapur', district: 'Sangli', state: 'Maharashtra' },

  { name: 'Solapur', district: 'Solapur', state: 'Maharashtra' },
  { name: 'Pandharpur', district: 'Solapur', state: 'Maharashtra' },
  { name: 'Barshi', district: 'Solapur', state: 'Maharashtra' },
  { name: 'Akkalkot', district: 'Solapur', state: 'Maharashtra' },
  { name: 'Mangalvedha', district: 'Solapur', state: 'Maharashtra' },
  { name: 'Karmala', district: 'Solapur', state: 'Maharashtra' },
  { name: 'Mohol', district: 'Solapur', state: 'Maharashtra' },

  { name: 'Ahmednagar', district: 'Ahilyanagar', state: 'Maharashtra' },
  { name: 'Sangamner', district: 'Ahilyanagar', state: 'Maharashtra' },
  { name: 'Shrirampur', district: 'Ahilyanagar', state: 'Maharashtra' },
  { name: 'Kopargaon', district: 'Ahilyanagar', state: 'Maharashtra' },
  { name: 'Shevgaon', district: 'Ahilyanagar', state: 'Maharashtra' },
  { name: 'Rahata', district: 'Ahilyanagar', state: 'Maharashtra' },
  { name: 'Rahuri', district: 'Ahilyanagar', state: 'Maharashtra' },
  { name: 'Nevasa', district: 'Ahilyanagar', state: 'Maharashtra' },
  { name: 'Parner', district: 'Ahilyanagar', state: 'Maharashtra' },

  { name: 'Nashik', district: 'Nashik', state: 'Maharashtra' },
  { name: 'Malegaon', district: 'Nashik', state: 'Maharashtra' },
  { name: 'Niphad', district: 'Nashik', state: 'Maharashtra' },
  { name: 'Igatpuri', district: 'Nashik', state: 'Maharashtra' },
  { name: 'Dindori', district: 'Nashik', state: 'Maharashtra' },
  { name: 'Sinnar', district: 'Nashik', state: 'Maharashtra' },
  { name: 'Yeola', district: 'Nashik', state: 'Maharashtra' },
  { name: 'Kalwan', district: 'Nashik', state: 'Maharashtra' },
  { name: 'Deola', district: 'Nashik', state: 'Maharashtra' },

  { name: 'Dhule', district: 'Dhule', state: 'Maharashtra' },
  { name: 'Shirpur', district: 'Dhule', state: 'Maharashtra' },
  { name: 'Shindkheda', district: 'Dhule', state: 'Maharashtra' },
  { name: 'Sakri', district: 'Dhule', state: 'Maharashtra' },

  { name: 'Nandurbar', district: 'Nandurbar', state: 'Maharashtra' },
  { name: 'Shahada', district: 'Nandurbar', state: 'Maharashtra' },
  { name: 'Navapur', district: 'Nandurbar', state: 'Maharashtra' },
  { name: 'Taloda', district: 'Nandurbar', state: 'Maharashtra' },
  { name: 'Akkalkuwa', district: 'Nandurbar', state: 'Maharashtra' },

  { name: 'Jalgaon', district: 'Jalgaon', state: 'Maharashtra' },
  { name: 'Bhusawal', district: 'Jalgaon', state: 'Maharashtra' },
  { name: 'Pachora', district: 'Jalgaon', state: 'Maharashtra' },
  { name: 'Amalner', district: 'Jalgaon', state: 'Maharashtra' },
  { name: 'Chopda', district: 'Jalgaon', state: 'Maharashtra' },
  { name: 'Yawal', district: 'Jalgaon', state: 'Maharashtra' },
  { name: 'Jamner', district: 'Jalgaon', state: 'Maharashtra' },
  { name: 'Erandol', district: 'Jalgaon', state: 'Maharashtra' },

  { name: 'Aurangabad', district: 'Chhatrapati Sambhajinagar', state: 'Maharashtra' },
  { name: 'Gangapur', district: 'Chhatrapati Sambhajinagar', state: 'Maharashtra' },
  { name: 'Kannad', district: 'Chhatrapati Sambhajinagar', state: 'Maharashtra' },
  { name: 'Soegaon', district: 'Chhatrapati Sambhajinagar', state: 'Maharashtra' },
  { name: 'Khultabad', district: 'Chhatrapati Sambhajinagar', state: 'Maharashtra' },
  { name: 'Paithan', district: 'Chhatrapati Sambhajinagar', state: 'Maharashtra' },
  { name: 'Vaijapur', district: 'Chhatrapati Sambhajinagar', state: 'Maharashtra' },

  { name: 'Jalna', district: 'Jalna', state: 'Maharashtra' },
  { name: 'Ambad', district: 'Jalna', state: 'Maharashtra' },
  { name: 'Partur', district: 'Jalna', state: 'Maharashtra' },
  { name: 'Bhokardan', district: 'Jalna', state: 'Maharashtra' },
  { name: 'Badnapur', district: 'Jalna', state: 'Maharashtra' },

  { name: 'Beed', district: 'Beed', state: 'Maharashtra' },
  { name: 'Ahmadpur', district: 'Beed', state: 'Maharashtra' },
  { name: 'Ambejogai', district: 'Beed', state: 'Maharashtra' },
  { name: 'Parli', district: 'Beed', state: 'Maharashtra' },
  { name: 'Georai', district: 'Beed', state: 'Maharashtra' },
  { name: 'Majalgaon', district: 'Beed', state: 'Maharashtra' },
  { name: 'Kaij', district: 'Beed', state: 'Maharashtra' },

  { name: 'Latur', district: 'Latur', state: 'Maharashtra' },
  { name: 'Udgir', district: 'Latur', state: 'Maharashtra' },
  { name: 'Nilanga', district: 'Latur', state: 'Maharashtra' },
  { name: 'Ausa', district: 'Latur', state: 'Maharashtra' },
  { name: 'Ahmedpur', district: 'Latur', state: 'Maharashtra' },
  { name: 'Chakur', district: 'Latur', state: 'Maharashtra' },

  { name: 'Osmanabad', district: 'Dharashiv', state: 'Maharashtra' },
  { name: 'Tuljapur', district: 'Dharashiv', state: 'Maharashtra' },
  { name: 'Paranda', district: 'Dharashiv', state: 'Maharashtra' },
  { name: 'Umarga', district: 'Dharashiv', state: 'Maharashtra' },
  { name: 'Kalamb', district: 'Dharashiv', state: 'Maharashtra' },

  { name: 'Nanded', district: 'Nanded', state: 'Maharashtra' },
  { name: 'Deglur', district: 'Nanded', state: 'Maharashtra' },
  { name: 'Biloli', district: 'Nanded', state: 'Maharashtra' },
  { name: 'Kinwat', district: 'Nanded', state: 'Maharashtra' },
  { name: 'Bhokar', district: 'Nanded', state: 'Maharashtra' },
  { name: 'Mudkhed', district: 'Nanded', state: 'Maharashtra' },
  { name: 'Hadgaon', district: 'Nanded', state: 'Maharashtra' },
  { name: 'Ardhapur', district: 'Nanded', state: 'Maharashtra' },

  { name: 'Hingoli', district: 'Hingoli', state: 'Maharashtra' },
  { name: 'Basmath', district: 'Hingoli', state: 'Maharashtra' },
  { name: 'Sengaon', district: 'Hingoli', state: 'Maharashtra' },
  { name: 'Kalamnuri', district: 'Hingoli', state: 'Maharashtra' },

  { name: 'Parbhani', district: 'Parbhani', state: 'Maharashtra' },
  { name: 'Pathri', district: 'Parbhani', state: 'Maharashtra' },
  { name: 'Gangakhed', district: 'Parbhani', state: 'Maharashtra' },
  { name: 'Manwath', district: 'Parbhani', state: 'Maharashtra' },
  { name: 'Jintur', district: 'Parbhani', state: 'Maharashtra' },

  { name: 'Nagpur', district: 'Nagpur', state: 'Maharashtra' },
  { name: 'Kamptee', district: 'Nagpur', state: 'Maharashtra' },
  { name: 'Kalmeshwar', district: 'Nagpur', state: 'Maharashtra' },
  { name: 'Ramtek', district: 'Nagpur', state: 'Maharashtra' },
  { name: 'Umred', district: 'Nagpur', state: 'Maharashtra' },
  { name: 'Katol', district: 'Nagpur', state: 'Maharashtra' },
  { name: 'Savner', district: 'Nagpur', state: 'Maharashtra' },
  { name: 'Hingna', district: 'Nagpur', state: 'Maharashtra' },
  { name: 'Narkhed', district: 'Nagpur', state: 'Maharashtra' },
  { name: 'Parseoni', district: 'Nagpur', state: 'Maharashtra' },

  { name: 'Wardha', district: 'Wardha', state: 'Maharashtra' },
  { name: 'Hinganghat', district: 'Wardha', state: 'Maharashtra' },
  { name: 'Arvi', district: 'Wardha', state: 'Maharashtra' },
  { name: 'Deoli', district: 'Wardha', state: 'Maharashtra' },
  { name: 'Seloo', district: 'Wardha', state: 'Maharashtra' },

  { name: 'Yavatmal', district: 'Yavatmal', state: 'Maharashtra' },
  { name: 'Wani', district: 'Yavatmal', state: 'Maharashtra' },
  { name: 'Pusad', district: 'Yavatmal', state: 'Maharashtra' },
  { name: 'Umarkhed', district: 'Yavatmal', state: 'Maharashtra' },
  { name: 'Pandharkawada', district: 'Yavatmal', state: 'Maharashtra' },
  { name: 'Darwha', district: 'Yavatmal', state: 'Maharashtra' },

  { name: 'Amravati', district: 'Amravati', state: 'Maharashtra' },
  { name: 'Achalpur', district: 'Amravati', state: 'Maharashtra' },
  { name: 'Daryapur', district: 'Amravati', state: 'Maharashtra' },
  { name: 'Morshi', district: 'Amravati', state: 'Maharashtra' },
  { name: 'Warud', district: 'Amravati', state: 'Maharashtra' },
  { name: 'Chandur Bazar', district: 'Amravati', state: 'Maharashtra' },
  { name: 'Chandur Railway', district: 'Amravati', state: 'Maharashtra' },

  { name: 'Akola', district: 'Akola', state: 'Maharashtra' },
  { name: 'Akot', district: 'Akola', state: 'Maharashtra' },
  { name: 'Murtizapur', district: 'Akola', state: 'Maharashtra' },
  { name: 'Telhara', district: 'Akola', state: 'Maharashtra' },
  { name: 'Balapur', district: 'Akola', state: 'Maharashtra' },

  { name: 'Washim', district: 'Washim', state: 'Maharashtra' },
  { name: 'Malegaon', district: 'Washim', state: 'Maharashtra' },
  { name: 'Risod', district: 'Washim', state: 'Maharashtra' },
  { name: 'Manora', district: 'Washim', state: 'Maharashtra' },
  { name: 'Karanja', district: 'Washim', state: 'Maharashtra' },

  { name: 'Buldhana', district: 'Buldhana', state: 'Maharashtra' },
  { name: 'Khamgaon', district: 'Buldhana', state: 'Maharashtra' },
  { name: 'Chikhli', district: 'Buldhana', state: 'Maharashtra' },
  { name: 'Malkapur', district: 'Buldhana', state: 'Maharashtra' },
  { name: 'Jalgaon Jamod', district: 'Buldhana', state: 'Maharashtra' },
  { name: 'Mehkar', district: 'Buldhana', state: 'Maharashtra' },
  { name: 'Motala', district: 'Buldhana', state: 'Maharashtra' },
  { name: 'Shegaon', district: 'Buldhana', state: 'Maharashtra' },
  { name: 'Nandura', district: 'Buldhana', state: 'Maharashtra' },

  { name: 'Chandrapur', district: 'Chandrapur', state: 'Maharashtra' },
  { name: 'Ballarpur', district: 'Chandrapur', state: 'Maharashtra' },
  { name: 'Warora', district: 'Chandrapur', state: 'Maharashtra' },
  { name: 'Mul', district: 'Chandrapur', state: 'Maharashtra' },
  { name: 'Rajura', district: 'Chandrapur', state: 'Maharashtra' },
  { name: 'Nagbhir', district: 'Chandrapur', state: 'Maharashtra' },
  { name: 'Gadchandur', district: 'Chandrapur', state: 'Maharashtra' },
  { name: 'Chimur', district: 'Chandrapur', state: 'Maharashtra' },

  { name: 'Gadchiroli', district: 'Gadchiroli', state: 'Maharashtra' },
  { name: 'Armori', district: 'Gadchiroli', state: 'Maharashtra' },
  { name: 'Kurkheda', district: 'Gadchiroli', state: 'Maharashtra' },
  { name: 'Aheri', district: 'Gadchiroli', state: 'Maharashtra' },
  { name: 'Sironcha', district: 'Gadchiroli', state: 'Maharashtra' },

  { name: 'Gondia', district: 'Gondia', state: 'Maharashtra' },
  { name: 'Tumsar', district: 'Gondia', state: 'Maharashtra' },
  { name: 'Tirora', district: 'Gondia', state: 'Maharashtra' },
  { name: 'Arjuni Morgaon', district: 'Gondia', state: 'Maharashtra' },
  { name: 'Amgaon', district: 'Gondia', state: 'Maharashtra' },
  { name: 'Sadak-Arjuni', district: 'Gondia', state: 'Maharashtra' },
  { name: 'Deori', district: 'Gondia', state: 'Maharashtra' },

  { name: 'Bhandara', district: 'Bhandara', state: 'Maharashtra' },
  { name: 'Tumsar', district: 'Bhandara', state: 'Maharashtra' },
  { name: 'Sakoli', district: 'Bhandara', state: 'Maharashtra' },
  { name: 'Mohadi', district: 'Bhandara', state: 'Maharashtra' },
  { name: 'Lakhandur', district: 'Bhandara', state: 'Maharashtra' },
  { name: 'Pauni', district: 'Bhandara', state: 'Maharashtra' },
];

// Deduplicate by name+district combination
const seen = new Set();
const unique = cities.filter(c => {
  const key = `${c.name.toLowerCase()}__${c.district.toLowerCase()}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // Use bulkWrite for safe Upsert (Update or Insert)
    const bulkOps = unique.map(c => ({
      updateOne: {
        filter: { name: c.name, district: c.district, state: c.state },
        update: { $set: c },
        upsert: true
      }
    }));
    const result = await City.bulkWrite(bulkOps);
    console.log(`✅ Upserted cities. Matched: ${result.matchedCount}, Inserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`);

    // Cleanup: Remove any old cities in the DB that are not in our master script
    const validNames = unique.map(c => c.name);
    const deleteResult = await City.deleteMany({ name: { $nin: validNames } });
    if (deleteResult.deletedCount > 0) {
      console.log(`🧹 Removed ${deleteResult.deletedCount} outdated cities.`);
    }
    const states = ['Rajasthan', 'Punjab', 'Haryana', 'Gujarat', 'Maharashtra'];
    states.forEach(s => {
      const count = unique.filter(c => c.state === s).length;
      console.log(`   ${s}: ${count} cities`);
    });
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
