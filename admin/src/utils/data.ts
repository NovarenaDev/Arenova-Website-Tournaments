import type { Customer, Coach, Booking, Payment, Payout, Review, Sport, AdminUser } from '../types';

export const mockCustomers: Customer[] = [
  { id:'U001', firstName:'Arun',   lastName:'Kumar',  email:'arun@email.com',  phone:'+91 98765 43210', role:'parent',     children:2, walletCredits:120, bookings:14, status:'active',    joined:'Jan 2026', lastActive:'Apr 13, 2026', address:{ line1:'12, Sunshine Apartments', line2:'Near KPHB Metro', city:'Hyderabad', state:'Telangana', pincode:'500072' } },
  { id:'U002', firstName:'Priya',  lastName:'Reddy',  email:'priya@email.com', phone:'+91 98765 43211', role:'individual', children:0, walletCredits:240, bookings:8,  status:'active',    joined:'Feb 2026', lastActive:'Apr 12, 2026', address:{ line1:'Flat 4B, Green Towers', city:'Hyderabad', state:'Telangana', pincode:'500034' } },
  { id:'U003', firstName:'Neha',   lastName:'Das',    email:'neha@email.com',  phone:'+91 98765 43212', role:'parent',     children:1, walletCredits:0,   bookings:3,  status:'flagged',   joined:'Mar 2026', lastActive:'Mar 20, 2026', address:{ line1:'23, Rose Garden Colony', city:'Hyderabad', state:'Telangana', pincode:'500081' } },
  { id:'U004', firstName:'Kiran',  lastName:'Joshi',  email:'kiran@email.com', phone:'+91 98765 43213', role:'individual', children:0, walletCredits:50,  bookings:6,  status:'active',    joined:'Feb 2026', lastActive:'Apr 10, 2026', address:{ line1:'Plot 7, Rajiv Nagar', city:'Hyderabad', state:'Telangana', pincode:'500044' } },
  { id:'U005', firstName:'Dev',    lastName:'Patel',  email:'dev@email.com',   phone:'+91 98765 43214', role:'parent',     children:1, walletCredits:300, bookings:11, status:'active',    joined:'Dec 2025', lastActive:'Apr 13, 2026', address:{ line1:'8-2-120, Jubilee Hills', city:'Hyderabad', state:'Telangana', pincode:'500033' } },
  { id:'U006', firstName:'Amara',  lastName:'Singh',  email:'amara@email.com', phone:'+91 98765 43215', role:'individual', children:0, walletCredits:180, bookings:5,  status:'active',    joined:'Mar 2026', lastActive:'Apr 11, 2026', address:{ line1:'Flat 201, Serene Heights', city:'Hyderabad', state:'Telangana', pincode:'500049' } },
  { id:'U007', firstName:'Rohit',  lastName:'Nair',   email:'rohit@email.com', phone:'+91 98765 43216', role:'individual', children:0, walletCredits:0,   bookings:2,  status:'suspended', joined:'Jan 2026', lastActive:'Feb 5, 2026',  address:{ line1:'14, Laxmi Nagar', city:'Hyderabad', state:'Telangana', pincode:'500058' } },
  { id:'U008', firstName:'Sneha',  lastName:'Gupta',  email:'sneha@email.com', phone:'+91 98765 43217', role:'parent',     children:3, walletCredits:90,  bookings:9,  status:'active',    joined:'Nov 2025', lastActive:'Apr 13, 2026', address:{ line1:'H.No 5-9-82, Banjara Hills', city:'Hyderabad', state:'Telangana', pincode:'500034' } },
];

export const mockCoaches: Coach[] = [
  {
    id:'C001', name:'Ravi Sharma',   email:'ravi@coach.com',   phone:'+91 98400 00001', sports:['Cricket','Football'],
    rating:4.9, sessions:312, grossEarnings:93600, netEarnings:74880, pendingPayout:4200, kyc:'approved', noShows:0, isActive:true, joined:'Jan 2026',
    requestedIndividualPrice: 600, requestedGroupPricePerPerson: 250, individualPrice: 600, groupPricePerPerson: 250,
    bio:'Former Ranji Trophy cricketer with 12 years of coaching experience. I specialize in batting techniques and youth development.',
    description:'I offer structured coaching sessions for beginners to advanced players. My sessions include warm-up drills, skill training, match simulation and cool-down. I focus on building fundamentals while making sessions fun and engaging.',
    experience: 12,
    address:{ line1:'Plot 22, Coach Colony', line2:'Near Sports Complex', city:'Hyderabad', state:'Telangana', pincode:'500032' },
    availability:[
      { day:'Monday',    startTime:'6:00 AM',  endTime:'9:00 AM'  },
      { day:'Wednesday', startTime:'6:00 AM',  endTime:'9:00 AM'  },
      { day:'Friday',    startTime:'6:00 AM',  endTime:'9:00 AM'  },
      { day:'Saturday',  startTime:'7:00 AM',  endTime:'12:00 PM' },
      { day:'Sunday',    startTime:'7:00 AM',  endTime:'11:00 AM' },
    ],
  },
  {
    id:'C002', name:'Meena Tiwari',  email:'meena@coach.com',  phone:'+91 98400 00002', sports:['Tennis','Badminton'],
    rating:4.7, sessions:198, grossEarnings:59400, netEarnings:47520, pendingPayout:8000, kyc:'approved', noShows:0, isActive:true, joined:'Jan 2026',
    individualPrice: 800, groupPricePerPerson: 350,
    bio:'AITA Certified Tennis Coach and National Badminton Player. Passionate about developing young talent.',
    description:'My coaching approach is player-centric. I assess each student individually and tailor drills to their skill level. I specialize in footwork, grip correction and match strategy for both tennis and badminton.',
    experience: 8,
    address:{ line1:'Flat 3A, Greenview Apartments', city:'Hyderabad', state:'Telangana', pincode:'500034' },
    availability:[
      { day:'Tuesday',   startTime:'7:00 AM',  endTime:'10:00 AM' },
      { day:'Thursday',  startTime:'7:00 AM',  endTime:'10:00 AM' },
      { day:'Saturday',  startTime:'8:00 AM',  endTime:'1:00 PM'  },
    ],
  },
  {
    id:'C003', name:'Raj Patel',     email:'raj@coach.com',    phone:'+91 98400 00003', sports:['Football'],
    rating:4.2, sessions:88,  grossEarnings:26400, netEarnings:21120, pendingPayout:21120, kyc:'pending', noShows:2, isActive:true, joined:'Feb 2026',
    requestedIndividualPrice: 500, requestedGroupPricePerPerson: 200,
    bio:'Former district-level football player. Trained under UEFA C licence coaches.',
    description:'Focus on position-specific training, team tactics and physical conditioning. Sessions suitable for age groups 8–30.',
    experience: 5,
    address:{ line1:'H.No 8-2-293, Banjara Hills', city:'Hyderabad', state:'Telangana', pincode:'500033' },
    availability:[
      { day:'Monday',    startTime:'5:30 PM', endTime:'8:00 PM' },
      { day:'Wednesday', startTime:'5:30 PM', endTime:'8:00 PM' },
      { day:'Friday',    startTime:'5:30 PM', endTime:'8:00 PM' },
      { day:'Sunday',    startTime:'6:00 AM', endTime:'9:00 AM' },
    ],
  },
  {
    id:'C004', name:'Anita Verma',   email:'anita@coach.com',  phone:'+91 98400 00004', sports:['Badminton','Swimming'],
    rating:4.8, sessions:224, grossEarnings:67200, netEarnings:53760, pendingPayout:5100, kyc:'approved', noShows:0, isActive:true, joined:'Jan 2026',
    bio:'National-level badminton player and certified swimming instructor with 10 years experience.',
    description:'I combine technical coaching with fitness training. Badminton sessions cover smash, drop shots and net play. Swimming covers freestyle, breaststroke and butterfly for all ages.',
    experience: 10,
    address:{ line1:'12-13, Kondapur Main Road', city:'Hyderabad', state:'Telangana', pincode:'500084' },
    availability:[
      { day:'Monday',    startTime:'6:00 AM',  endTime:'8:00 AM'  },
      { day:'Tuesday',   startTime:'6:00 AM',  endTime:'8:00 AM'  },
      { day:'Thursday',  startTime:'6:00 AM',  endTime:'8:00 AM'  },
      { day:'Saturday',  startTime:'6:00 AM',  endTime:'11:00 AM' },
    ],
  },
  {
    id:'C005', name:'Sunil Kumar',   email:'sunil@coach.com',  phone:'+91 98400 00005', sports:['Swimming'],
    rating:4.5, sessions:140, grossEarnings:42000, netEarnings:33600, pendingPayout:33600, kyc:'pending', noShows:0, isActive:true, joined:'Feb 2026',
    bio:'RLSS certified lifeguard and swimming coach. Specialist in teaching beginners.',
    description:'Patient and encouraging coaching style. I work with complete beginners through to competitive swimmers. Water safety is always my first priority.',
    experience: 6,
    address:{ line1:'Flat 11, Sapphire Block', line2:'Manjeera Residency', city:'Hyderabad', state:'Telangana', pincode:'500072' },
    availability:[
      { day:'Wednesday', startTime:'6:00 AM', endTime:'9:00 AM'  },
      { day:'Friday',    startTime:'6:00 AM', endTime:'9:00 AM'  },
      { day:'Sunday',    startTime:'7:00 AM', endTime:'12:00 PM' },
    ],
  },
  {
    id:'C006', name:'Priya Menon',   email:'priya@coach.com',  phone:'+91 98400 00006', sports:['Tennis'],
    rating:4.3, sessions:62,  grossEarnings:18600, netEarnings:14880, pendingPayout:14880, kyc:'rejected', noShows:1, isActive:false, joined:'Mar 2026',
    bio:'3 years coaching experience, currently resolving KYC documentation issues.',
    description:'Beginner-friendly tennis coaching focusing on grip, stance and serve fundamentals.',
    experience: 3,
    address:{ line1:'22, Madhapur Lane', city:'Hyderabad', state:'Telangana', pincode:'500081' },
    availability:[],
  },
  {
    id:'C007', name:'Arjun Mehta',   email:'arjun@coach.com',  phone:'+91 98400 00007', sports:['Basketball'],
    rating:4.1, sessions:44,  grossEarnings:13200, netEarnings:10560, pendingPayout:0, kyc:'under_review', noShows:0, isActive:true, joined:'Mar 2026',
    bio:'State-level basketball player turned coach. Specialized in youth development programs.',
    description:'High-energy coaching sessions that cover dribbling, shooting, defense, and teamwork. I focus on building mental toughness alongside physical skills.',
    experience: 4,
    address:{ line1:'Block C, Gachibowli Towers', city:'Hyderabad', state:'Telangana', pincode:'500032' },
    availability:[
      { day:'Tuesday',   startTime:'5:00 PM', endTime:'8:00 PM' },
      { day:'Thursday',  startTime:'5:00 PM', endTime:'8:00 PM' },
      { day:'Saturday',  startTime:'8:00 AM', endTime:'1:00 PM' },
    ],
  },
];

export const mockBookings: Booking[] = [
  { id:'#1284', user:'Arun Kumar',  coach:'Ravi Sharma',  sport:'Cricket',   date:'17 Mar 2026', time:'9:00 AM',  location:'Jubilee Hills',  status:'confirmed',  credits:50, amountInr:500, child:'Aarav, 9y' },
  { id:'#1283', user:'Priya Reddy', coach:'Meena Tiwari', sport:'Tennis',    date:'17 Mar 2026', time:'11:00 AM', location:'Banjara Hills',  status:'requested',  credits:80, amountInr:800 },
  { id:'#1282', user:'Suresh M.',   coach:'Raj Patel',    sport:'Football',  date:'16 Mar 2026', time:'6:00 PM',  location:'Gachibowli',    status:'completed',  credits:60, amountInr:600 },
  { id:'#1281', user:'Neha Das',    coach:'Anita Verma',  sport:'Badminton', date:'16 Mar 2026', time:'7:00 AM',  location:'Madhapur',       status:'cancelled',  credits:0,  amountInr:0,   child:'Riya, 7y' },
  { id:'#1280', user:'Kiran Joshi', coach:'Ravi Sharma',  sport:'Cricket',   date:'15 Mar 2026', time:'5:00 PM',  location:'Kukatpally',     status:'no_show',    credits:0,  amountInr:0 },
  { id:'#1279', user:'Amara Singh', coach:'Sunil Kumar',  sport:'Swimming',  date:'15 Mar 2026', time:'7:00 AM',  location:'Kondapur',       status:'completed',  credits:70, amountInr:700 },
  { id:'#1278', user:'Dev Patel',   coach:'Meena Tiwari', sport:'Badminton', date:'14 Mar 2026', time:'4:00 PM',  location:'Banjara Hills',  status:'confirmed',  credits:80, amountInr:800, child:'Dia, 11y' },
  { id:'#1277', user:'Rohit Nair',  coach:'Raj Patel',    sport:'Football',  date:'14 Mar 2026', time:'6:30 PM',  location:'Gachibowli',    status:'completed',  credits:60, amountInr:600 },
];

export const mockPayments: Payment[] = [
  { id:'T001', user:'Arun Kumar',  type:'credit_purchase', credits:100, amountInr:900,  status:'success', method:'Razorpay UPI',  createdAt:'17 Mar 2026' },
  { id:'T002', user:'Priya Reddy', type:'credit_purchase', credits:50,  amountInr:500,  status:'success', method:'Razorpay Card', createdAt:'17 Mar 2026' },
  { id:'T003', user:'Arun Kumar',  type:'booking_debit',   credits:-50, amountInr:0,    status:'success', method:'Wallet',        createdAt:'16 Mar 2026' },
  { id:'T004', user:'Neha Das',    type:'refund',          credits:80,  amountInr:0,    status:'success', method:'Wallet',        createdAt:'16 Mar 2026' },
  { id:'T005', user:'Kiran Joshi', type:'credit_purchase', credits:200, amountInr:2000, status:'failed',  method:'Razorpay',      createdAt:'15 Mar 2026' },
  { id:'T006', user:'Dev Patel',   type:'credit_purchase', credits:100, amountInr:900,  status:'success', method:'Razorpay UPI',  createdAt:'14 Mar 2026' },
];

export const mockPayouts: Payout[] = [
  { id:'P001', coach:'Ravi Sharma',  amount:4200,  method:'UPI',  account:'ravi@upi',      status:'pending',   date:'Mar 17' },
  { id:'P002', coach:'Meena Tiwari', amount:8000,  method:'NEFT', account:'HDFC ···4821',  status:'pending',   date:'Mar 17' },
  { id:'P003', coach:'Raj Patel',    amount:21120, method:'UPI',  account:'raj@upi',       status:'pending',   date:'—' },
  { id:'P004', coach:'Anita Verma',  amount:5100,  method:'IMPS', account:'SBI ···2211',   status:'processed', date:'Mar 16' },
  { id:'P005', coach:'Sunil Kumar',  amount:33600, method:'NEFT', account:'ICICI ···9934', status:'pending',   date:'Mar 15' },
  { id:'P006', coach:'Priya Menon',  amount:1200,  method:'UPI',  account:'priya@upi',     status:'failed',    date:'Mar 14' },
];

export const mockReviews: Review[] = [
  { id:'R001', bookingId:'#1282', user:'Suresh M.', coach:'Raj Patel',    rating:5, text:'Great session, very patient coach!',    tags:['Professional','Friendly'], flagged:false, date:'Mar 16' },
  { id:'R002', bookingId:'#1279', user:'Kiran J.',  coach:'Ravi Sharma',  rating:4, text:'Good drills, timing could improve.',    tags:['Good'],                    flagged:false, date:'Mar 15' },
  { id:'R003', bookingId:'#1275', user:'Priya R.',  coach:'Meena Tiwari', rating:2, text:'Coach was 30 mins late. Disappointed.', tags:[],                          flagged:true,  date:'Mar 14' },
  { id:'R004', bookingId:'#1270', user:'Arun K.',   coach:'Ravi Sharma',  rating:5, text:'Best coach! Aarav loved every minute.', tags:['Professional','Wonderful'],flagged:false, date:'Mar 13' },
  { id:'R005', bookingId:'#1265', user:'Amara S.',  coach:'Sunil Kumar',  rating:1, text:'Session cancelled last minute!',        tags:[],                          flagged:true,  date:'Mar 11' },
];

export const mockSports: Sport[] = [
  { id:'SP001', name:'Cricket',      emoji:'🏏', coaches:12, bookings:438, revenue:262800, status:'active',   trend:'+14%', trendUp:true  },
  { id:'SP002', name:'Football',     emoji:'⚽', coaches:9,  bookings:283, revenue:169800, status:'active',   trend:'+8%',  trendUp:true  },
  { id:'SP003', name:'Tennis',       emoji:'🎾', coaches:7,  bookings:231, revenue:184800, status:'active',   trend:'+11%', trendUp:true  },
  { id:'SP004', name:'Badminton',    emoji:'🏸', coaches:8,  bookings:206, revenue:123600, status:'active',   trend:'+6%',  trendUp:true  },
  { id:'SP005', name:'Swimming',     emoji:'🏊', coaches:5,  bookings:128, revenue:89600,  status:'active',   trend:'+3%',  trendUp:true  },
  { id:'SP006', name:'Basketball',   emoji:'🏀', coaches:3,  bookings:64,  revenue:44800,  status:'active',   trend:'-2%',  trendUp:false },
  { id:'SP007', name:'Kabaddi',      emoji:'🤼', coaches:2,  bookings:41,  revenue:20500,  status:'active',   trend:'+18%', trendUp:true  },
  { id:'SP008', name:'Volleyball',   emoji:'🏐', coaches:1,  bookings:18,  revenue:10800,  status:'inactive', trend:'—',    trendUp:false },
  { id:'SP009', name:'Table Tennis', emoji:'🏓', coaches:2,  bookings:29,  revenue:17400,  status:'active',   trend:'+5%',  trendUp:true  },
  { id:'SP010', name:'Athletics',    emoji:'🏃', coaches:2,  bookings:22,  revenue:15400,  status:'inactive', trend:'—',    trendUp:false },
];

export const mockAdmins: AdminUser[] = [
  { id:'1', firstName:'Super',    lastName:'Admin',   email:'super@kridext.in',    role:'super_admin',      isActive:true,  createdAt:'2025-01-01' },
  { id:'2', firstName:'Customer', lastName:'Manager', email:'customer@kridext.in', role:'customer_manager', isActive:true,  createdAt:'2025-02-01', createdBy:'1' },
  { id:'3', firstName:'Coach',    lastName:'Manager', email:'coach@kridext.in',    role:'coach_manager',    isActive:true,  createdAt:'2025-02-01', createdBy:'1' },
  { id:'4', firstName:'Payment',  lastName:'Manager', email:'payment@kridext.in',  role:'payment_manager',  isActive:true,  createdAt:'2025-03-01', createdBy:'1' },
  { id:'5', firstName:'Booking',  lastName:'Manager', email:'booking@kridext.in',  role:'booking_manager',  isActive:true,  createdAt:'2025-03-01', createdBy:'1' },
  { id:'6', firstName:'Content',  lastName:'Manager', email:'content@kridext.in',  role:'content_manager',  isActive:false, createdAt:'2025-03-01', createdBy:'1' },
  { id:'7', firstName:'View',     lastName:'Only',    email:'viewer@kridext.in',   role:'viewer',           isActive:true,  createdAt:'2025-04-01', createdBy:'1' },
];
