const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Server-side Complaint SLA Monitor
 * Detects approaching & overdue deadlines independently of client browsers
 */
const checkComplaintDeadlines = async () => {
  try {
    const now = new Date();

    // 1. Detect newly overdue complaints
    const overdueComplaints = await Complaint.find({
      status: { $nin: ['resolved', 'closed', 'rejected'] },
      isOverdue: false,
      resolutionDeadline: { $lt: now },
    });

    for (const c of overdueComplaints) {
      c.isOverdue = true;
      c.statusHistory.push({
        status: c.status,
        updatedByName: 'System SLA Monitor',
        notes: `Resolution deadline elapsed on ${c.resolutionDeadline.toISOString()}. Flagged as OVERDUE.`,
        timestamp: now,
      });
      await c.save();

      // Notify assigned manager
      if (c.assignedTo) {
        await Notification.create({
          recipient: c.assignedTo,
          type: 'complaint_deadline_alert',
          title: `⚠️ Overdue Complaint SLA [Ref: ${c.complaintId}]`,
          message: `The resolution deadline for complaint regarding "${c.title}" has passed. Immediate triage required.`,
          link: '/manager/complaints',
        });
      }

      // Notify platform admins for supervision
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        if (!c.assignedTo || admin._id.toString() !== c.assignedTo.toString()) {
          await Notification.create({
            recipient: admin._id,
            type: 'complaint_deadline_alert',
            title: `🚨 Overdue Escalation: Complaint [${c.complaintId}]`,
            message: `Resolution SLA exceeded for complaint on category "${c.category.replace(/_/g, ' ')}". Assigned to: ${c.assignedToName}`,
            link: '/manager/complaints',
          });
        }
      }
    }

    // 2. Auto-escalate critical safety concerns if unacknowledged after deadline
    const unacknowledgedCritical = await Complaint.find({
      status: 'submitted',
      urgency: 'critical_safety',
      isEscalated: false,
      acknowledgementDeadline: { $lt: now },
    });

    for (const c of unacknowledgedCritical) {
      c.isEscalated = true;
      c.status = 'escalated';
      c.escalatedAt = now;
      c.escalationReason = 'Critical safety concern exceeded acknowledgement target without manager action.';
      c.statusHistory.push({
        status: 'escalated',
        updatedByName: 'Automated Safety Guard',
        notes: c.escalationReason,
        timestamp: now,
      });
      await c.save();

      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await Notification.create({
          recipient: admin._id,
          type: 'complaint_escalated',
          title: `🚨 CRITICAL SAFETY ESCALATION [Ref: ${c.complaintId}]`,
          message: `Unacknowledged critical safety complaint: "${c.title}". Immediate supervisor intervention required.`,
          link: '/manager/complaints',
        });
      }
    }
  } catch (error) {
    console.error('Error running Complaint SLA Monitor:', error.message);
  }
};

const startComplaintScheduler = () => {
  // Run on startup
  checkComplaintDeadlines();

  // Run every 5 minutes
  const intervalId = setInterval(checkComplaintDeadlines, 5 * 60 * 1000);
  console.log('Complaint SLA Background Monitor started (5m interval).');

  return intervalId;
};

module.exports = { startComplaintScheduler, checkComplaintDeadlines };
