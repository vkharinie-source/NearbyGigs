const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Gig = require('./models/Gig');
const Application = require('./models/Application');
const Notification = require('./models/Notification');
const Earning = require('./models/Earning');
const Complaint = require('./models/Complaint');

dotenv.config();

const populate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Find users to populate data for
    const targetUsers = await User.find({
      email: { $in: ['kani@gmail.com', 'harinie@gmail.com', 'vkharinie@gmail.com', 'rams@gmail.com'] },
    });

    if (targetUsers.length === 0) {
      console.error('No target users found!');
      process.exit(1);
    }

    const workerArun = await User.findOne({ email: 'arun@example.com' });
    const workerSuresh = await User.findOne({ email: 'suresh@example.com' });
    const workerAnita = await User.findOne({ email: 'anita@example.com' });
    const workerRahul = await User.findOne({ email: 'rahul@example.com' });
    const employerTech = await User.findOne({ email: 'priya@example.com' });

    for (const currentUser of targetUsers) {
      console.log(`Populating data for: ${currentUser.name || currentUser.email} (${currentUser.email} - ${currentUser._id})...`);

      // Clean up previous records for this user to avoid duplicates
      const userGigs = await Gig.find({ postedBy: currentUser._id });
      const userGigIds = userGigs.map(g => g._id);
      await Application.deleteMany({ $or: [{ gig: { $in: userGigIds } }, { applicant: currentUser._id }] });
      await Gig.deleteMany({ postedBy: currentUser._id });

      // Ensure user has both worker and employer privileges so they can test both panels seamlessly
      currentUser.role = 'both';
      currentUser.purpose = 'both';
      if (!currentUser.companyName) {
        currentUser.companyName = `${currentUser.name || 'Prime'} Enterprises & Facilities`;
      }
      currentUser.employerStatus = 'VERIFIED';
      currentUser.kycStatus = 'verified';
      currentUser.studentVerificationStatus = 'verified';
      currentUser.onboardingCompleted = true;
      await currentUser.save();
      const harinie = currentUser;

      // 1. Create Posted Gigs owned by Harinie
      const gig1 = await Gig.create({
        title: 'Weekend Store Assistant & Cashier',
        category: 'Retail & Facilities',
        description: 'Customer greeting, inventory restocking, and counter sales management at retail store in Indiranagar.',
        requiredSkills: ['Customer Service', 'Cash Handling', 'Inventory Setup'],
        budgetMin: 700,
        budgetMax: 1200,
        salaryType: 'Fixed',
        jobType: 'On-site',
        date: 'This Saturday',
        time: '10:00 AM - 4:00 PM',
        duration: '6 Hours',
        address: '100ft Road, Indiranagar, Bengaluru',
        location: {
          type: 'Point',
          coordinates: [77.6413, 12.9784],
        },
        postedBy: harinie._id,
        status: 'open',
        applicantsCount: 2,
        attendanceMethod: 'otp',
        evidenceRequirements: ['task_checklist', 'completion_photos'],
      });

      const gig2 = await Gig.create({
        title: 'Home Office Electrical Cabling & Smart Plug Setup',
        category: 'Electrical',
        description: 'Concealed CAT6 ethernet line routing and 4x smart WiFi plug installation for ergonomic workstation.',
        requiredSkills: ['Electrical Wiring', 'Networking', 'Smart Home'],
        budgetMin: 850,
        budgetMax: 1500,
        salaryType: 'Fixed',
        jobType: 'On-site',
        date: 'Tomorrow',
        time: '2:00 PM - 5:00 PM',
        duration: '3 Hours',
        address: 'Defence Colony, Indiranagar, Bengaluru',
        location: {
          type: 'Point',
          coordinates: [77.642, 12.975],
        },
        postedBy: harinie._id,
        assignedTo: workerArun?._id,
        status: 'assigned',
        applicantsCount: 1,
        attendanceMethod: 'otp',
        evidenceRequirements: ['before_after_photos', 'completion_photos'],
      });

      const gig3 = await Gig.create({
        title: 'Post-Renovation 3BHK Deep Cleaning & Sanitization',
        category: 'Cleaning',
        description: 'Industrial vacuuming, window streak-free wiping, bathroom descaling, and eco-friendly floor buffing.',
        requiredSkills: ['Deep Cleaning', 'Sanitization', 'Window Polishing'],
        budgetMin: 1800,
        budgetMax: 2600,
        salaryType: 'Fixed',
        jobType: 'On-site',
        date: 'Today',
        time: '9:00 AM - 1:00 PM',
        duration: '4 Hours',
        address: 'HAL 2nd Stage, Indiranagar, Bengaluru',
        location: {
          type: 'Point',
          coordinates: [77.648, 12.969],
        },
        postedBy: harinie._id,
        assignedTo: workerSuresh?._id,
        status: 'in_progress',
        applicantsCount: 1,
        attendanceMethod: 'otp',
        evidenceRequirements: ['before_after_photos', 'task_checklist'],
      });

      const gig4 = await Gig.create({
        title: 'High-School Mathematics & Physics Tutor',
        category: 'Tutoring',
        description: 'Weekly CBSE Class 11 Trigonometry & Mechanics doubt clearing and mock paper evaluation.',
        requiredSkills: ['CBSE Curriculum', 'Mathematics', 'Physics Tutoring'],
        budgetMin: 600,
        budgetMax: 900,
        salaryType: 'Hourly',
        jobType: 'Hybrid',
        date: 'Every Monday & Thursday',
        time: '5:00 PM - 7:00 PM',
        duration: '2 Hours / Session',
        address: 'Indiranagar 1st Stage, Bengaluru',
        location: {
          type: 'Point',
          coordinates: [77.639, 12.981],
        },
        postedBy: harinie._id,
        status: 'open',
        applicantsCount: 1,
        attendanceMethod: 'manual_confirmation',
      });

      // 2. Applications Received on Harinie's Gigs
      // App 1: Submitted on Gig 1
      if (workerAnita) {
        await Application.create({
          gig: gig1._id,
          applicant: workerAnita._id,
          proposal: 'Experienced store merchandiser and billing specialist. Familiar with POS systems and customer handling.',
          proposedRate: 850,
          estimatedTime: '6 Hours',
          status: 'submitted',
          suitabilityProof: {
            coverMessage: 'Available this Saturday. Verified KYC and 3 years experience.',
            availabilityConfirmed: true,
          },
        });
      }

      // App 2: Shortlisted on Gig 1
      if (workerRahul) {
        await Application.create({
          gig: gig1._id,
          applicant: workerRahul._id,
          proposal: 'College student looking for weekend work. Fast learner, reliable, and punctual.',
          proposedRate: 800,
          estimatedTime: '6 Hours',
          status: 'shortlisted',
          suitabilityProof: {
            coverMessage: 'College ID verified. Ready to follow instructions diligently.',
            availabilityConfirmed: true,
          },
        });
      }

      // App 3: Confirmed Assignment with Instructions on Gig 2
      if (workerArun) {
        const earning2 = await Earning.create({
          worker: workerArun._id,
          employer: harinie._id,
          gig: gig2._id,
          title: gig2.title,
          amount: 1100,
          hoursWorked: 3,
          payoutStatus: 'escrow_held',
        });

        await Application.create({
          gig: gig2._id,
          applicant: workerArun._id,
          proposal: 'Certified networking and wiring technician. I bring professional cable testers and safety tools.',
          proposedRate: 1100,
          estimatedTime: '3 Hours',
          status: 'accepted',
          commitment: {
            status: 'confirmed',
            workerConfirmedAt: new Date(Date.now() - 3600000),
            workerConfirmationNotes: 'Confirmed attendance for tomorrow 2:00 PM. Will bring crimping kit and testers.',
          },
          jobInstructions: {
            confirmedDate: 'Tomorrow, 2:00 PM',
            startTime: '02:00 PM',
            endTime: '05:00 PM',
            agreedPayment: 1100,
            paymentType: 'Fixed',
            responsibilities: 'Route cable along baseboard and configure smart plug WiFi SSID integration.',
            workLocation: 'Defence Colony, Indiranagar, Bengaluru',
            arrivalInstructions: 'Call upon arrival at gate 3. Security badge will be provided.',
            contactPhone: '+91 9443322110',
            safetyInstructions: 'Switch off MCB switch before splicing wires.',
            attendanceMethod: 'otp',
            completionRequirements: 'Run speed test and test remote on/off via mobile app.',
            providedAt: new Date(Date.now() - 7200000),
            status: 'provided',
          },
          attendance: {
            method: 'otp',
            status: 'checkin_pending',
          },
          payment: {
            amount: 1100,
            status: 'payment_pending',
            earningRecord: earning2._id,
          },
        });
      }

      // App 4: Work Proof to Review on Gig 3
      if (workerSuresh) {
        const earning3 = await Earning.create({
          worker: workerSuresh._id,
          employer: harinie._id,
          gig: gig3._id,
          title: gig3.title,
          amount: 2200,
          hoursWorked: 4,
          payoutStatus: 'escrow_held',
        });

        await Application.create({
          gig: gig3._id,
          applicant: workerSuresh._id,
          proposal: 'Deep cleaning team with commercial steam equipment and microfiber polishing tools.',
          proposedRate: 2200,
          estimatedTime: '4 Hours',
          status: 'accepted',
          commitment: {
            status: 'confirmed',
            workerConfirmedAt: new Date(Date.now() - 14400000),
          },
          jobInstructions: {
            confirmedDate: 'Today, 9:00 AM',
            startTime: '09:00 AM',
            endTime: '01:00 PM',
            agreedPayment: 2200,
            paymentType: 'Fixed',
            responsibilities: 'Deep clean 3BHK bedrooms, hall, and 3 attached washrooms.',
            workLocation: 'HAL 2nd Stage, Indiranagar, Bengaluru',
            arrivalInstructions: 'Ring bell on flat 302.',
            contactPhone: '+91 9443322110',
            safetyInstructions: 'Use non-corrosive tile cleaners.',
            attendanceMethod: 'otp',
            completionRequirements: 'Submit before and after photos showing spotless floors and descaled fixtures.',
            providedAt: new Date(Date.now() - 18000000),
            status: 'provided',
          },
          attendance: {
            method: 'otp',
            status: 'attendance_verified',
            checkInTime: new Date(Date.now() - 14000000),
          },
          workCompletion: {
            status: 'submitted_for_review',
            taskDescription: 'Completed full deep cleaning across all 3 bedrooms, living hall, kitchen counter, and 3 bathrooms. Steam sanitized all high-touch surfaces.',
            checklist: [
              { task: 'Industrial vacuuming of all carpeted and marble areas', completed: true },
              { task: 'Streak-free window and balcony glass wiping', completed: true },
              { task: 'Bathroom descaling and odor neutralization', completed: true },
              { task: 'Eco-friendly floor buffing and trash removal', completed: true },
            ],
            beforePhotos: [
              { url: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=500', caption: 'Living room before cleaning' },
            ],
            afterPhotos: [
              { url: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=500', caption: 'Living room spotless after buffing' },
            ],
            submittedAt: new Date(Date.now() - 1800000),
          },
          payment: {
            amount: 2200,
            status: 'payment_pending',
            earningRecord: earning3._id,
          },
        });
      }

      // App 5: Harinie applying as a worker on an external gig
      const externalGig = await Gig.findOne({ postedBy: { $ne: harinie._id } });
      if (externalGig) {
        const existingApp = await Application.findOne({ gig: externalGig._id, applicant: harinie._id });
        if (!existingApp) {
          await Application.create({
            gig: externalGig._id,
            applicant: harinie._id,
            proposal: 'Hi! I am enthusiastic to assist with this task. Verified qualifications and prompt communication guaranteed.',
            proposedRate: externalGig.budgetMin || 600,
            estimatedTime: externalGig.duration || '2-3 Hours',
            status: 'submitted',
            suitabilityProof: {
              coverMessage: 'Available on the requested schedule.',
              availabilityConfirmed: true,
            },
          });
        }
      }

      // Add a couple of notifications
      await Notification.create({
        recipient: harinie._id,
        type: 'completion_submitted',
        title: '📋 Work Proof Submitted for Review',
        message: 'Suresh Patel submitted completion proof for "Post-Renovation 3BHK Deep Cleaning". Review before escrow release.',
        link: '/employer/dashboard',
      });

      await Notification.create({
        recipient: harinie._id,
        type: 'application_received',
        title: 'New Candidate Proposal Received',
        message: 'Anita Rao submitted a proposal for "Weekend Store Assistant & Cashier" (Bid: ₹850)',
        link: '/applications/received',
      });

      console.log(`✓ Data populated successfully for ${harinie.email}`);
    }

    console.log('ALL DONE! Rich dashboard data is ready.');
    process.exit(0);
  } catch (err) {
    console.error('Error populating data:', err);
    process.exit(1);
  }
};

populate();
