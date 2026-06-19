import type { Lead, Student, University, Application, Branch, Counselor, CoachingBatch, LoanInquiry, Role, UserRow, NotificationItem } from "@/slids/others/other-ts/types";

const names = ["Aarav Sharma","Priya Iyer","Rohan Kapoor","Sneha Reddy","Karan Mehta","Ananya Singh","Vikram Joshi","Diya Patel","Aditya Rao","Isha Verma","Arjun Nair","Meera Pillai","Yash Gupta","Tara Bose","Nikhil Khanna","Riya Malhotra","Kabir Sethi","Aisha Khan","Dev Choudhary","Sara Ali"];
const sources = ["Website","Facebook","Instagram","Walk-in","Referral","Google Ads","Education Fair","QR Lead"];
const branches = ["Hyderabad","Bangalore","Chennai","Delhi","Mumbai","Pune","Kolkata","Vijayawada"];
const counselors = ["Aditi Rao","Vinod Bansal","Sneha Kapoor","Manoj Verma","Pooja Iyer","Rahul Singh"];
const countries = ["USA","UK","Canada","Australia","Germany","Ireland","New Zealand","France"];
const programs = ["MS Computer Science","MBA","MS Data Science","BBA","MS Cybersecurity","MS Finance","MS Business Analytics","BSc Nursing"];
const intakes = ["Fall 2025","Spring 2026","Summer 2026","Fall 2026"];

const pick = <T,>(arr: T[], i: number) => arr[i % arr.length];

export const leads: Lead[] = Array.from({ length: 28 }, (_, i) => ({
  id: `LD${1000 + i}`,
  name: pick(names, i),
  email: `${pick(names, i).toLowerCase().replace(/\s/g, ".")}@email.com`,
  phone: `+91 9${(800000000 + i * 137).toString().slice(0, 9)}`,
  source: pick(sources, i),
  status: (["new","contacted","qualified","converted","lost"] as const)[i % 5],
  branch: pick(branches, i),
  counselor: pick(counselors, i),
  country: pick(countries, i),
  createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
}));

export const students: Student[] = Array.from({ length: 22 }, (_, i) => ({
  id: `ST${2000 + i}`,
  name: pick(names, i + 3),
  email: `${pick(names, i + 3).toLowerCase().replace(/\s/g, ".")}@student.com`,
  phone: `+91 8${(700000000 + i * 211).toString().slice(0, 9)}`,
  dob: `200${i % 9}-${((i % 12) + 1).toString().padStart(2, "0")}-15`,
  country: pick(countries, i),
  program: pick(programs, i),
  intake: pick(intakes, i),
  status: pick(["Active","On Hold","Enrolled","Visa Granted","Documents Pending"], i),
  progress: 25 + (i * 7) % 75,
}));

export const universities: University[] = [
  { id: "U1", name: "Stanford University", country: "USA", city: "Palo Alto", ranking: 3, tuitionFee: 58000, duration: "2 years", intakes: ["Fall","Spring"], scholarships: true, programs: ["MS CS","MBA"] },
  { id: "U2", name: "University of Toronto", country: "Canada", city: "Toronto", ranking: 18, tuitionFee: 42000, duration: "2 years", intakes: ["Fall"], scholarships: true, programs: ["MS Data Science"] },
  { id: "U3", name: "Oxford University", country: "UK", city: "Oxford", ranking: 2, tuitionFee: 52000, duration: "1 year", intakes: ["Fall"], scholarships: false, programs: ["MBA","MSc"] },
  { id: "U4", name: "University of Melbourne", country: "Australia", city: "Melbourne", ranking: 33, tuitionFee: 38000, duration: "2 years", intakes: ["Feb","Jul"], scholarships: true, programs: ["MS IT"] },
  { id: "U5", name: "TU Munich", country: "Germany", city: "Munich", ranking: 28, tuitionFee: 1500, duration: "2 years", intakes: ["Winter","Summer"], scholarships: true, programs: ["MS Engineering"] },
  { id: "U6", name: "Trinity College Dublin", country: "Ireland", city: "Dublin", ranking: 81, tuitionFee: 26000, duration: "1 year", intakes: ["Fall"], scholarships: true, programs: ["MS CS","MBA"] },
  { id: "U7", name: "University of Auckland", country: "New Zealand", city: "Auckland", ranking: 68, tuitionFee: 32000, duration: "1.5 years", intakes: ["Feb","Jul"], scholarships: false, programs: ["MS Business"] },
  { id: "U8", name: "Sorbonne University", country: "France", city: "Paris", ranking: 35, tuitionFee: 18000, duration: "2 years", intakes: ["Sep"], scholarships: true, programs: ["MA","MSc"] },
];

export const applications: Application[] = Array.from({ length: 18 }, (_, i) => ({
  id: `AP${3000 + i}`,
  studentName: pick(names, i),
  university: pick(universities, i).name,
  program: pick(programs, i),
  stage: (["inquiry","documents","applied","offer","visa","enrolled"] as const)[i % 6],
  intake: pick(intakes, i),
  counselor: pick(counselors, i),
  updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
}));

export const branchesData: Branch[] = branches.map((b, i) => ({
  id: `BR${i + 1}`,
  name: `VSource ${b}`,
  city: b,
  manager: pick(counselors, i),
  staff: 8 + i * 2,
  students: 120 + i * 35,
  revenue: 1800000 + i * 450000,
}));

export const counselorsData: Counselor[] = counselors.map((c, i) => ({
  id: `CN${i + 1}`,
  name: c,
  email: `${c.toLowerCase().replace(/\s/g, ".")}@vsourcecrm.com`,
  branch: pick(branches, i),
  leads: 45 + i * 12,
  conversions: 12 + i * 4,
  rating: 4 + (i % 5) * 0.2,
}));

export const coachingBatches: CoachingBatch[] = [
  { id: "CB1", name: "IELTS Morning", type: "IELTS", faculty: "Mr. Suresh", schedule: "Mon-Fri 7-9 AM", students: 24, startDate: "2025-11-15" },
  { id: "CB2", name: "PTE Express", type: "PTE", faculty: "Ms. Kavya", schedule: "Mon-Wed-Fri 4-6 PM", students: 18, startDate: "2025-12-01" },
  { id: "CB3", name: "GRE Intensive", type: "GRE", faculty: "Dr. Ramesh", schedule: "Sat-Sun 10-1 PM", students: 14, startDate: "2025-11-20" },
  { id: "CB4", name: "TOEFL Weekend", type: "TOEFL", faculty: "Mrs. Priya", schedule: "Sat-Sun 2-5 PM", students: 20, startDate: "2025-12-10" },
  { id: "CB5", name: "GMAT Pro", type: "GMAT", faculty: "Mr. Anil", schedule: "Tue-Thu 6-8 PM", students: 12, startDate: "2025-12-05" },
];

export const loanInquiries: LoanInquiry[] = Array.from({ length: 10 }, (_, i) => ({
  id: `LN${4000 + i}`,
  student: pick(names, i),
  bank: pick(["HDFC Credila","Avanse","Axis Bank","SBI","ICICI","Auxilo","InCred"], i),
  amount: 1500000 + i * 350000,
  status: (["pending","approved","rejected","disbursed"] as const)[i % 4],
  emi: 18000 + i * 2200,
  appliedAt: new Date(Date.now() - i * 86400000 * 5).toISOString(),
}));

export const rolesData: Role[] = [
  { id: "R1", name: "Super Admin", users: 2, permissions: {} },
  { id: "R2", name: "Branch Manager", users: 8, permissions: {} },
  { id: "R3", name: "Senior Counselor", users: 14, permissions: {} },
  { id: "R4", name: "Counselor", users: 32, permissions: {} },
  { id: "R5", name: "Front Desk", users: 12, permissions: {} },
];

export const usersData: UserRow[] = Array.from({ length: 14 }, (_, i) => ({
  id: `US${i + 1}`,
  name: pick(counselors.concat(names), i),
  email: `user${i + 1}@vsourcecrm.com`,
  role: pick(["Admin","Branch Manager","Counselor","Front Desk"], i),
  branch: pick(branches, i),
  status: i % 5 === 0 ? "inactive" : "active",
  lastLogin: `${i + 1} hours ago`,
}));

export const notifications: NotificationItem[] = [
  { id: "N1", title: "New lead assigned", description: "Aarav Sharma from Hyderabad branch", time: "5m ago", read: false, type: "lead" },
  { id: "N2", title: "Application moved to Visa", description: "Priya Iyer – Stanford University", time: "1h ago", read: false, type: "application" },
  { id: "N3", title: "Offer letter received", description: "Rohan Kapoor – University of Toronto", time: "3h ago", read: true, type: "application" },
  { id: "N4", title: "Payment overdue", description: "Coaching fee – batch IELTS Morning", time: "1d ago", read: true, type: "system" },
];

export const monthlyRevenue = [
  { month: "Jan", revenue: 1820000, applications: 42 },
  { month: "Feb", revenue: 2150000, applications: 48 },
  { month: "Mar", revenue: 1980000, applications: 55 },
  { month: "Apr", revenue: 2680000, applications: 62 },
  { month: "May", revenue: 2420000, applications: 58 },
  { month: "Jun", revenue: 3110000, applications: 71 },
  { month: "Jul", revenue: 3580000, applications: 79 },
  { month: "Aug", revenue: 3250000, applications: 74 },
  { month: "Sep", revenue: 3890000, applications: 88 },
  { month: "Oct", revenue: 4120000, applications: 95 },
  { month: "Nov", revenue: 3760000, applications: 84 },
];

export const countryAdmissions = countries.map((c, i) => ({ country: c, count: 35 + i * 12 }));
export const leadSourceSplit = sources.slice(0, 5).map((s, i) => ({ source: s, value: 12 + i * 8 }));
export const promotionalMaterials = countries.map((c, i) => ({
  id: `PM${i+1}`, country: c, title: `${c} Study Guide 2026`, category: i % 2 === 0 ? "Brochure" : "Flyer", size: `${1.2 + i * 0.3} MB`,
}));

export const masterData = {
  visaStatus: ["Not Applied","Filed","Slot Booked","Interview Done","Granted","Refused"],
  courseTypes: ["Bachelors","Masters","PhD","Diploma","Certificate"],
  banks: ["HDFC Credila","Avanse","Axis Bank","SBI","ICICI","Auxilo","InCred"],
  expenseTypes: ["Marketing","Salaries","Rent","Utilities","Travel","Software"],
  leadStatuses: ["New","Contacted","Qualified","Converted","Lost"],
  intakes: ["Fall 2025","Spring 2026","Summer 2026","Fall 2026"],
  applicationStatuses: ["Inquiry","Documents","Applied","Offer","Visa","Enrolled"],
};
