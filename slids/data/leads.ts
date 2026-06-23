import type { Lead, LeadStatus } from "@/types";

const names = [
    "Aarav Sharma",
    "Priya Iyer",
    "Rohan Kapoor",
    "Sneha Reddy",
    "Karan Mehta",
    "Ananya Singh",
    "Vikram Joshi",
    "Diya Patel",
    "Aditya Rao",
    "Isha Verma",
    "Arjun Nair",
    "Meera Pillai",
    "Yash Gupta",
    "Tara Bose",
    "Nikhil Khanna",
    "Riya Malhotra",
    "Kabir Sethi",
    "Aisha Khan",
    "Dev Choudhary",
    "Sara Ali",
    "Mira Sen",
    "Jayesh Kumar",
    "Nina Thomas",
    "Vikram Das",
    "Pooja Desai",
    "Neha Shah",
    "Aman Tiwari",
    "Rhea Anand",
    "Vivek Nair",
    "Aarti Kaur",
    "Manish Chawla",
    "Divya Nanda",
    "Sahil Gupta",
    "Ritika Jain",
    "Durgesh Patel",
    "Mansi Verma",
    "Kavya Sinha",
    "Arjun Bedi",
    "Samir Joshi",
    "Simran Sidhu",
    "Kavita Reddy",
    "Amanpreet Singh",
    "Lakshmi Rao",
    "Pranav Das",
    "Tanya Mehta",
    "Rohit Saxena",
    "Ishita Banerjee",
    "Rajeev Nair",
    "Pallavi Roy",
    "Rajat Shah",
    "Meenakshi Sharma",
];

const sources = [
    "Website",
    "Referral",
    "Walk-in",
    "Facebook",
    "Instagram",
    "Google Ads",
    "Education Fair",
    "Email Campaign",
];

const branches = ["Hyderabad", "Bangalore", "Chennai", "Delhi", "Mumbai", "Pune", "Kolkata", "Vijayawada"];
const counselors = ["Aditi Rao", "Vinod Bansal", "Sneha Kapoor", "Manoj Verma", "Pooja Iyer", "Rahul Singh", "Nisha Agarwal", "Rajat Nanda"];
const countries = ["USA", "UK", "Canada", "Australia", "Germany", "Ireland", "New Zealand", "France"];
const statuses: LeadStatus[] = ["new", "contacted", "qualified", "converted", "lost"];

const formatPhone = (index: number) => `+91 9${(800000000 + index * 12345).toString().slice(0, 9)}`;
const formatDate = (offsetDays: number) => new Date(Date.now() + offsetDays * 86400000).toISOString();

export const leads: Lead[] = Array.from({ length: 50 }, (_, i) => ({
    id: `LD${1100 + i}`,
    name: names[i % names.length],
    email: `${names[i % names.length].toLowerCase().replace(/\s+/g, ".")}@studentmail.com`,
    phone: formatPhone(i),
    source: sources[i % sources.length],
    status: statuses[i % statuses.length],
    branch: branches[i % branches.length],
    counselor: counselors[i % counselors.length],
    country: countries[i % countries.length],
    createdAt: formatDate(-i * 2),
    nextFollowup: formatDate(((i % 5) - 1) * 1),
    allocationDate: formatDate(-(i % 10) * 3),
}));

export const leadStatuses = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "CONVERTED",
  "LOST",
] as const;