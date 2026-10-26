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

    // 1. Create Sample Users (Workers, Employers, Students, Admins)
    const users = await User.create([
      {
        name: 'Arun Kumar',
        email: 'arun@example.com',
        phone: '+91 9876543210',
        password: plainPassword,
        role: 'worker',
        purpose: 'find_work',
        userType: 'professional',
        bio: 'Licensed electrician with 6+ years experience in domestic & commercial wiring.',
        skills: ['Electrical Wiring', 'Appliance Repair', 'Circuit Fixes', 'Lighting'],
        experience: 6,
        availability: 'available_today',
        location: {
          type: 'Point',
          coordinates: [77.5946, 12.9716], // MG Road, Bengaluru
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
        onboardingCompleted: true,
      },
      {
        name: 'Priya Sharma (TechCorp Facility)',
        email: 'priya@example.com',
        phone: '+91 9876543211',
        password: plainPassword,
        role: 'employer',
        purpose: 'post_jobs',
        userType: 'employer',
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
        onboardingCompleted: true,
        phoneVerified: true,
        emailVerified: true,
      },
      {
        name: 'Rahul Verma (Student Worker)',
        email: 'rahul@example.com',
        phone: '+91 9876543212',
        password: plainPassword,
        role: 'student_worker',
        purpose: 'find_work',
        userType: 'college_student',
        isStudent: true,
        dateOfBirth: new Date('2003-05-14'),
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
        onboardingCompleted: true,
      },
      {
        name: 'Harinie V K',
        email: 'vkharinie@gmail.com',
        phone: '+91 9443322110',
        password: plainPassword,
        role: 'worker',
        purpose: 'find_work',
        userType: 'professional',
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
        onboardingCompleted: true,
      },
      {
        name: 'Suresh Patel (Master Plumber)',
        email: 'suresh@example.com',
        phone: '+91 9876543214',
        password: plainPassword,
        role: 'worker',
        purpose: 'find_work',
        userType: 'professional',
        bio: 'Certified master plumber for residential pipe installation, leakage repairs, and sanitary fitting.',
        skills: ['Pipe Fitting', 'Leak Detection', 'Drainage Unclogging', 'Water Tank Cleaning'],
        experience: 8,
        availability: 'available_today',
        location: {
          type: 'Point',
          coordinates: [77.6322, 12.9121], // HSR Layout
          address: 'Sector 3, HSR Layout, Bengaluru',
        },
        address: 'Sector 3, HSR Layout, Bengaluru',
        rating: 4.8,
        kycStatus: 'verified',
        maskedAadhaar: maskAadhaar('987600112233'),
        aadhaarHash: hashAadhaar('987600112233'),
        kycReferenceId: generateKycReference(),
        kycVerifiedAt: new Date(),
        phoneVerified: true,
        emailVerified: true,
        onboardingCompleted: true,
      },
      {
        name: 'Anita Rao (ColorCraft)',
        email: 'anita@example.com',
        phone: '+91 9876543215',
        password: plainPassword,
        role: 'worker',
        purpose: 'find_work',
        userType: 'professional',
        bio: 'Professional interior and exterior painter specializing in texture design and waterproof coatings.',
        skills: ['Wall Painting', 'Waterproofing', 'Texture Design', 'Wood Staining'],
        experience: 5,
        availability: 'available_now',
        location: {
          type: 'Point',
          coordinates: [77.5833, 12.9299], // Jayanagar
          address: '4th Block, Jayanagar, Bengaluru',
        },
        address: '4th Block, Jayanagar, Bengaluru',
        rating: 4.9,
        kycStatus: 'verified',
        maskedAadhaar: maskAadhaar('987644556677'),
        aadhaarHash: hashAadhaar('987644556677'),
        kycReferenceId: generateKycReference(),
        kycVerifiedAt: new Date(),
        phoneVerified: true,
        emailVerified: true,
        onboardingCompleted: true,
      },
      {
        name: 'Rajesh Sharma (WoodWorks)',
        email: 'rajesh@example.com',
        phone: '+91 9876543216',
        password: plainPassword,
        role: 'worker',
        purpose: 'find_work',
        userType: 'professional',
        bio: 'Custom modular woodwork, lock replacement, door hinges, and ergonomic office furniture assembly.',
        skills: ['Woodwork', 'Furniture Assembly', 'Lock Repair', 'Cabinet Fitting'],
        experience: 7,
        availability: 'available_today',
        location: {
          type: 'Point',
          coordinates: [77.5684, 13.0031], // Malleshwaram
          address: '8th Cross, Malleshwaram, Bengaluru',
        },
        address: '8th Cross, Malleshwaram, Bengaluru',
        rating: 4.8,
        kycStatus: 'verified',
        maskedAadhaar: maskAadhaar('987677889900'),
        aadhaarHash: hashAadhaar('987677889900'),
        kycReferenceId: generateKycReference(),
        kycVerifiedAt: new Date(),
        phoneVerified: true,
        emailVerified: true,
        onboardingCompleted: true,
      },
      {
        name: 'Meera Nair (SparkleClean)',
        email: 'meera@example.com',
        phone: '+91 9876543217',
        password: plainPassword,
        role: 'worker',
        purpose: 'find_work',
        userType: 'professional',
        bio: 'Eco-friendly deep cleaning specialist with industrial steaming and sanitization equipment.',
        skills: ['Deep Cleaning', 'Sanitization', 'Kitchen Degreasing', 'Carpet Wash'],
        experience: 4,
        availability: 'available_now',
        location: {
          type: 'Point',
          coordinates: [77.6080, 12.9750], // Richmond Town
          address: 'Richmond Town, Bengaluru',
        },
        address: 'Richmond Town, Bengaluru',
        rating: 4.9,
        kycStatus: 'verified',
        maskedAadhaar: maskAadhaar('987633221100'),
        aadhaarHash: hashAadhaar('987633221100'),
        kycReferenceId: generateKycReference(),
        kycVerifiedAt: new Date(),
        phoneVerified: true,
        emailVerified: true,
        onboardingCompleted: true,
      },
      {
        name: 'Vikram Seth (Urban Estates)',
        email: 'vikram@example.com',
        phone: '+91 9876543218',
        password: plainPassword,
        role: 'employer',
        purpose: 'post_jobs',
        userType: 'employer',
        bio: 'Property and facility management director for luxury residential complexes across Bengaluru.',
        companyName: 'Urban Estates Property Management',
        companyRegistration: 'CIN-U70100KA2020PTC139940',
        employerStatus: 'VERIFIED',
        employerVerifiedAt: new Date(),
        location: {
          type: 'Point',
          coordinates: [77.6322, 12.9121], // HSR Layout
          address: 'Urban Heights, HSR Layout, Bengaluru',
        },
        address: 'Urban Heights, HSR Layout, Bengaluru',
        rating: 4.9,
        onboardingCompleted: true,
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
    ]);

    const arun = users[0];
    const priya = users[1];
    const rahul = users[2];
    const harinieWorker = users[3];
    const suresh = users[4];
    const anita = users[5];
    const rajesh = users[6];
    const meera = users[7];
    const vikram = users[8];
    const admin = users[9];

    // 2. Seed Gigs across ALL categories with realistic budgets and locations
    const gigs = await Gig.create([
      {
        title: 'Emergency Distribution Box & Circuit Breaker Repair',
        category: 'Electrical',
        description: 'Main MCB tripping repeatedly under load. Immediate troubleshooting of distribution board needed.',
        requiredSkills: ['Electrical Wiring', 'Circuit Fixes', 'Appliance Repair'],
        budgetMin: 1200,
        budgetMax: 2000,
        date: 'Today',
        time: '4:00 PM',
        duration: '2 Hours',
        address: 'Indiranagar 100ft Road, Bengaluru',
        location: {
          type: 'Point',
          coordinates: [77.6412, 12.9784],
        },
        postedBy: priya._id,
        assignedTo: arun._id,
        status: 'open',
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
        isNightGig: true,
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
      {
        title: 'Kitchen Sink Pipe Burst & Drainage Overhaul',
        category: 'Plumbing',
        description: 'Under-sink pipe joint ruptured causing leakage. Requires replacement PVC joints and sealing.',
        requiredSkills: ['Pipe Fitting', 'Leak Detection'],
        budgetMin: 1000,
        budgetMax: 1800,
        date: 'Today',
        time: '1:00 PM',
        duration: '2 Hours',
        address: 'Sector 3, HSR Layout, Bengaluru',
        location: {
          type: 'Point',
          coordinates: [77.6322, 12.9121],
        },
        postedBy: vikram._id,
        status: 'open',
        numberOfWorkers: 1,
        isNightGig: false,
        isStudentEligible: true,
        minimumAge: 18,
        safetyRating: 4.8,
      },
      {
        title: 'Full Living Room Texture Wall Painting & Waterproofing',
        category: 'Painting',
        description: 'Accent wall texturing (Royal Play pattern) and primer coat application for 14x20ft living room.',
        requiredSkills: ['Wall Painting', 'Texture Design', 'Waterproofing'],
        budgetMin: 4500,
        budgetMax: 8500,
        date: 'This Weekend',
        time: '9:00 AM',
        duration: '8 Hours',
        address: '4th Block Jayanagar, Bengaluru',
        location: {
          type: 'Point',
          coordinates: [77.5833, 12.9299],
        },
        postedBy: vikram._id,
        status: 'open',
        numberOfWorkers: 2,
        isNightGig: false,
        isStudentEligible: true,
        minimumAge: 18,
        safetyRating: 5.0,
      },
      {
        title: 'Modular Kitchen Cabinet Hinge Alignment & Wood Polish',
        category: 'Carpentry',
        description: 'Hydraulic soft-close hinges readjustment on 8 kitchen overhead shutters and dining table polish.',
        requiredSkills: ['Woodwork', 'Cabinet Fitting'],
        budgetMin: 1400,
        budgetMax: 2400,
        date: 'Tomorrow',
        time: '3:00 PM',
        duration: '3 Hours',
        address: '8th Cross, Malleshwaram, Bengaluru',
        location: {
          type: 'Point',
          coordinates: [77.5684, 13.0031],
        },
        postedBy: vikram._id,
        status: 'open',
        numberOfWorkers: 1,
        isNightGig: false,
        isStudentEligible: true,
        minimumAge: 18,
        safetyRating: 4.9,
      },
      {
        title: 'Post-Renovation 3BHK Deep Cleaning & Sanitization',
        category: 'Cleaning',
        description: 'Comprehensive scrub and dust removal from tiles, glass balustrades, bathrooms and kitchen grease.',
        requiredSkills: ['Deep Cleaning', 'Sanitization', 'Kitchen Degreasing'],
        budgetMin: 2800,
        budgetMax: 4800,
        date: 'Saturday',
        time: '10:00 AM',
        duration: '5 Hours',
        address: 'Richmond Town, Bengaluru',
        location: {
          type: 'Point',
          coordinates: [77.6080, 12.9750],
        },
        postedBy: priya._id,
        status: 'open',
        numberOfWorkers: 2,
        isNightGig: false,
        isStudentEligible: true,
        minimumAge: 18,
        safetyRating: 5.0,
      },
      {
        title: 'Home Electrical Wiring Repair Needed',
        category: 'Electrical',
        description: 'Short circuit issue in main living room distribution board. Needs urgent inspection and fix.',
        requiredSkills: ['Electrical Wiring', 'Circuit Fixes'],
        budgetMin: 800,
        budgetMax: 1500,
        date: 'Yesterday',
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
    ]);

    // 3. Seed Worker Services (Specialists)
    await Service.create([
      {
        title: 'Express Electrical Repair & Appliance Setup',
        category: 'Electrical',
        description: 'Quick electrical fixes, ceiling fan installation, AC switch wiring and fuse repair.',
        skills: ['Electrical Wiring', 'Appliance Repair', 'Lighting'],
        experienceYears: 6,
        startingPrice: 500,
        availability: 'available_today',
        serviceAreaKm: 25,
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
        serviceAreaKm: 20,
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
      {
        title: 'Fast Leak Detection & Sanitary Plumbing Repairs',
        category: 'Plumbing',
        description: 'Leak detection, kitchen sink siphon overhaul, mixer faucet repairs, and flush tank restoration.',
        skills: ['Pipe Fitting', 'Leak Detection', 'Drainage Unclogging'],
        experienceYears: 8,
        startingPrice: 450,
        availability: 'available_today',
        serviceAreaKm: 25,
        address: 'Sector 3, HSR Layout, Bengaluru',
        location: {
          type: 'Point',
          coordinates: [77.6322, 12.9121],
        },
        worker: suresh._id,
      },
      {
        title: 'Interior Wall Painting & Water Damaged Patching',
        category: 'Painting',
        description: 'Premium washable wall paints, ceiling water stain repairs, and bespoke stenciled accent walls.',
        skills: ['Wall Painting', 'Waterproofing', 'Texture Design'],
        experienceYears: 5,
        startingPrice: 600,
        availability: 'available_now',
        serviceAreaKm: 30,
        address: '4th Block, Jayanagar, Bengaluru',
        location: {
          type: 'Point',
          coordinates: [77.5833, 12.9299],
        },
        worker: anita._id,
      },
      {
        title: 'Custom Woodwork & Furniture Assembly',
        category: 'Carpentry',
        description: 'IKEA and urban ladder furniture assembly, door sag rectification, and custom shoe racks.',
        skills: ['Woodwork', 'Furniture Assembly', 'Cabinet Fitting'],
        experienceYears: 7,
        startingPrice: 550,
        availability: 'available_today',
        serviceAreaKm: 20,
        address: '8th Cross, Malleshwaram, Bengaluru',
        location: {
          type: 'Point',
          coordinates: [77.5684, 13.0031],
        },
        worker: rajesh._id,
      },
      {
        title: 'Eco-Friendly Deep Home Cleaning & Disinfection',
        category: 'Cleaning',
        description: 'Non-toxic hospital-grade sanitization, steam carpet cleaning, and kitchen chimney degreasing.',
        skills: ['Deep Cleaning', 'Sanitization', 'Kitchen Degreasing'],
        experienceYears: 4,
        startingPrice: 700,
        availability: 'available_now',
        serviceAreaKm: 25,
        address: 'Richmond Town, Bengaluru',
        location: {
          type: 'Point',
          coordinates: [77.6080, 12.9750],
        },
        worker: meera._id,
      },
    ]);

    // 4. Seed Applications for Arun & others
    // Application 1: Arun's completed job
    await Application.create({
      gig: gigs[7]._id,
      applicant: arun._id,
      proposal: 'Licensed domestic wiring expert available immediately with all safety equipment.',
      proposedRate: 1500,
      estimatedTime: '2 Hours',
      status: 'completed',
      commitment: {
        status: 'completed',
        workerConfirmedAt: new Date(Date.now() - 86400000),
      },
      attendance: {
        status: 'completed',
        checkInTime: new Date(Date.now() - 86400000),
        checkOutTime: new Date(Date.now() - 79200000),
      },
      payment: {
        amount: 1500,
        status: 'paid',
        paidAt: new Date(),
      },
    });

    // Application 2: Arun's active confirmed assignment with Escrow
    await Application.create({
      gig: gigs[0]._id,
      applicant: arun._id,
      proposal: 'I can inspect the main MCB and distribution board this afternoon with high-voltage testing equipment.',
      proposedRate: 1800,
      estimatedTime: '2 Hours',
      status: 'accepted',
      commitment: {
        status: 'confirmed',
        workerConfirmedAt: new Date(),
        workerConfirmationNotes: 'Ready to arrive with full safety kit and replacement breakers.',
      },
      attendance: {
        method: 'otp',
        status: 'checkin_pending',
      },
      payment: {
        amount: 1800,
        status: 'payment_pending',
      },
    });

    // Application 3: Arun's submitted proposal under review
    await Application.create({
      gig: gigs[1]._id,
      applicant: arun._id,
      proposal: 'Experienced with structured Cat6 cabling, server rack cable managers, and certified patch panel punch-downs.',
      proposedRate: 2200,
      estimatedTime: '3 Hours',
      status: 'submitted',
      commitment: {
        status: 'not_applicable',
      },
    });

    // Application 4: Rahul's submitted proposal
    await Application.create({
      gig: gigs[2]._id,
      applicant: rahul._id,
      proposal: 'I have set up multi-room Alexa and SmartLife smart switches in 12 homes across Koramangala.',
      proposedRate: 1600,
      estimatedTime: '2 Hours',
      status: 'submitted',
      commitment: {
        status: 'not_applicable',
      },
    });

    // Application 5: Suresh's proposal for pipe burst
    await Application.create({
      gig: gigs[3]._id,
      applicant: suresh._id,
      proposal: 'Can reach within 30 minutes with CPVC joints, thread seal tape, and pressure test pump.',
      proposedRate: 1200,
      estimatedTime: '1.5 Hours',
      status: 'submitted',
    });

    // 5. Seed Financial Ledger (Earnings for Arun)
    await Earning.create([
      {
        worker: arun._id,
        employer: priya._id,
        gig: gigs[7]._id,
        title: 'Home Electrical Wiring Repair Needed',
        amount: 1500,
        hoursWorked: 2,
        payoutStatus: 'paid',
        paymentDate: new Date(),
        escrowReleasedAt: new Date(),
      },
      {
        worker: arun._id,
        employer: priya._id,
        gig: gigs[0]._id,
        title: 'Emergency Distribution Box & Circuit Breaker Repair',
        amount: 1800,
        hoursWorked: 2,
        payoutStatus: 'escrow_held',
      },
    ]);

    // 6. Seed Reviews
    await Review.create([
      {
        reviewer: priya._id,
        fromUser: priya._id,
        targetUser: arun._id,
        toUser: arun._id,
        gig: gigs[7]._id,
        rating: 5,
        comment: 'Arun identified and fixed our short circuit within 40 minutes! Very courteous, brought safety testing gear, and cleaned up after.',
      },
      {
        reviewer: vikram._id,
        fromUser: vikram._id,
        targetUser: arun._id,
        toUser: arun._id,
        rating: 5,
        comment: 'Top-tier master electrician. Fixed our apartment complex basement motor starter switch effortlessly.',
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

    // 7. Seed Notifications
    await Notification.create([
      {
        recipient: arun._id,
        sender: priya._id,
        type: 'application_accepted',
        title: '🎉 Application Accepted & Escrow Funded!',
        message: 'Priya Sharma approved your bid for "Emergency Distribution Box & Circuit Breaker Repair". ₹1,800 is locked in escrow.',
        read: false,
      },
      {
        recipient: arun._id,
        sender: priya._id,
        type: 'payment_status_changed',
        title: '💰 ₹1,500 Payout Released',
        message: 'Payment of ₹1,500 for "Home Electrical Wiring Repair Needed" has been successfully credited to your verified account.',
        read: true,
      },
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
    ]);

    console.log('Database successfully seeded with comprehensive verified users, gigs, specialists, applications, and financial ledger!');
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
