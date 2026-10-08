/**
 * Analyzes gig timing parameters or start time to determine if it falls in configured night hours (8:00 PM - 6:00 AM)
 * @param {string} timeStr - e.g. "9:00 PM", "21:30", "11:00 PM", "Night shift", "2:00 AM"
 * @param {string} dateStr - Optional date context
 * @returns {{ isNight: boolean, reason: string }}
 */
function checkNightWork(timeStr, dateStr = '') {
  if (!timeStr) return { isNight: false, reason: '' };

  const lower = (timeStr + ' ' + dateStr).toLowerCase();

  // Keyword check
  if (
    lower.includes('night') ||
    lower.includes('midnight') ||
    lower.includes('late evening') ||
    lower.includes('graveyard') ||
    lower.includes('overnight')
  ) {
    return {
      isNight: true,
      reason: 'Gig is scheduled during late evening or overnight hours.',
    };
  }

  // Parse 12-hour or 24-hour time strings
  const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridian = timeMatch[3];

    if (meridian === 'pm' && hour < 12) hour += 12;
    if (meridian === 'am' && hour === 12) hour = 0;

    // Night window: 20:00 (8:00 PM) through 06:00 (6:00 AM)
    if (hour >= 20 || hour < 6) {
      return {
        isNight: true,
        reason: `Gig scheduled for ${timeStr}, which falls within night safety protection hours (8:00 PM - 6:00 AM).`,
      };
    }
  }

  return { isNight: false, reason: '' };
}

module.exports = {
  checkNightWork,
};
