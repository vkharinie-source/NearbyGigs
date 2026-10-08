/**
 * Calculates accurate age from Date of Birth strictly on the backend.
 * Never trust an age value sent from the frontend.
 * @param {Date|string} dobInput 
 * @returns {number}
 */
function calculateAge(dobInput) {
  if (!dobInput) return 0;
  const dob = new Date(dobInput);
  if (isNaN(dob.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return Math.max(0, age);
}

/**
 * Checks if a user meets the required minimum age for student / standard gigs.
 * @param {Date|string} dobInput 
 * @param {number} minAge 
 * @returns {boolean}
 */
function isEligibleAge(dobInput, minAge = 18) {
  const age = calculateAge(dobInput);
  return age >= minAge;
}

module.exports = {
  calculateAge,
  isEligibleAge,
};
