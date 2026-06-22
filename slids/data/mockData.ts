export interface Application {
  id: string;
  portal: string;
  university: string;
  course: string;
  applicationDate: string;
  status: 'Applied' | 'Pending' | 'Offer Received' | 'Priority Offer Received' | 'Conditional Offer' | 'Unconditional Offer' | 'Rejected';
}

export interface LoanDetail {
  assignee: string;
  nbfc: 'Poonawalla' | 'Credila' | 'Avanse' | 'ICICI' | 'Self Funding';
  status: 'Pending' | 'Approved' | 'Sanctioned' | 'Rejected';
  pfStatus: 'Paid' | 'Pending' | 'Waived' | 'Not Applicable';
  sanctionedAmount: string;
  disbursedAmount: string;
}

export interface VisaDetail {
  depositStatus: 'Paid' | 'Pending' | 'Waived';
  ihsPayment: 'Paid' | 'Pending' | 'Not Required';
  interviewStatus: 'Completed' | 'Pending' | 'Waived';
  casStatus: 'Received' | 'Pending' | 'Not Required';
  visaStatus: 'Approved' | 'Applied' | 'Decision Pending' | 'Draft Pending';
}

export interface Remark {
  date: string;
  note: string;
}

export interface Student {
  id: string;
  name: string;
  counsellor: string;
  country: 'United Kingdom' | 'United States' | 'Canada' | 'Australia' | 'Germany';
  intake: 'Sep 2026' | 'Jan 2026' | 'May 2026';
  admissionDate: string;
  applicationType: string;
  passportNumber: string;
  mobileNumber: string;
  email: string;
  englishRequirement: string;
  currentStage: 'Lead Created' | 'Application Submitted' | 'Offer Received' | 'Deposit Paid' | 'Interview Completed' | 'CAS Received' | 'Visa Applied' | 'Visa Approved';
  applications: Application[];
  loan: LoanDetail;
  visaDetails: VisaDetail;
  remarks: Remark[];
}

export const initialStudents: Student[] = [
  {
    id: "1",
    name: "Prasad Panjugula",
    counsellor: "Anjali Sharma",
    country: "United Kingdom",
    intake: "Sep 2026",
    admissionDate: "12-Apr-2026",
    applicationType: "Master's Degree",
    passportNumber: "P1298471",
    mobileNumber: "+91 94401 23456",
    email: "prasad.panjugula@gmail.com",
    englishRequirement: "IELTS - 7.5 (Waived)",
    currentStage: "Visa Approved",
    applications: [
      {
        id: "app-1-1",
        portal: "GVOC",
        university: "Coventry University",
        course: "MSc Automotive Engineering with Work Placement",
        applicationDate: "01-May-2026",
        status: "Unconditional Offer"
      },
      {
        id: "app-1-2",
        portal: "Leverage",
        university: "Aston University",
        course: "MSc Project Management",
        applicationDate: "01-May-2026",
        status: "Unconditional Offer"
      }
    ],
    loan: {
      assignee: "Sanjay Kumar",
      nbfc: "Credila",
      status: "Sanctioned",
      pfStatus: "Paid",
      sanctionedAmount: "₹35,00,000",
      disbursedAmount: "₹15,00,000"
    },
    visaDetails: {
      depositStatus: "Paid",
      ihsPayment: "Paid",
      interviewStatus: "Completed",
      casStatus: "Received",
      visaStatus: "Approved"
    },
    remarks: [
      { date: "05-Jun-2026", note: "Visa slot booked for 08-Jun filing." },
      { date: "08-Jun-2026", note: "Documents submitted at VFS." },
      { date: "12-Jun-2026", note: "Waiting for CAS." },
      { date: "15-Jun-2026", note: "CAS received." }
    ]
  },
  {
    id: "2",
    name: "Mekapati Sneha Latha Reddy",
    counsellor: "Sophia Sen",
    country: "United States",
    intake: "Sep 2026",
    admissionDate: "15-Apr-2026",
    applicationType: "Master's Degree",
    passportNumber: "P4829384",
    mobileNumber: "+91 98850 12345",
    email: "sneha.reddy@gmail.com",
    englishRequirement: "PTE - 74",
    currentStage: "Visa Approved",
    applications: [
      {
        id: "app-2-1",
        portal: "Direct",
        university: "New York University",
        course: "MS Computer Science",
        applicationDate: "12-Apr-2026",
        status: "Unconditional Offer"
      },
      {
        id: "app-2-2",
        portal: "Centrum",
        university: "Boston University",
        course: "MS Applied Data Analytics",
        applicationDate: "20-Apr-2026",
        status: "Conditional Offer"
      }
    ],
    loan: {
      assignee: "Nisha Patel",
      nbfc: "Avanse",
      status: "Sanctioned",
      pfStatus: "Paid",
      sanctionedAmount: "₹45,00,000",
      disbursedAmount: "₹45,00,000"
    },
    visaDetails: {
      depositStatus: "Paid",
      ihsPayment: "Paid",
      interviewStatus: "Completed",
      casStatus: "Received",
      visaStatus: "Approved"
    },
    remarks: [
      { date: "10-May-2026", note: "I-20 Form received from NYU." },
      { date: "15-May-2026", note: "F1 Visa Interview completed successfully." },
      { date: "25-May-2026", note: "Visa stamped and passport collected." }
    ]
  },
  {
    id: "3",
    name: "Sai Santhosh",
    counsellor: "Ravi Teja",
    country: "United Kingdom",
    intake: "Jan 2026",
    admissionDate: "10-Mar-2026",
    applicationType: "Master's Degree",
    passportNumber: "P4920192",
    mobileNumber: "+91 99345 81920",
    email: "sai.santhosh@gmail.com",
    englishRequirement: "IELTS - 6.5",
    currentStage: "Visa Approved",
    applications: [
      {
        id: "app-3-1",
        portal: "GVOC",
        university: "University of Hertfordshire",
        course: "MSc Software Engineering",
        applicationDate: "15-Mar-2026",
        status: "Unconditional Offer"
      },
      {
        id: "app-3-2",
        portal: "Leverage",
        university: "Cardiff Metropolitan University",
        course: "MBA Finance",
        applicationDate: "18-Mar-2026",
        status: "Conditional Offer"
      }
    ],
    loan: {
      assignee: "Vikram Varma",
      nbfc: "Poonawalla",
      status: "Sanctioned",
      pfStatus: "Paid",
      sanctionedAmount: "₹22,00,000",
      disbursedAmount: "₹0"
    },
    visaDetails: {
      depositStatus: "Paid",
      ihsPayment: "Paid",
      interviewStatus: "Completed",
      casStatus: "Received",
      visaStatus: "Approved"
    },
    remarks: [
      { date: "01-Jun-2026", note: "CAS Request submitted." },
      { date: "10-Jun-2026", note: "CAS Statement issued by Hertfordshire." },
      { date: "14-Jun-2026", note: "Visa approved under Priority service." }
    ]
  },
  {
    id: "4",
    name: "Sai Ram Kondamadugu",
    counsellor: "Priya Nair",
    country: "Australia",
    intake: "Sep 2026",
    admissionDate: "02-May-2026",
    applicationType: "Master's Degree",
    passportNumber: "P9281729",
    mobileNumber: "+91 88975 62810",
    email: "sairam.k@gmail.com",
    englishRequirement: "Medium of Instruction (MOI)",
    currentStage: "Visa Approved",
    applications: [
      {
        id: "app-4-1",
        portal: "Direct",
        university: "Deakin University",
        course: "Master of Data Science",
        applicationDate: "05-May-2026",
        status: "Unconditional Offer"
      },
      {
        id: "app-4-2",
        portal: "GVOC",
        university: "Macquarie University",
        course: "Master of Information Technology",
        applicationDate: "10-May-2026",
        status: "Applied"
      }
    ],
    loan: {
      assignee: "Sanjay Kumar",
      nbfc: "ICICI",
      status: "Sanctioned",
      pfStatus: "Paid",
      sanctionedAmount: "₹28,00,000",
      disbursedAmount: "₹10,00,000"
    },
    visaDetails: {
      depositStatus: "Paid",
      ihsPayment: "Paid",
      interviewStatus: "Waived",
      casStatus: "Received",
      visaStatus: "Approved"
    },
    remarks: [
      { date: "20-May-2026", note: "CoE received from Deakin." },
      { date: "28-May-2026", note: "Visa lodged to Australian Home Affairs." },
      { date: "10-Jun-2026", note: "Subclass 500 Visa Approved." }
    ]
  },
  {
    id: "5",
    name: "Karunakar Reddy",
    counsellor: "Karan Malhotra",
    country: "Canada",
    intake: "Jan 2026",
    admissionDate: "08-Apr-2026",
    applicationType: "PG Diploma",
    passportNumber: "P5738291",
    mobileNumber: "+91 90123 45678",
    email: "karunakar.reddy@gmail.com",
    englishRequirement: "IELTS - 7.0",
    currentStage: "Visa Approved",
    applications: [
      {
        id: "app-5-1",
        portal: "Leverage",
        university: "York University",
        course: "PG Diploma in Advanced Management",
        applicationDate: "10-Apr-2026",
        status: "Priority Offer Received"
      },
      {
        id: "app-5-2",
        portal: "GVOC",
        university: "Lambton College",
        course: "PG Diploma in Mobile Application Development",
        applicationDate: "14-Apr-2026",
        status: "Rejected"
      }
    ],
    loan: {
      assignee: "Vikram Varma",
      nbfc: "Credila",
      status: "Sanctioned",
      pfStatus: "Paid",
      sanctionedAmount: "₹20,00,000",
      disbursedAmount: "₹20,00,000"
    },
    visaDetails: {
      depositStatus: "Paid",
      ihsPayment: "Paid",
      interviewStatus: "Waived",
      casStatus: "Received",
      visaStatus: "Approved"
    },
    remarks: [
      { date: "25-Apr-2026", note: "LOA (Letter of Acceptance) Received." },
      { date: "02-May-2026", note: "GIC Account funded with $20,635." },
      { date: "29-May-2026", note: "Study Permit approved." }
    ]
  },
  {
    id: "6",
    name: "Akhil Kumar",
    counsellor: "Ravi Teja",
    country: "Germany",
    intake: "Sep 2026",
    admissionDate: "10-May-2026",
    applicationType: "Master's Degree",
    passportNumber: "P3921029",
    mobileNumber: "+91 91234 56789",
    email: "akhil.kumar@gmail.com",
    englishRequirement: "TOEFL - 98",
    currentStage: "Visa Approved",
    applications: [
      {
        id: "app-6-1",
        portal: "Direct",
        university: "IU International University of Applied Sciences",
        course: "Master of Business Administration",
        applicationDate: "12-May-2026",
        status: "Unconditional Offer"
      },
      {
        id: "app-6-2",
        portal: "Centrum",
        university: "SRH Berlin University of Applied Sciences",
        course: "MSc Cyber Security",
        applicationDate: "15-May-2026",
        status: "Applied"
      }
    ],
    loan: {
      assignee: "Nisha Patel",
      nbfc: "Self Funding",
      status: "Approved",
      pfStatus: "Not Applicable",
      sanctionedAmount: "-",
      disbursedAmount: "-"
    },
    visaDetails: {
      depositStatus: "Paid",
      ihsPayment: "Not Required",
      interviewStatus: "Completed",
      casStatus: "Received",
      visaStatus: "Approved"
    },
    remarks: [
      { date: "18-May-2026", note: "Admission offer accepted." },
      { date: "24-May-2026", note: "Blocked Account funded with €11,208." },
      { date: "12-Jun-2026", note: "German Embassy visa interview completed and approved." }
    ]
  },
  {
    id: "7",
    name: "Harika Devi",
    counsellor: "Anjali Sharma",
    country: "United Kingdom",
    intake: "Sep 2026",
    admissionDate: "30-Apr-2026",
    applicationType: "Master's Degree",
    passportNumber: "P1829302",
    mobileNumber: "+91 93456 78901",
    email: "harika.devi@gmail.com",
    englishRequirement: "IELTS - 7.0",
    currentStage: "Visa Approved",
    applications: [
      {
        id: "app-7-1",
        portal: "GVOC",
        university: "University of Greenwich",
        course: "MSc Big Data and Business Intelligence",
        applicationDate: "02-May-2026",
        status: "Unconditional Offer"
      },
      {
        id: "app-7-2",
        portal: "Leverage",
        university: "University of East London",
        course: "MSc Information Security",
        applicationDate: "05-May-2026",
        status: "Conditional Offer"
      }
    ],
    loan: {
      assignee: "Sanjay Kumar",
      nbfc: "Avanse",
      status: "Sanctioned",
      pfStatus: "Paid",
      sanctionedAmount: "₹24,00,000",
      disbursedAmount: "₹12,00,000"
    },
    visaDetails: {
      depositStatus: "Paid",
      ihsPayment: "Paid",
      interviewStatus: "Completed",
      casStatus: "Received",
      visaStatus: "Approved"
    },
    remarks: [
      { date: "15-May-2026", note: "Deposit of £4,000 paid." },
      { date: "22-May-2026", note: "CAS Statement received." },
      { date: "06-Jun-2026", note: "Visa approved." }
    ]
  },
  {
    id: "8",
    name: "Vamsi Krishna",
    counsellor: "Sophia Sen",
    country: "United Kingdom",
    intake: "Sep 2026",
    admissionDate: "28-Apr-2026",
    applicationType: "Master's Degree",
    passportNumber: "P8394019",
    mobileNumber: "+91 94567 89012",
    email: "vamsi.krishna@gmail.com",
    englishRequirement: "Medium of Instruction (MOI)",
    currentStage: "Visa Applied",
    applications: [
      {
        id: "app-8-1",
        portal: "Leverage",
        university: "Cardiff Metropolitan University",
        course: "MSc Data Science",
        applicationDate: "01-May-2026",
        status: "Unconditional Offer"
      },
      {
        id: "app-8-2",
        portal: "GVOC",
        university: "Coventry University",
        course: "MSc Cyber Security",
        applicationDate: "04-May-2026",
        status: "Conditional Offer"
      }
    ],
    loan: {
      assignee: "Nisha Patel",
      nbfc: "Credila",
      status: "Sanctioned",
      pfStatus: "Paid",
      sanctionedAmount: "₹30,00,000",
      disbursedAmount: "₹0"
    },
    visaDetails: {
      depositStatus: "Paid",
      ihsPayment: "Paid",
      interviewStatus: "Completed",
      casStatus: "Received",
      visaStatus: "Applied"
    },
    remarks: [
      { date: "01-Jun-2026", note: "Deposits fully paid to Cardiff Met." },
      { date: "08-Jun-2026", note: "CAS Issued." },
      { date: "14-Jun-2026", note: "Visa application submitted. Biometrics completed." }
    ]
  },
  {
    id: "9",
    name: "Nikhil Reddy",
    counsellor: "Priya Nair",
    country: "United States",
    intake: "Sep 2026",
    admissionDate: "10-Apr-2026",
    applicationType: "Master's Degree",
    passportNumber: "P2938102",
    mobileNumber: "+91 95678 90123",
    email: "nikhil.reddy@gmail.com",
    englishRequirement: "Duolingo - 125",
    currentStage: "Visa Applied",
    applications: [
      {
        id: "app-9-1",
        portal: "Direct",
        university: "University of Texas at Dallas",
        course: "MS Business Analytics",
        applicationDate: "11-Apr-2026",
        status: "Priority Offer Received"
      },
      {
        id: "app-9-2",
        portal: "Centrum",
        university: "University of Houston",
        course: "MS Information Systems",
        applicationDate: "20-Apr-2026",
        status: "Conditional Offer"
      }
    ],
    loan: {
      assignee: "Sanjay Kumar",
      nbfc: "Avanse",
      status: "Sanctioned",
      pfStatus: "Paid",
      sanctionedAmount: "₹40,00,000",
      disbursedAmount: "₹0"
    },
    visaDetails: {
      depositStatus: "Paid",
      ihsPayment: "Paid",
      interviewStatus: "Pending",
      casStatus: "Received",
      visaStatus: "Applied"
    },
    remarks: [
      { date: "04-May-2026", note: "I-20 document issued by UT Dallas." },
      { date: "29-May-2026", note: "SEVIS Fee funded." },
      { date: "10-Jun-2026", note: "Visa slot booked for June 22nd." }
    ]
  },
  {
    id: "10",
    name: "Sandeep Kumar",
    counsellor: "Karan Malhotra",
    country: "United Kingdom",
    intake: "Sep 2026",
    admissionDate: "10-May-2026",
    applicationType: "Master's Degree",
    passportNumber: "P1029384",
    mobileNumber: "+91 96789 01234",
    email: "sandeep.k@gmail.com",
    englishRequirement: "IELTS - 6.5",
    currentStage: "CAS Received",
    applications: [
      {
        id: "app-10-1",
        portal: "GVOC",
        university: "University of Bedfordshire",
        course: "MSc Applied Computing",
        applicationDate: "12-May-2026",
        status: "Unconditional Offer"
      },
      {
        id: "app-10-2",
        portal: "Leverage",
        university: "Leeds Beckett University",
        course: "MSc Software Engineering",
        applicationDate: "15-May-2026",
        status: "Conditional Offer"
      }
    ],
    loan: {
      assignee: "Vikram Varma",
      nbfc: "Poonawalla",
      status: "Sanctioned",
      pfStatus: "Pending",
      sanctionedAmount: "₹18,00,000",
      disbursedAmount: "₹0"
    },
    visaDetails: {
      depositStatus: "Paid",
      ihsPayment: "Pending",
      interviewStatus: "Completed",
      casStatus: "Received",
      visaStatus: "Draft Pending"
    },
    remarks: [
      { date: "28-May-2026", note: "Pre-CAS interview cleared successfully." },
      { date: "12-Jun-2026", note: "Deposit cleared in the University bank account." },
      { date: "15-Jun-2026", note: "CAS letter received from Bedfordshire!" }
    ]
  },
  {
    id: "11",
    name: "Rohith Kumar",
    counsellor: "Ravi Teja",
    country: "Canada",
    intake: "Sep 2026",
    admissionDate: "29-Apr-2026",
    applicationType: "PG Diploma",
    passportNumber: "P1203948",
    mobileNumber: "+91 97890 12345",
    email: "rohith.kumar@gmail.com",
    englishRequirement: "PTE - 68",
    currentStage: "Deposit Paid",
    applications: [
      {
        id: "app-11-1",
        portal: "Leverage",
        university: "Conestoga College",
        course: "PG Diploma Web Development",
        applicationDate: "01-May-2026",
        status: "Unconditional Offer"
      },
      {
        id: "app-11-2",
        portal: "GVOC",
        university: "Fanshawe College",
        course: "PG Diploma Information Security",
        applicationDate: "05-May-2026",
        status: "Applied"
      }
    ],
    loan: {
      assignee: "Nisha Patel",
      nbfc: "Credila",
      status: "Sanctioned",
      pfStatus: "Paid",
      sanctionedAmount: "₹15,00,000",
      disbursedAmount: "₹0"
    },
    visaDetails: {
      depositStatus: "Paid",
      ihsPayment: "Pending",
      interviewStatus: "Waived",
      casStatus: "Pending",
      visaStatus: "Draft Pending"
    },
    remarks: [
      { date: "15-May-2026", note: "Admission offer received from Conestoga." },
      { date: "05-Jun-2026", note: "Deposit of CAD $9,500 paid successfully." },
      { date: "12-Jun-2026", note: "Waiting for official Letter of Acceptance (LOA) for visa filing." }
    ]
  },
  {
    id: "12",
    name: "Tejaswini",
    counsellor: "Priya Nair",
    country: "United Kingdom",
    intake: "Jan 2026",
    admissionDate: "28-May-2026",
    applicationType: "Master's Degree",
    passportNumber: "P8291038",
    mobileNumber: "+91 98901 23456",
    email: "tejaswini@gmail.com",
    englishRequirement: "IELTS - 6.5",
    currentStage: "Application Submitted",
    applications: [
      {
        id: "app-12-1",
        portal: "GVOC",
        university: "University of Leeds",
        course: "MSc Data Science",
        applicationDate: "01-Jun-2026",
        status: "Applied"
      },
      {
        id: "app-12-2",
        portal: "Leverage",
        university: "Coventry University",
        course: "MSc Embedded Systems",
        applicationDate: "05-Jun-2026",
        status: "Pending"
      }
    ],
    loan: {
      assignee: "Vikram Varma",
      nbfc: "Avanse",
      status: "Pending",
      pfStatus: "Pending",
      sanctionedAmount: "-",
      disbursedAmount: "-"
    },
    visaDetails: {
      depositStatus: "Pending",
      ihsPayment: "Pending",
      interviewStatus: "Pending",
      casStatus: "Pending",
      visaStatus: "Draft Pending"
    },
    remarks: [
      { date: "02-Jun-2026", note: "Application submitted to University of Leeds." },
      { date: "10-Jun-2026", note: "Academic transcripts compiled and uploaded." }
    ]
  },
  {
    id: "13",
    name: "Keerthana",
    counsellor: "Sophia Sen",
    country: "United States",
    intake: "Sep 2026",
    admissionDate: "10-Jun-2026",
    applicationType: "Master's Degree",
    passportNumber: "P4829120",
    mobileNumber: "+91 99012 34567",
    email: "keerthana@gmail.com",
    englishRequirement: "Duolingo - 115",
    currentStage: "Lead Created",
    applications: [
      {
        id: "app-13-1",
        portal: "Centrum",
        university: "University of South Florida",
        course: "MS Business Analytics",
        applicationDate: "12-Jun-2026",
        status: "Applied"
      },
      {
        id: "app-13-2",
        portal: "Direct",
        university: "Arizona State University",
        course: "MS Information Technology",
        applicationDate: "14-Jun-2026",
        status: "Applied"
      }
    ],
    loan: {
      assignee: "Sanjay Kumar",
      nbfc: "Poonawalla",
      status: "Pending",
      pfStatus: "Pending",
      sanctionedAmount: "-",
      disbursedAmount: "-"
    },
    visaDetails: {
      depositStatus: "Pending",
      ihsPayment: "Pending",
      interviewStatus: "Pending",
      casStatus: "Pending",
      visaStatus: "Draft Pending"
    },
    remarks: [
      { date: "12-Jun-2026", note: "Lead generated and assigned to Sophia Sen." },
      { date: "14-Jun-2026", note: "First counseling session done. USA options suggested." }
    ]
  },
  {
    id: "14",
    name: "Abhinay",
    counsellor: "Anjali Sharma",
    country: "Canada",
    intake: "May 2026",
    admissionDate: "05-Jun-2026",
    applicationType: "PG Diploma",
    passportNumber: "P9210293",
    mobileNumber: "+91 90123 45670",
    email: "abhinay@gmail.com",
    englishRequirement: "IELTS - 6.0",
    currentStage: "Lead Created",
    applications: [
      {
        id: "app-14-1",
        portal: "Leverage",
        university: "Seneca College",
        course: "PG Diploma Computer Programming",
        applicationDate: "10-Jun-2026",
        status: "Pending"
      }
    ],
    loan: {
      assignee: "Nisha Patel",
      nbfc: "Self Funding",
      status: "Pending",
      pfStatus: "Not Applicable",
      sanctionedAmount: "-",
      disbursedAmount: "-"
    },
    visaDetails: {
      depositStatus: "Pending",
      ihsPayment: "Pending",
      interviewStatus: "Pending",
      casStatus: "Pending",
      visaStatus: "Draft Pending"
    },
    remarks: [
      { date: "11-Jun-2026", note: "SOP guidelines shared with applicant." }
    ]
  },
  {
    id: "15",
    name: "Mahesh Babu",
    counsellor: "Karan Malhotra",
    country: "Australia",
    intake: "Sep 2026",
    admissionDate: "11-Jun-2026",
    applicationType: "Master's Degree",
    passportNumber: "P5102938",
    mobileNumber: "+91 91234 56701",
    email: "mahesh.babu@gmail.com",
    englishRequirement: "Medium of Instruction (MOI)",
    currentStage: "Lead Created",
    applications: [
      {
        id: "app-15-1",
        portal: "Direct",
        university: "RMIT University",
        course: "Master of Cybersecurity",
        applicationDate: "11-Jun-2026",
        status: "Applied"
      }
    ],
    loan: {
      assignee: "Sanjay Kumar",
      nbfc: "Credila",
      status: "Rejected",
      pfStatus: "Pending",
      sanctionedAmount: "-",
      disbursedAmount: "-"
    },
    visaDetails: {
      depositStatus: "Pending",
      ihsPayment: "Pending",
      interviewStatus: "Pending",
      casStatus: "Pending",
      visaStatus: "Draft Pending"
    },
    remarks: [
      { date: "12-Jun-2026", note: "Credila loan application rejected due to insufficient collateral value. Seeking other lenders." }
    ]
  }
];

export const counsellorsList = ["Anjali Sharma", "Sophia Sen", "Ravi Teja", "Priya Nair", "Karan Malhotra"];
export const countriesList = ["United Kingdom", "United States", "Canada", "Australia", "Germany"];
export const intakesList = ["Sep 2026", "Jan 2026", "May 2026"];
export const loanStatusesList = ["Pending", "Approved", "Sanctioned", "Rejected"];
export const visaStatusesList = ["Approved", "Applied", "Decision Pending", "Draft Pending"];

export const recentActivities = [
  {
    id: "act-1",
    type: "Visa Slot Booked",
    student: "Prasad Panjugula",
    counsellor: "Anjali Sharma",
    date: "05-Jun-2026",
    details: "VFS booking completed for June 8th."
  },
  {
    id: "act-2",
    type: "Offer Received",
    student: "Sandeep Kumar",
    counsellor: "Karan Malhotra",
    date: "12-Jun-2026",
    details: "Unconditional Offer from Bedfordshire."
  },
  {
    id: "act-3",
    type: "CAS Received",
    student: "Prasad Panjugula",
    counsellor: "Anjali Sharma",
    date: "15-Jun-2026",
    details: "CAS received from Coventry University."
  },
  {
    id: "act-4",
    type: "Loan Approved",
    student: "Akhil Kumar",
    counsellor: "Ravi Teja",
    date: "12-Jun-2026",
    details: "Self-funding source verified and approved."
  }
];
