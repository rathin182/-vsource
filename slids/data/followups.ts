import type { Followup } from "@/types";

const students = [
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
];

const counselors = ["Aditi Rao", "Vinod Bansal", "Sneha Kapoor", "Manoj Verma", "Pooja Iyer", "Rahul Singh", "Nisha Agarwal", "Rajat Nanda"];
const countries = ["USA", "UK", "Canada", "Australia", "Germany", "Ireland", "New Zealand", "France"];
const followupTypes = ["Phone Call", "Email", "WhatsApp", "Video Call"];
const statuses = ["Pending", "Completed", "Missed", "Rescheduled"];
const remarks = [
    "Awaiting documents",
    "Confirmed interview slot",
    "Counselor follow-up required",
    "Student requested more university options",
    "Fee payment reminder",
    "Visa document check",
];

const getDate = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString();
const times = ["09:30 AM", "10:45 AM", "12:00 PM", "02:15 PM", "03:30 PM", "05:00 PM"];

export const followups: Followup[] = Array.from({ length: 40 }, (_, i) => ({
    id: `FU${3200 + i}`,
    student: students[i % students.length],
    counselor: counselors[i % counselors.length],
    followupType: followupTypes[i % followupTypes.length],
    date: getDate((i % 7) - 3),
    time: times[i % times.length],
    country: countries[i % countries.length],
    status: statuses[i % statuses.length] as Followup["status"],
    remarks: remarks[i % remarks.length],
    notes: `Follow up on application progress and documentation for ${students[i % students.length]}.`,
}));
