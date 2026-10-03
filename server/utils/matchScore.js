// Overlap-based match score between student availability and job requirement
function calculateMatchScore(studentAvailability, jobRequirement) {
  let overlapHours = 0;
  jobRequirement.forEach(reqSlot => {
    studentAvailability.forEach(availSlot => {
      if (reqSlot.day === availSlot.day) {
        const overlapStart = Math.max(reqSlot.startTime, availSlot.startTime);
        const overlapEnd = Math.min(reqSlot.endTime, availSlot.endTime);
        if (overlapEnd > overlapStart) overlapHours += (overlapEnd - overlapStart);
      }
    });
  });
  const totalRequired = jobRequirement.reduce((sum, s) => sum + (s.endTime - s.startTime), 0);
  if (totalRequired === 0) return 100; // If no specific requirements, it's a 100% match
  return Math.round((overlapHours / totalRequired) * 100);
}

module.exports = { calculateMatchScore };
