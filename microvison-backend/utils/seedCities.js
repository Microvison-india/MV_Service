/**
 * utils/seedCities.js
 * Run once: node utils/seedCities.js
 * Seeds the cities master list for Rajasthan and Punjab.
 * Source: Census of India 2011 — all cities/towns with ~50,000+ population.
 * Districts are accurate as per 2011 census boundaries.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const City = require('../models/City');

const cities = [

  // ═══════════════════════════════════════════════
  // RAJASTHAN — 33 districts, 100+ cities/towns
  // ═══════════════════════════════════════════════

  // Jaipur district
  { name: 'Jaipur',         district: 'Jaipur', state: 'Rajasthan' },
  { name: 'Kotputli',       district: 'Jaipur', state: 'Rajasthan' },
  { name: 'Chomu',          district: 'Jaipur', state: 'Rajasthan' },
  { name: 'Phulera',        district: 'Jaipur', state: 'Rajasthan' },
  { name: 'Shahpura',       district: 'Jaipur', state: 'Rajasthan' },
  { name: 'Virat Nagar',    district: 'Jaipur', state: 'Rajasthan' },
  { name: 'Sambhar',        district: 'Jaipur', state: 'Rajasthan' },
  { name: 'Jobner',         district: 'Jaipur', state: 'Rajasthan' },

  // Jodhpur district
  { name: 'Jodhpur',        district: 'Jodhpur', state: 'Rajasthan' },
  { name: 'Phalodi',        district: 'Jodhpur', state: 'Rajasthan' },
  { name: 'Osian',          district: 'Jodhpur', state: 'Rajasthan' },
  { name: 'Bilara',         district: 'Jodhpur', state: 'Rajasthan' },
  { name: 'Luni',           district: 'Jodhpur', state: 'Rajasthan' },
  { name: 'Bhopalgarh',     district: 'Jodhpur', state: 'Rajasthan' },
  { name: 'Pipar City',     district: 'Jodhpur', state: 'Rajasthan' },
  { name: 'Mandore',        district: 'Jodhpur', state: 'Rajasthan' },

  // Kota district
  { name: 'Kota',           district: 'Kota', state: 'Rajasthan' },
  { name: 'Sangod',         district: 'Kota', state: 'Rajasthan' },
  { name: 'Sultanpur',      district: 'Kota', state: 'Rajasthan' },
  { name: 'Itawa',          district: 'Kota', state: 'Rajasthan' },

  // Udaipur district
  { name: 'Udaipur',        district: 'Udaipur', state: 'Rajasthan' },
  { name: 'Nathdwara',      district: 'Rajsamand', state: 'Rajasthan' },
  { name: 'Salumber',       district: 'Udaipur', state: 'Rajasthan' },
  { name: 'Mavli',          district: 'Udaipur', state: 'Rajasthan' },
  { name: 'Gogunda',        district: 'Udaipur', state: 'Rajasthan' },
  { name: 'Girwa',          district: 'Udaipur', state: 'Rajasthan' },

  // Ajmer district
  { name: 'Ajmer',          district: 'Ajmer', state: 'Rajasthan' },
  { name: 'Kishangarh',     district: 'Ajmer', state: 'Rajasthan' },
  { name: 'Beawar',         district: 'Ajmer', state: 'Rajasthan' },
  { name: 'Nasirabad',      district: 'Ajmer', state: 'Rajasthan' },
  { name: 'Pushkar',        district: 'Ajmer', state: 'Rajasthan' },
  { name: 'Kekri',          district: 'Ajmer', state: 'Rajasthan' },
  { name: 'Bhinai',         district: 'Ajmer', state: 'Rajasthan' },
  { name: 'Srinagar',       district: 'Ajmer', state: 'Rajasthan' },

  // Bikaner district
  { name: 'Bikaner',        district: 'Bikaner', state: 'Rajasthan' },
  { name: 'Nokha',          district: 'Bikaner', state: 'Rajasthan' },
  { name: 'Lunkaransar',    district: 'Bikaner', state: 'Rajasthan' },
  { name: 'Kolayat',        district: 'Bikaner', state: 'Rajasthan' },
  { name: 'Khajuwala',      district: 'Bikaner', state: 'Rajasthan' },
  { name: 'Dungargarh',     district: 'Bikaner', state: 'Rajasthan' },

  // Alwar district
  { name: 'Alwar',          district: 'Alwar', state: 'Rajasthan' },
  { name: 'Bhiwadi',        district: 'Alwar', state: 'Rajasthan' },
  { name: 'Behror',         district: 'Alwar', state: 'Rajasthan' },
  { name: 'Tijara',         district: 'Alwar', state: 'Rajasthan' },
  { name: 'Rajgarh',        district: 'Alwar', state: 'Rajasthan' },
  { name: 'Laxmangarh',     district: 'Alwar', state: 'Rajasthan' },
  { name: 'Ramgarh',        district: 'Alwar', state: 'Rajasthan' },
  { name: 'Kishangarh Bas', district: 'Alwar', state: 'Rajasthan' },
  { name: 'Mundawar',       district: 'Alwar', state: 'Rajasthan' },
  { name: 'Kotkasim',       district: 'Alwar', state: 'Rajasthan' },
  { name: 'Neemrana',       district: 'Alwar', state: 'Rajasthan' },

  // Bhilwara district
  { name: 'Bhilwara',       district: 'Bhilwara', state: 'Rajasthan' },
  { name: 'Shahpura',       district: 'Bhilwara', state: 'Rajasthan' },
  { name: 'Gulabpura',      district: 'Bhilwara', state: 'Rajasthan' },
  { name: 'Mandal',         district: 'Bhilwara', state: 'Rajasthan' },
  { name: 'Raipur',         district: 'Bhilwara', state: 'Rajasthan' },
  { name: 'Gangapur',       district: 'Bhilwara', state: 'Rajasthan' },
  { name: 'Asind',          district: 'Bhilwara', state: 'Rajasthan' },
  { name: 'Mandalgarh',     district: 'Bhilwara', state: 'Rajasthan' },

  // Bharatpur district
  { name: 'Bharatpur',      district: 'Bharatpur', state: 'Rajasthan' },
  { name: 'Deeg',           district: 'Bharatpur', state: 'Rajasthan' },
  { name: 'Nagar',          district: 'Bharatpur', state: 'Rajasthan' },
  { name: 'Weir',           district: 'Bharatpur', state: 'Rajasthan' },
  { name: 'Nadbai',         district: 'Bharatpur', state: 'Rajasthan' },
  { name: 'Kaman',          district: 'Bharatpur', state: 'Rajasthan' },
  { name: 'Rupbas',         district: 'Bharatpur', state: 'Rajasthan' },
  { name: 'Sewar',          district: 'Bharatpur', state: 'Rajasthan' },

  // Sikar district
  { name: 'Sikar',          district: 'Sikar', state: 'Rajasthan' },
  { name: 'Fatehpur',       district: 'Sikar', state: 'Rajasthan' },
  { name: 'Laxmangarh',     district: 'Sikar', state: 'Rajasthan' },
  { name: 'Neem ka Thana',  district: 'Sikar', state: 'Rajasthan' },
  { name: 'Sri Madhopur',   district: 'Sikar', state: 'Rajasthan' },
  { name: 'Dhod',           district: 'Sikar', state: 'Rajasthan' },
  { name: 'Khandela',       district: 'Sikar', state: 'Rajasthan' },
  { name: 'Ringas',         district: 'Sikar', state: 'Rajasthan' },
  { name: 'Danta Ramgarh',  district: 'Sikar', state: 'Rajasthan' },

  // Pali district
  { name: 'Pali',           district: 'Pali', state: 'Rajasthan' },
  { name: 'Sojat',          district: 'Pali', state: 'Rajasthan' },
  { name: 'Sumerpur',       district: 'Pali', state: 'Rajasthan' },
  { name: 'Jaitaran',       district: 'Pali', state: 'Rajasthan' },
  { name: 'Raipur',         district: 'Pali', state: 'Rajasthan' },
  { name: 'Desuri',         district: 'Pali', state: 'Rajasthan' },
  { name: 'Bali',           district: 'Pali', state: 'Rajasthan' },
  { name: 'Marwar Junction', district: 'Pali', state: 'Rajasthan' },
  { name: 'Rohat',          district: 'Pali', state: 'Rajasthan' },

  // Sri Ganganagar district
  { name: 'Sri Ganganagar',  district: 'Sri Ganganagar', state: 'Rajasthan' },
  { name: 'Suratgarh',       district: 'Sri Ganganagar', state: 'Rajasthan' },
  { name: 'Raisinghnagar',   district: 'Sri Ganganagar', state: 'Rajasthan' },
  { name: 'Anupgarh',        district: 'Sri Ganganagar', state: 'Rajasthan' },
  { name: 'Gharsana',        district: 'Sri Ganganagar', state: 'Rajasthan' },
  { name: 'Padampur',        district: 'Sri Ganganagar', state: 'Rajasthan' },
  { name: 'Vijaynagar',      district: 'Sri Ganganagar', state: 'Rajasthan' },
  { name: 'Karanpur',        district: 'Sri Ganganagar', state: 'Rajasthan' },

  // Jhunjhunu district
  { name: 'Jhunjhunu',      district: 'Jhunjhunu', state: 'Rajasthan' },
  { name: 'Pilani',         district: 'Jhunjhunu', state: 'Rajasthan' },
  { name: 'Chirawa',        district: 'Jhunjhunu', state: 'Rajasthan' },
  { name: 'Nawalgarh',      district: 'Jhunjhunu', state: 'Rajasthan' },
  { name: 'Mandawa',        district: 'Jhunjhunu', state: 'Rajasthan' },
  { name: 'Mukundgarh',     district: 'Jhunjhunu', state: 'Rajasthan' },
  { name: 'Udaipurwati',    district: 'Jhunjhunu', state: 'Rajasthan' },
  { name: 'Bissau',         district: 'Jhunjhunu', state: 'Rajasthan' },
  { name: 'Surajgarh',      district: 'Jhunjhunu', state: 'Rajasthan' },

  // Tonk district
  { name: 'Tonk',           district: 'Tonk', state: 'Rajasthan' },
  { name: 'Uniara',         district: 'Tonk', state: 'Rajasthan' },
  { name: 'Malpura',        district: 'Tonk', state: 'Rajasthan' },
  { name: 'Deoli',          district: 'Tonk', state: 'Rajasthan' },
  { name: 'Niwai',          district: 'Tonk', state: 'Rajasthan' },
  { name: 'Peeplu',         district: 'Tonk', state: 'Rajasthan' },

  // Nagaur district
  { name: 'Nagaur',         district: 'Nagaur', state: 'Rajasthan' },
  { name: 'Makrana',        district: 'Nagaur', state: 'Rajasthan' },
  { name: 'Merta City',     district: 'Nagaur', state: 'Rajasthan' },
  { name: 'Ladnun',         district: 'Nagaur', state: 'Rajasthan' },
  { name: 'Didwana',        district: 'Nagaur', state: 'Rajasthan' },
  { name: 'Kuchaman City',  district: 'Nagaur', state: 'Rajasthan' },
  { name: 'Mundwa',         district: 'Nagaur', state: 'Rajasthan' },
  { name: 'Parbatsar',      district: 'Nagaur', state: 'Rajasthan' },
  { name: 'Jayal',          district: 'Nagaur', state: 'Rajasthan' },
  { name: 'Degana',         district: 'Nagaur', state: 'Rajasthan' },
  { name: 'Nawa',           district: 'Nagaur', state: 'Rajasthan' },

  // Churu district
  { name: 'Churu',          district: 'Churu', state: 'Rajasthan' },
  { name: 'Sujangarh',      district: 'Churu', state: 'Rajasthan' },
  { name: 'Sardarshahar',   district: 'Churu', state: 'Rajasthan' },
  { name: 'Ratangarh',      district: 'Churu', state: 'Rajasthan' },
  { name: 'Rajgarh',        district: 'Churu', state: 'Rajasthan' },
  { name: 'Taranagar',      district: 'Churu', state: 'Rajasthan' },
  { name: 'Bidasar',        district: 'Churu', state: 'Rajasthan' },
  { name: 'Salasar',        district: 'Churu', state: 'Rajasthan' },

  // Hanumangarh district
  { name: 'Hanumangarh',    district: 'Hanumangarh', state: 'Rajasthan' },
  { name: 'Sangaria',       district: 'Hanumangarh', state: 'Rajasthan' },
  { name: 'Pilibanga',      district: 'Hanumangarh', state: 'Rajasthan' },
  { name: 'Nohar',          district: 'Hanumangarh', state: 'Rajasthan' },
  { name: 'Bhadra',         district: 'Hanumangarh', state: 'Rajasthan' },
  { name: 'Rawatsar',       district: 'Hanumangarh', state: 'Rajasthan' },
  { name: 'Tibbi',          district: 'Hanumangarh', state: 'Rajasthan' },

  // Dausa district
  { name: 'Dausa',          district: 'Dausa', state: 'Rajasthan' },
  { name: 'Bandikui',       district: 'Dausa', state: 'Rajasthan' },
  { name: 'Lalsot',         district: 'Dausa', state: 'Rajasthan' },
  { name: 'Sikrai',         district: 'Dausa', state: 'Rajasthan' },
  { name: 'Baswa',          district: 'Dausa', state: 'Rajasthan' },
  { name: 'Mahwa',          district: 'Dausa', state: 'Rajasthan' },

  // Sawai Madhopur district
  { name: 'Sawai Madhopur', district: 'Sawai Madhopur', state: 'Rajasthan' },
  { name: 'Gangapur City',  district: 'Sawai Madhopur', state: 'Rajasthan' },
  { name: 'Bonli',          district: 'Sawai Madhopur', state: 'Rajasthan' },
  { name: 'Wazirpur',       district: 'Sawai Madhopur', state: 'Rajasthan' },
  { name: 'Bamanwas',       district: 'Sawai Madhopur', state: 'Rajasthan' },

  // Barmer district
  { name: 'Barmer',         district: 'Barmer', state: 'Rajasthan' },
  { name: 'Balotra',        district: 'Barmer', state: 'Rajasthan' },
  { name: 'Pachpadra',      district: 'Barmer', state: 'Rajasthan' },
  { name: 'Sheo',           district: 'Barmer', state: 'Rajasthan' },
  { name: 'Gudamalani',     district: 'Barmer', state: 'Rajasthan' },
  { name: 'Chohtan',        district: 'Barmer', state: 'Rajasthan' },
  { name: 'Siwana',         district: 'Barmer', state: 'Rajasthan' },

  // Jaisalmer district
  { name: 'Jaisalmer',      district: 'Jaisalmer', state: 'Rajasthan' },
  { name: 'Pokaran',        district: 'Jaisalmer', state: 'Rajasthan' },
  { name: 'Fatehgarh',      district: 'Jaisalmer', state: 'Rajasthan' },
  { name: 'Sam',            district: 'Jaisalmer', state: 'Rajasthan' },

  // Jalore district
  { name: 'Jalore',         district: 'Jalore', state: 'Rajasthan' },
  { name: 'Sanchore',       district: 'Jalore', state: 'Rajasthan' },
  { name: 'Bhinmal',        district: 'Jalore', state: 'Rajasthan' },
  { name: 'Ahore',          district: 'Jalore', state: 'Rajasthan' },
  { name: 'Sayla',          district: 'Jalore', state: 'Rajasthan' },
  { name: 'Bagoda',         district: 'Jalore', state: 'Rajasthan' },

  // Sirohi district
  { name: 'Sirohi',         district: 'Sirohi', state: 'Rajasthan' },
  { name: 'Abu Road',       district: 'Sirohi', state: 'Rajasthan' },
  { name: 'Mount Abu',      district: 'Sirohi', state: 'Rajasthan' },
  { name: 'Pindwara',       district: 'Sirohi', state: 'Rajasthan' },
  { name: 'Sheoganj',       district: 'Sirohi', state: 'Rajasthan' },
  { name: 'Reodar',         district: 'Sirohi', state: 'Rajasthan' },

  // Dungarpur district
  { name: 'Dungarpur',      district: 'Dungarpur', state: 'Rajasthan' },
  { name: 'Sagwara',        district: 'Dungarpur', state: 'Rajasthan' },
  { name: 'Bichhiwara',     district: 'Dungarpur', state: 'Rajasthan' },
  { name: 'Simalwara',      district: 'Dungarpur', state: 'Rajasthan' },

  // Banswara district
  { name: 'Banswara',       district: 'Banswara', state: 'Rajasthan' },
  { name: 'Kushalgarh',     district: 'Banswara', state: 'Rajasthan' },
  { name: 'Garhi',          district: 'Banswara', state: 'Rajasthan' },
  { name: 'Ghatol',         district: 'Banswara', state: 'Rajasthan' },

  // Bundi district
  { name: 'Bundi',          district: 'Bundi', state: 'Rajasthan' },
  { name: 'Nainwa',         district: 'Bundi', state: 'Rajasthan' },
  { name: 'Indergarh',      district: 'Bundi', state: 'Rajasthan' },
  { name: 'Hindoli',        district: 'Bundi', state: 'Rajasthan' },
  { name: 'Keshoraipatan',  district: 'Bundi', state: 'Rajasthan' },

  // Jhalawar district
  { name: 'Jhalawar',       district: 'Jhalawar', state: 'Rajasthan' },
  { name: 'Jhalarapatan',   district: 'Jhalawar', state: 'Rajasthan' },
  { name: 'Khanpur',        district: 'Jhalawar', state: 'Rajasthan' },
  { name: 'Pirawa',         district: 'Jhalawar', state: 'Rajasthan' },
  { name: 'Dag',            district: 'Jhalawar', state: 'Rajasthan' },
  { name: 'Aklera',         district: 'Jhalawar', state: 'Rajasthan' },
  { name: 'Bakani',         district: 'Jhalawar', state: 'Rajasthan' },

  // Baran district
  { name: 'Baran',          district: 'Baran', state: 'Rajasthan' },
  { name: 'Baran',          district: 'Baran', state: 'Rajasthan' },
  { name: 'Atru',           district: 'Baran', state: 'Rajasthan' },
  { name: 'Chhipabarod',    district: 'Baran', state: 'Rajasthan' },
  { name: 'Shahabad',       district: 'Baran', state: 'Rajasthan' },
  { name: 'Mangrol',        district: 'Baran', state: 'Rajasthan' },
  { name: 'Chhabra',        district: 'Baran', state: 'Rajasthan' },
  { name: 'Kelwara',        district: 'Baran', state: 'Rajasthan' },

  // Rajsamand district
  { name: 'Rajsamand',      district: 'Rajsamand', state: 'Rajasthan' },
  { name: 'Nathdwara',      district: 'Rajsamand', state: 'Rajasthan' },
  { name: 'Railmagra',      district: 'Rajsamand', state: 'Rajasthan' },
  { name: 'Bhim',           district: 'Rajsamand', state: 'Rajasthan' },
  { name: 'Deogarh',        district: 'Rajsamand', state: 'Rajasthan' },
  { name: 'Kankroli',       district: 'Rajsamand', state: 'Rajasthan' },
  { name: 'Amet',           district: 'Rajsamand', state: 'Rajasthan' },

  // Pratapgarh district
  { name: 'Pratapgarh',     district: 'Pratapgarh', state: 'Rajasthan' },
  { name: 'Arnod',          district: 'Pratapgarh', state: 'Rajasthan' },
  { name: 'Chhoti Sadri',   district: 'Pratapgarh', state: 'Rajasthan' },
  { name: 'Dhariawad',      district: 'Pratapgarh', state: 'Rajasthan' },
  { name: 'Manpur',         district: 'Pratapgarh', state: 'Rajasthan' },

  // Karauli district
  { name: 'Karauli',        district: 'Karauli', state: 'Rajasthan' },
  { name: 'Hindaun',        district: 'Karauli', state: 'Rajasthan' },
  { name: 'Sapotra',        district: 'Karauli', state: 'Rajasthan' },
  { name: 'Nadoti',         district: 'Karauli', state: 'Rajasthan' },
  { name: 'Todabhim',       district: 'Karauli', state: 'Rajasthan' },
  { name: 'Masalpur',       district: 'Karauli', state: 'Rajasthan' },

  // Dholpur district
  { name: 'Dholpur',        district: 'Dholpur', state: 'Rajasthan' },
  { name: 'Bari',           district: 'Dholpur', state: 'Rajasthan' },
  { name: 'Rajakhera',      district: 'Dholpur', state: 'Rajasthan' },
  { name: 'Baseri',         district: 'Dholpur', state: 'Rajasthan' },
  { name: 'Sirmuttra',      district: 'Dholpur', state: 'Rajasthan' },

  // Chittorgarh district
  { name: 'Chittorgarh',    district: 'Chittorgarh', state: 'Rajasthan' },
  { name: 'Nimbahera',      district: 'Chittorgarh', state: 'Rajasthan' },
  { name: 'Begun',          district: 'Chittorgarh', state: 'Rajasthan' },
  { name: 'Bari Sadri',     district: 'Chittorgarh', state: 'Rajasthan' },
  { name: 'Kapasan',        district: 'Chittorgarh', state: 'Rajasthan' },
  { name: 'Rashmi',         district: 'Chittorgarh', state: 'Rajasthan' },
  { name: 'Gangrar',        district: 'Chittorgarh', state: 'Rajasthan' },
  { name: 'Rawatbhata',     district: 'Chittorgarh', state: 'Rajasthan' },

  // ═══════════════════════════════════════════════
  // PUNJAB — 22 districts, 60+ cities/towns
  // ═══════════════════════════════════════════════

  // Ludhiana district
  { name: 'Ludhiana',       district: 'Ludhiana', state: 'Punjab' },
  { name: 'Khanna',         district: 'Ludhiana', state: 'Punjab' },
  { name: 'Samrala',        district: 'Ludhiana', state: 'Punjab' },
  { name: 'Raikot',         district: 'Ludhiana', state: 'Punjab' },
  { name: 'Machhiwara',     district: 'Ludhiana', state: 'Punjab' },
  { name: 'Payal',          district: 'Ludhiana', state: 'Punjab' },
  { name: 'Jagraon',        district: 'Ludhiana', state: 'Punjab' },
  { name: 'Doraha',         district: 'Ludhiana', state: 'Punjab' },

  // Amritsar district
  { name: 'Amritsar',       district: 'Amritsar', state: 'Punjab' },
  { name: 'Tarn Taran',     district: 'Tarn Taran', state: 'Punjab' },
  { name: 'Patti',          district: 'Tarn Taran', state: 'Punjab' },
  { name: 'Khadur Sahib',   district: 'Tarn Taran', state: 'Punjab' },
  { name: 'Ramdas',         district: 'Amritsar', state: 'Punjab' },
  { name: 'Ajnala',         district: 'Amritsar', state: 'Punjab' },
  { name: 'Baba Bakala',    district: 'Amritsar', state: 'Punjab' },

  // Jalandhar district
  { name: 'Jalandhar',      district: 'Jalandhar', state: 'Punjab' },
  { name: 'Phagwara',       district: 'Kapurthala', state: 'Punjab' },
  { name: 'Nakodar',        district: 'Jalandhar', state: 'Punjab' },
  { name: 'Shahkot',        district: 'Jalandhar', state: 'Punjab' },
  { name: 'Nurmahal',       district: 'Jalandhar', state: 'Punjab' },
  { name: 'Phillaur',       district: 'Jalandhar', state: 'Punjab' },
  { name: 'Lohian Khas',    district: 'Jalandhar', state: 'Punjab' },

  // Patiala district
  { name: 'Patiala',        district: 'Patiala', state: 'Punjab' },
  { name: 'Rajpura',        district: 'Patiala', state: 'Punjab' },
  { name: 'Nabha',          district: 'Patiala', state: 'Punjab' },
  { name: 'Samana',         district: 'Patiala', state: 'Punjab' },
  { name: 'Fatehgarh Sahib', district: 'Fatehgarh Sahib', state: 'Punjab' },
  { name: 'Sirhind',        district: 'Fatehgarh Sahib', state: 'Punjab' },
  { name: 'Amloh',          district: 'Fatehgarh Sahib', state: 'Punjab' },
  { name: 'Khanna',         district: 'Ludhiana', state: 'Punjab' },

  // Bathinda district
  { name: 'Bathinda',       district: 'Bathinda', state: 'Punjab' },
  { name: 'Mansa',          district: 'Mansa', state: 'Punjab' },
  { name: 'Rampura Phul',   district: 'Bathinda', state: 'Punjab' },
  { name: 'Talwandi Sabo',  district: 'Bathinda', state: 'Punjab' },
  { name: 'Goniana',        district: 'Bathinda', state: 'Punjab' },
  { name: 'Sardulgarh',     district: 'Mansa', state: 'Punjab' },
  { name: 'Budhlada',       district: 'Mansa', state: 'Punjab' },

  // SAS Nagar (Mohali) district
  { name: 'Mohali',         district: 'SAS Nagar', state: 'Punjab' },
  { name: 'Zirakpur',       district: 'SAS Nagar', state: 'Punjab' },
  { name: 'Kharar',         district: 'SAS Nagar', state: 'Punjab' },
  { name: 'Derabassi',      district: 'SAS Nagar', state: 'Punjab' },
  { name: 'Morinda',        district: 'Rupnagar', state: 'Punjab' },
  { name: 'Ropar',          district: 'Rupnagar', state: 'Punjab' },
  { name: 'Anandpur Sahib', district: 'Rupnagar', state: 'Punjab' },
  { name: 'Nangal',         district: 'Rupnagar', state: 'Punjab' },

  // Hoshiarpur district
  { name: 'Hoshiarpur',     district: 'Hoshiarpur', state: 'Punjab' },
  { name: 'Mukerian',       district: 'Hoshiarpur', state: 'Punjab' },
  { name: 'Dasuya',         district: 'Hoshiarpur', state: 'Punjab' },
  { name: 'Garhshankar',    district: 'Hoshiarpur', state: 'Punjab' },
  { name: 'Tanda',          district: 'Hoshiarpur', state: 'Punjab' },
  { name: 'Mahilpur',       district: 'Hoshiarpur', state: 'Punjab' },
  { name: 'Nawanshahr',     district: 'Shahid Bhagat Singh Nagar', state: 'Punjab' },
  { name: 'Balachaur',      district: 'Shahid Bhagat Singh Nagar', state: 'Punjab' },

  // Gurdaspur district
  { name: 'Gurdaspur',      district: 'Gurdaspur', state: 'Punjab' },
  { name: 'Pathankot',      district: 'Pathankot', state: 'Punjab' },
  { name: 'Batala',         district: 'Gurdaspur', state: 'Punjab' },
  { name: 'Dhariwal',       district: 'Gurdaspur', state: 'Punjab' },
  { name: 'Qadian',         district: 'Gurdaspur', state: 'Punjab' },
  { name: 'Dinanagar',      district: 'Gurdaspur', state: 'Punjab' },
  { name: 'Dera Baba Nanak', district: 'Gurdaspur', state: 'Punjab' },
  { name: 'Sujanpur',       district: 'Pathankot', state: 'Punjab' },

  // Moga district
  { name: 'Moga',           district: 'Moga', state: 'Punjab' },
  { name: 'Nihal Singh Wala', district: 'Moga', state: 'Punjab' },
  { name: 'Baghapurana',    district: 'Moga', state: 'Punjab' },
  { name: 'Dharamkot',      district: 'Moga', state: 'Punjab' },

  // Firozpur district
  { name: 'Firozpur',       district: 'Firozpur', state: 'Punjab' },
  { name: 'Fazilka',        district: 'Fazilka', state: 'Punjab' },
  { name: 'Abohar',         district: 'Fazilka', state: 'Punjab' },
  { name: 'Jalalabad',      district: 'Fazilka', state: 'Punjab' },
  { name: 'Zira',           district: 'Firozpur', state: 'Punjab' },
  { name: 'Guru Har Sahai', district: 'Firozpur', state: 'Punjab' },

  // Sangrur district
  { name: 'Sangrur',        district: 'Sangrur', state: 'Punjab' },
  { name: 'Malerkotla',     district: 'Malerkotla', state: 'Punjab' },
  { name: 'Barnala',        district: 'Barnala', state: 'Punjab' },
  { name: 'Sunam',          district: 'Sangrur', state: 'Punjab' },
  { name: 'Dhuri',          district: 'Sangrur', state: 'Punjab' },
  { name: 'Lehra Gaga',     district: 'Sangrur', state: 'Punjab' },
  { name: 'Moonak',         district: 'Sangrur', state: 'Punjab' },
  { name: 'Dirba',          district: 'Sangrur', state: 'Punjab' },
  { name: 'Longowal',       district: 'Sangrur', state: 'Punjab' },

  // Faridkot district
  { name: 'Faridkot',       district: 'Faridkot', state: 'Punjab' },
  { name: 'Muktsar',        district: 'Sri Muktsar Sahib', state: 'Punjab' },
  { name: 'Jaitu',          district: 'Faridkot', state: 'Punjab' },
  { name: 'Kotkapura',      district: 'Faridkot', state: 'Punjab' },
  { name: 'Giddarbaha',     district: 'Sri Muktsar Sahib', state: 'Punjab' },
  { name: 'Malout',         district: 'Sri Muktsar Sahib', state: 'Punjab' },

  // Kapurthala district
  { name: 'Kapurthala',     district: 'Kapurthala', state: 'Punjab' },
  { name: 'Sultanpur Lodhi', district: 'Kapurthala', state: 'Punjab' },
  { name: 'Dhilwan',        district: 'Kapurthala', state: 'Punjab' },
];

// Remove duplicates by name+district combo
const unique = cities.filter((city, index, self) =>
  index === self.findIndex(c => c.name === city.name && c.district === city.district)
);

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    await City.deleteMany({});
    console.log('Cleared existing cities');

    const inserted = await City.insertMany(unique);
    console.log(`✅ Seeded ${inserted.length} cities successfully`);

    // Summary
    const rajCount = unique.filter(c => c.state === 'Rajasthan').length;
    const pbCount  = unique.filter(c => c.state === 'Punjab').length;
    console.log(`   Rajasthan: ${rajCount} cities`);
    console.log(`   Punjab:    ${pbCount} cities`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();