const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Gig = require('./models/Gig');
const Service = require('./models/Service');
const Review = require('./models/Review');
const Application = require('./models/Application');
const Notification = require('./models/Notification');
const connectDB = require('./config/db');

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

    console.log('Cleared existing data.');

    const plainPassword = 'password123';

    // Create Sample Users (Bengaluru coordinates)
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
      },
      {
        name: 'Priya Sharma',
        email: 'priya@example.com',
        phone: '+91 9876543211',
        password: plainPassword,
        role: 'customer',
        bio: 'Homeowner in Indiranagar looking for quick local service fixes.',
        location: {
          type: 'Point',
          coordinates: [77.6412, 12.9784], // Indiranagar (~4.8km)
          address: '100ft Road, Indiranagar, Bengaluru',
        },
        address: '100ft Road, Indiranagar, Bengaluru',
        rating: 4.8,
      },
      {
        name: 'Rajesh Verma',
        email: 'rajesh@example.com',
        phone: '+91 9876543212',
        password: plainPassword,
        role: 'worker',
        bio: 'Master Plumber & Pipefitter. Available 24/7 for emergency leaks.',
        skills: ['Plumbing', 'Pipe Fitting', 'Bathroom Fitting', 'Water Heater Repair'],
        experience: 8,
        availability: 'available_now',
        location: {
          type: 'Point',
          coordinates: [77.6245, 12.9352], // Koramangala (~4.5km)
          address: '5th Block, Koramangala, Bengaluru',
        },
        address: '5th Block, Koramangala, Bengaluru',
        rating: 4.7,
      },
      {
        name: 'Kavita Reddy',
        email: 'kavita@example.com',
        phone: '+91 9876543213',
        password: plainPassword,
        role: 'both',
        bio: 'Interior painter and home improvement enthusiast.',
        skills: ['Wall Painting', 'Waterproofing', 'Carpentry Basics'],
        experience: 4,
        availability: 'available_week',
        location: {
          type: 'Point',
          coordinates: [77.6974, 12.9698], // Marathahalli (~11km)
          address: 'Marathahalli Main Road, Bengaluru',
        },
        address: 'Marathahalli Main Road, Bengaluru',
        rating: 4.6,
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
      },
      {
        name: 'Harinie Customer',
        email: 'harinievk@gmail.com',
        phone: '+91 9112233445',
        password: plainPassword,
        role: 'customer',
        bio: 'Active resident hiring local experts for home maintenance.',
        location: {
          type: 'Point',
          coordinates: [77.6412, 12.9784],
          address: 'Indiranagar, Bengaluru',
        },
        address: 'Indiranagar, Bengaluru',
        rating: 4.9,
      },
    ]);

    const arun = users[0];
    const priya = users[1];
    const rajesh = users[2];
    const kavita = users[3];
    const harinieWorker = users[4];

    // Seed Gigs
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
      },
      {
        title: 'Bathroom Leakage & Tap Replacement',
        category: 'Plumbing',
        description: 'Main shower fixture leaking heavily and need 2 new stainless steel taps installed.',
        requiredSkills: ['Plumbing', 'Bathroom Fitting'],
        budgetMin: 600,
        budgetMax: 1200,
        date: 'Tomorrow',
        time: '10:00 AM',
        duration: '3 Hours',
        address: '5th Block Koramangala, Bengaluru',
        location: {
          type: 'Point',
          coordinates: [77.6245, 12.9352],
        },
        postedBy: priya._id,
        numberOfWorkers: 1,
      },
      {
        title: '2-BHK Wall Touch-up & Waterproof Painting',
        category: 'Painting',
        description: 'Living room accent wall touch-up and anti-dampness treatment.',
        requiredSkills: ['Wall Painting', 'Waterproofing'],
        budgetMin: 3000,
        budgetMax: 6000,
        date: 'This Weekend',
        time: '9:00 AM',
        duration: '1 Day',
        address: 'Marathahalli Main Road, Bengaluru',
        location: {
          type: 'Point',
          coordinates: [77.6974, 12.9698],
        },
        postedBy: kavita._id,
        numberOfWorkers: 2,
      },
    ]);

    // Seed Worker Services
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
        title: 'Emergency Plumbing & High-Pressure Jetting',
        category: 'Plumbing',
        description: 'Unclogging drains, leak repair, pump motor replacement, and sanitary fittings.',
        skills: ['Plumbing', 'Pipe Fitting', 'Water Heater Repair'],
        experienceYears: 8,
        startingPrice: 450,
        availability: 'available_now',
        serviceAreaKm: 20,
        address: 'Koramangala, Bengaluru',
        location: {
          type: 'Point',
          coordinates: [77.6245, 12.9352],
        },
        worker: rajesh._id,
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

    // Seed Reviews
    await Review.create([
      {
        reviewer: priya._id,
        fromUser: priya._id,
        targetUser: arun._id,
        toUser: arun._id,
        gig: gigs[0]._id,
        rating: 5,
        comment: 'Arun identified and fixed our short circuit within 40 minutes! Very courteous, brought his own testing gear, and cleaned up after. Highly recommended.',
      },
      {
        reviewer: kavita._id,
        fromUser: kavita._id,
        targetUser: arun._id,
        toUser: arun._id,
        rating: 4.8,
        comment: 'Very skilled and arrived right on schedule. Did a thorough check on all circuit breakers in our apartment.',
      },
      {
        reviewer: priya._id,
        fromUser: priya._id,
        targetUser: harinieWorker._id,
        toUser: harinieWorker._id,
        rating: 5,
        comment: 'Outstanding smart home installation! Super responsive and configured all automation effortlessly.',
      },
    ]);

    // Seed Applications
    await Application.create([
      {
        gig: gigs[0]._id,
        applicant: arun._id,
        proposal: 'I have 6+ years of licensed domestic wiring experience and can fix the issue within 2 hours.',
        proposedRate: 1200,
        estimatedTime: '2 Hours',
        status: 'completed',
      },
      {
        gig: gigs[1]._id,
        applicant: rajesh._id,
        proposal: 'Expert plumber available immediately with all required replacement parts and sealants.',
        proposedRate: 900,
        estimatedTime: '3 Hours',
        status: 'accepted',
      },
    ]);

    // Seed Notifications (Recent Activity)
    await Notification.create([
      {
        recipient: arun._id,
        sender: priya._id,
        type: 'review_received',
        title: 'New 5-Star Review Received',
        message: 'Priya Sharma left a 5-star review for Home Electrical Wiring Repair.',
        read: false,
      },
      {
        recipient: arun._id,
        sender: priya._id,
        type: 'gig_completed',
        title: 'Gig Marked as Completed',
        message: 'Home Electrical Wiring Repair has been successfully completed and approved.',
        read: true,
      },
      {
        recipient: arun._id,
        sender: priya._id,
        type: 'application_accepted',
        title: 'Gig Proposal Accepted',
        message: 'Priya Sharma accepted your proposal for Home Electrical Wiring Repair.',
        read: true,
      },
      {
        recipient: harinieWorker._id,
        sender: priya._id,
        type: 'review_received',
        title: 'New 5-Star Review Received',
        message: 'Priya Sharma left a 5-star review on your Smart Home Setup service.',
        read: false,
      },
    ]);

    console.log('Database successfully seeded with realistic nearby data, reviews, and activity!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
