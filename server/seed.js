const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Gig = require('./models/Gig');
const Service = require('./models/Service');
const Review = require('./models/Review');
const Application = require('./models/Application');
const Notification = require('./models/Notification');
const Earning = require('./models/Earning');
const connectDB = require('./config/db');
const { maskAadhaar, hashAadhaar, generateKycReference } = require('./utils/aadhaarUtils');

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    await User.deleteMany();
    await Gig.deleteMany();
    await Service.deleteMany();
    await Review.deleteMany();
    await Application.deleteMany();
    await Notification.deleteMany();
    await Earning.deleteMany();

    console.log('Cleared existing database records.');

    const plainPassword = 'password123';

    // 1. Create Sample Users with Complete Security, Student, and Employer profiles
    const users = await User.create([
      {
        name: 'Arun Kumar',
        email: 'arun@example.com',
        phone: '+91 9876543210',
        password: plainPassword,
        role: 'worker',
        bio: 'Licensed electrician with 6+ years experience in domestic & commercial wiring.',
        skills: ['Electrical Wiring', 'Appliance Repair', 'Circuit Fixes', 'Lighting'],
        experience: 6,
        availability: 'available_today',
        location: {
          type: 'Point',
          coordinates: [77.5946, 12.9716], // MG Road
          address: 'MG Road, Bengaluru, Karnataka',
        },
        address: 'MG Road, Bengaluru, Karnataka',
        rating: 4.9,
        kycStatus: 'verified',
        maskedAadhaar: maskAadhaar('987654321012'),
        aadhaarHash: hashAadhaar('987654321012'),
        kycReferenceId: generateKycReference(),
        kycVerifiedAt: new Date(),
        phoneVerified: true,
        emailVerified: true,
      },
      {
        name: 'Priya Sharma (TechCorp Facility)',
        email: 'priya@example.com',
        phone: '+91 9876543211',
        password: plainPassword,
        role: 'employer',
        bio: 'Facility manager at TechCorp hiring vetted local talent for workspace & home maintenance.',
        companyName: 'TechCorp Solutions Pvt Ltd',
        companyRegistration: 'CIN-U72200KA2021PTC148890',
        employerStatus: 'VERIFIED',
        employerVerifiedAt: new Date(),
        location: {
          type: 'Point',
          coordinates: [77.6412, 12.9784], // Indiranagar
          address: '100ft Road, Indiranagar, Bengaluru',
        },
        address: '100ft Road, Indiranagar, Bengaluru',
        rating: 4.8,
        phoneVerified: true,
        emailVerified: true,
      },
      {
        name: 'Rahul Verma (Student Worker)',
        email: 'rahul@example.com',
        phone: '+91 9876543212',
        password: plainPassword,
        role: 'student_worker',
        isStudent: true,
        dateOfBirth: new Date('2003-05-14'), // Age 21
        age: 21,
        college: {
          name: 'RV College of Engineering',
          course: 'B.E. Computer Science',
          year: 3,
          rollNumber: '1RV21CS089',
        },
        studentVerificationStatus: 'verified',
        studentVerifiedAt: new Date(),
        guardian: {
          name: 'Suresh Verma',
          phone: '+91 9845012345',
          relationship: 'Father',
          isVerified: true,
          notifiedOnNightGigs: true,
        },
        emergencyContacts: [
          { name: 'Suresh Verma (Father)', phone: '+91 9845012345', relationship: 'Parent' },
        ],
        bio: 'Tech-savvy college student available for smart home setups, PC troubleshooting, and math tutoring.',
        skills: ['Computer Hardware', 'WiFi Setup', 'Math Tutoring', 'App Testing'],
        experience: 2,
        availability: 'available_now',
        location: {
          type: 'Point',
          coordinates: [77.6245, 12.9352], // Koramangala
          address: '5th Block, Koramangala, Bengaluru',
        },
        address: '5th Block, Koramangala, Bengaluru',
        rating: 4.9,
        kycStatus: 'verified',
        maskedAadhaar: maskAadhaar('543210987654'),
        aadhaarHash: hashAadhaar('543210987654'),
        kycReferenceId: generateKycReference(),
        kycVerifiedAt: new Date(),
        phoneVerified: true,
        emailVerified: true,
      },
      {
        name: 'Admin Security Team',
        email: 'admin@nearbygigs.com',
        phone: '+91 9000000001',
        password: plainPassword,
        role: 'admin',
        bio: 'NearbyGigs Safety Operations and Trust Enforcement Team.',
        location: {
          type: 'Point',
          coordinates: [77.5946, 12.9716],
          address: 'NearbyGigs HQ, Bengaluru',
        },
        address: 'NearbyGigs HQ, Bengaluru',
        rating: 5.0,
        kycStatus: 'verified',
        phoneVerified: true,
        emailVerified: true,
      },
      {
        name: 'Harinie V K',
        email: 'vkharinie@gmail.com',
        phone: '+91 9443322110',
        password: plainPassword,
        role: 'worker',
        bio: 'Full-stack developer & freelance UI specialist offering tech support and smart home automation.',
        skills: ['Smart Home Setup', 'WiFi & Network Config', 'Technical Support', 'Appliance Setup'],
        experience: 3,
        availability: 'available_now',
        location: {
          type: 'Point',
          coordinates: [77.5946, 12.9716],
          address: 'Brigade Road, Bengaluru',
        },
        address: 'Brigade Road, Bengaluru',
        rating: 5.0,
        kycStatus: 'verified',
        maskedAadhaar: maskAadhaar('987612345678'),
        aadhaarHash: hashAadhaar('987612345678'),
        kycReferenceId: generateKycReference(),
        kycVerifiedAt: new Date(),
        phoneVerified: true,
        emailVerified: true,
      },
    ]);

    const arun = users[0];
    const priya = users[1];
    const rahul = users[2];
    const admin = users[3];
    const harinieWorker = users[4];

    // 2. Seed Gigs (including standard gigs and Night Work gigs)
    const gigs = await Gig.create([
      {
        title: 'Home Electrical Wiring Repair Needed',
        category: 'Electrical',
        description: 'Short circuit issue in main living room distribution board. Needs urgent inspection and fix.',
        requiredSkills: ['Electrical Wiring', 'Circuit Fixes'],
        budgetMin: 800,
        budgetMax: 1500,
        date: 'Today',
        time: '2:00 PM',
        duration: '2 Hours',
        address: '100ft Road, Indiranagar, Bengaluru',
        location: {
          type: 'Point',
          coordinates: [77.6412, 12.9784],
        },
        postedBy: priya._id,
        assignedTo: arun._id,
        status: 'completed',
        numberOfWorkers: 1,
        isNightGig: false,
        isStudentEligible: true,
        minimumAge: 18,
        safetyRating: 5.0,
      },
      {
        title: 'Server Room Urgent Overnight Cable Routing',
        category: 'Technology',
        description: 'Late night network cable re-patching and rack organization for office data center.',
        requiredSkills: ['WiFi Setup', 'Computer Hardware'],
        budgetMin: 1800,
        budgetMax: 3000,
        date: 'Tonight',
        time: '10:30 PM',
        duration: '3 Hours',
        address: 'Indiranagar Tech Park, Bengaluru',
        location: {
          type: 'Point',
          coordinates: [77.6412, 12.9784],
        },
        postedBy: priya._id,
        status: 'open',
        numberOfWorkers: 1,
        isNightGig: true, // Night Gig Trigger
        isStudentEligible: true,
        minimumAge: 18,
        safetyRating: 4.9,
      },
      {
        title: 'Smart Home Automation & Alexa Voice Hub Setup',
        category: 'Technology',
        description: 'Need assistance setting up 6 smart lighting switches and connecting them to voice hub.',
        requiredSkills: ['Smart Home Setup', 'WiFi & Network Config'],
        budgetMin: 1200,
        budgetMax: 2200,
        date: 'Tomorrow',
        time: '11:00 AM',
        duration: '2 Hours',
        address: '5th Block Koramangala, Bengaluru',
        location: {
          type: 'Point',
          coordinates: [77.6245, 12.9352],
        },
        postedBy: priya._id,
        status: 'open',
        numberOfWorkers: 1,
        isNightGig: false,
        isStudentEligible: true,
        minimumAge: 18,
        safetyRating: 5.0,
      },
    ]);

    // 3. Seed Worker Services
    await Service.create([
      {
        title: 'Express Electrical Repair & Appliance Setup',
        category: 'Electrical',
        description: 'Quick electrical fixes, ceiling fan installation, AC switch wiring and fuse repair.',
        skills: ['Electrical Wiring', 'Appliance Repair', 'Lighting'],
        experienceYears: 6,
        startingPrice: 500,
        availability: 'available_today',
        serviceAreaKm: 15,
        address: 'MG Road, Bengaluru',
        location: {
          type: 'Point',
          coordinates: [77.5946, 12.9716],
        },
        worker: arun._id,
      },
      {
        title: 'Student Tech Support & Smart Home Configuration',
        category: 'Technology',
        description: 'Friendly student technician for PC troubleshooting, WiFi mesh setup, and homework tutoring.',
        skills: ['Computer Hardware', 'WiFi Setup', 'Math Tutoring'],
        experienceYears: 2,
        startingPrice: 400,
        availability: 'available_now',
        serviceAreaKm: 15,
        address: 'Koramangala, Bengaluru',
        location: {
          type: 'Point',
          coordinates: [77.6245, 12.9352],
        },
        worker: rahul._id,
      },
      {
        title: 'Smart Home Hub & WiFi Automation Setup',
        category: 'Technology',
        description: 'End-to-end setup of smart switches, Alexa/Google Home routines, and mesh WiFi coverage.',
        skills: ['Smart Home Setup', 'WiFi & Network Config', 'Technical Support'],
        experienceYears: 3,
        startingPrice: 800,
        availability: 'available_now',
        serviceAreaKm: 25,
        address: 'Brigade Road, Bengaluru',
        location: {
          type: 'Point',
          coordinates: [77.5946, 12.9716],
        },
        worker: harinieWorker._id,
      },
    ]);

    // 4. Seed Applications & Earnings
    const app1 = await Application.create({
      gig: gigs[0]._id,
      applicant: arun._id,
      proposal: 'Licensed domestic wiring expert available immediately with all safety equipment.',
      proposedRate: 1200,
      estimatedTime: '2 Hours',
      status: 'completed',
    });

    await Earning.create({
      worker: arun._id,
      employer: priya._id,
      gig: gigs[0]._id,
      title: 'Home Electrical Wiring Repair Needed',
      amount: 1200,
      hoursWorked: 2,
      payoutStatus: 'paid',
      paymentDate: new Date(),
      escrowReleasedAt: new Date(),
    });

    // 5. Seed Reviews
    await Review.create([
      {
        reviewer: priya._id,
        fromUser: priya._id,
        targetUser: arun._id,
        toUser: arun._id,
        gig: gigs[0]._id,
        rating: 5,
        comment: 'Arun identified and fixed our short circuit within 40 minutes! Very courteous, brought safety testing gear, and cleaned up after.',
      },
      {
        reviewer: priya._id,
        fromUser: priya._id,
        targetUser: rahul._id,
        toUser: rahul._id,
        rating: 5,
        comment: 'Rahul is a fantastic student worker. Set up our mesh network flawlessly and explained how everything works.',
      },
    ]);

    // 6. Seed Safety Notifications
    await Notification.create([
      {
        recipient: arun._id,
        sender: priya._id,
        type: 'review_received',
        title: '⭐️ 5-Star Review Received',
        message: 'Priya Sharma (TechCorp) left a 5-star review for Home Electrical Wiring Repair.',
        read: false,
      },
      {
        recipient: rahul._id,
        type: 'system',
        title: '🛡 Student Safety Verification Active',
        message: 'Your student enrollment at RV College of Engineering and Guardian Suresh Verma are fully verified.',
        read: false,
      },
      {
        recipient: rahul._id,
        type: 'system',
        title: '🌙 Night Work Radar Ready',
        message: 'You have access to verified night gigs. Guardian notifications will trigger automatically upon assignment.',
        read: false,
      },
    ]);

    console.log('Database successfully seeded with realistic verified users, students, employers, gigs, and financial ledger!');
    return true;
  } catch (error) {
    console.error('Error seeding data:', error);
    return false;
  }
};

const seedInitialDataIfEmpty = async () => {
  try {
    const gigCount = await Gig.countDocuments();
    if (gigCount === 0) {
      console.log('Detected empty database. Auto-seeding initial marketplace data...');
      await seedData();
    }
  } catch (err) {
    console.warn('Auto-seed check notice:', err.message);
  }
};

if (require.main === module) {
  seedData().then((ok) => process.exit(ok ? 0 : 1));
}

module.exports = { seedData, seedInitialDataIfEmpty };
