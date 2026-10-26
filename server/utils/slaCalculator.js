/**
 * SLA Deadlines Calculator for Customer & Worker Complaints
 */
const calculateSLADeadlines = (urgency = 'medium') => {
  const now = new Date();

  // Target hours based on severity / complexity
  const slaConfig = {
    critical_safety: {
      ackHours: 2,
      resolutionHours: 24,
    },
    high: {
      ackHours: 4,
      resolutionHours: 48,
    },
    medium: {
      ackHours: 12,
      resolutionHours: 72,
    },
    low: {
      ackHours: 24,
      resolutionHours: 120, // 5 days
    },
  };

  const config = slaConfig[urgency] || slaConfig.medium;

  const acknowledgementDeadline = new Date(now.getTime() + config.ackHours * 60 * 60 * 1000);
  const resolutionDeadline = new Date(now.getTime() + config.resolutionHours * 60 * 60 * 1000);

  return {
    acknowledgementDeadline,
    resolutionDeadline,
    ackHours: config.ackHours,
    resolutionHours: config.resolutionHours,
  };
};

module.exports = { calculateSLADeadlines };
