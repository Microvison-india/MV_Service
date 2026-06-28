/**
 * Parses a date string (YYYY-MM-DD) into a UTC Date object representing 
 * the local start or end of that day, adjusted using the client's 
 * timezone offset (sent via X-Timezone-Offset header).
 *
 * @param {string} dateStr - The date string from the client.
 * @param {string|number} offsetHeader - The X-Timezone-Offset header value (in minutes).
 * @param {boolean} isEndOfDay - Whether to parse as the end of the local day (23:59:59.999) instead of the start.
 * @returns {Date|null} - The parsed and adjusted UTC Date object, or null.
 */
function parseLocalDate(dateStr, offsetHeader, isEndOfDay = false) {
  if (!dateStr) return null;
  
  // If it's already a full ISO timestamp (contains T), parse directly
  if (dateStr.includes('T')) {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }

  // Construct UTC base for start or end of local day
  const timeSuffix = isEndOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z';
  const utcDate = new Date(dateStr + timeSuffix);
  
  if (isNaN(utcDate.getTime())) {
    const fallback = new Date(dateStr);
    return isNaN(fallback.getTime()) ? null : fallback;
  }

  // Adjust for timezone offset
  if (offsetHeader !== undefined && offsetHeader !== null) {
    const offset = parseInt(offsetHeader, 10);
    if (!isNaN(offset)) {
      // clientTime = utcTime - offset
      // So utcTime = clientTime + offset
      utcDate.setMinutes(utcDate.getMinutes() + offset);
    }
  }

  return utcDate;
}

module.exports = { parseLocalDate };
