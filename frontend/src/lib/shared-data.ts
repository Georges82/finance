export interface TeamLeader {
  id: string;
  name: string;
  email: string;
  phone: string;
  salaryType: 'Commission-based' | 'Fixed';
  commissionRate?: number;
  fixedSalary?: number;
  week1Salary: number;
  week2Salary: number;
  totalSalary: number;
  paymentStatus: 'Paid' | 'Not Paid';
  assignedModels: string[];
  status: 'Active' | 'Inactive';
}

export interface Model {
  id: string;
  modelName: string;
  clientAgencyName: string;
  managerName: string;
  teamLeader: string;
  earningsType: 'Type 1' | 'Type 2';
  status: 'Active' | 'Inactive';
  paymentStatus: 'Paid' | 'Not Paid';
  cutLogic: {
    type: 'Type 1' | 'Type 2';
    percentage1: number;
    threshold: number;
    fixedAmount: number;
    percentage2: number;
  };
  commissionRules: {
    baseCommission: number;
    bonusEnabled: boolean;
    bonusThreshold: number;
    bonusCommission: number;
  };
  notes: string;
}

export const teamLeaders: TeamLeader[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    email: 'alex.johnson@agency.com',
    phone: '+1 (555) 123-4567',
    salaryType: 'Commission-based',
    commissionRate: 15,
    week1Salary: 1200,
    week2Salary: 1350,
    totalSalary: 2550,
    paymentStatus: 'Paid',
    assignedModels: ['Anastasia', 'Sophie'],
    status: 'Active'
  },
  {
    id: '2',
    name: 'Samantha Ray',
    email: 'samantha.ray@agency.com',
    phone: '+1 (555) 234-5678',
    salaryType: 'Fixed',
    fixedSalary: 3000,
    week1Salary: 1500,
    week2Salary: 1500,
    totalSalary: 3000,
    paymentStatus: 'Not Paid',
    assignedModels: ['Isabella', 'Valentina'],
    status: 'Active'
  },
  {
    id: '3',
    name: 'Mike Williams',
    email: 'mike.williams@agency.com',
    phone: '+1 (555) 345-6789',
    salaryType: 'Commission-based',
    commissionRate: 12,
    week1Salary: 980,
    week2Salary: 1100,
    totalSalary: 2080,
    paymentStatus: 'Paid',
    assignedModels: ['Elena', 'Maria'],
    status: 'Active'
  },
  {
    id: '4',
    name: 'Sarah Chen',
    email: 'sarah.chen@agency.com',
    phone: '+1 (555) 456-7890',
    salaryType: 'Fixed',
    fixedSalary: 2800,
    week1Salary: 1400,
    week2Salary: 1400,
    totalSalary: 2800,
    paymentStatus: 'Not Paid',
    assignedModels: ['Sophia', 'Emma'],
    status: 'Inactive'
  }
];

export const models: Model[] = [
  {
    id: '1',
    modelName: 'Anastasia',
    clientAgencyName: 'Celestial Models',
    managerName: 'Admin',
    teamLeader: 'Alex Johnson',
    earningsType: 'Type 1',
    status: 'Active',
    paymentStatus: 'Paid',
    cutLogic: {
      type: 'Type 1',
      percentage1: 20,
      threshold: 5000,
      fixedAmount: 1000,
      percentage2: 0,
    },
    commissionRules: {
      baseCommission: 3,
      bonusEnabled: true,
      bonusThreshold: 1000,
      bonusCommission: 5,
    },
    notes: 'Top performing model.',
  },
  {
    id: '2',
    modelName: 'Isabella',
    clientAgencyName: 'Starlight Agency',
    managerName: 'Admin',
    teamLeader: 'Samantha Ray',
    earningsType: 'Type 2',
    status: 'Active',
    paymentStatus: 'Not Paid',
    cutLogic: {
      type: 'Type 2',
      percentage1: 0,
      threshold: 0,
      fixedAmount: 0,
      percentage2: 25,
    },
    commissionRules: {
      baseCommission: 4,
      bonusEnabled: false,
      bonusThreshold: 0,
      bonusCommission: 0,
    },
    notes: '',
  },
  {
    id: '3',
    modelName: 'Sophie',
    clientAgencyName: 'Celestial Models',
    managerName: 'Admin',
    teamLeader: 'Alex Johnson',
    earningsType: 'Type 1',
    status: 'Inactive',
    paymentStatus: 'Not Paid',
    cutLogic: {
      type: 'Type 1',
      percentage1: 15,
      threshold: 4000,
      fixedAmount: 800,
      percentage2: 0,
    },
    commissionRules: {
      baseCommission: 3,
      bonusEnabled: false,
      bonusThreshold: 0,
      bonusCommission: 0,
    },
    notes: 'On break.',
  },
  {
    id: '4',
    modelName: 'Valentina',
    clientAgencyName: 'Galaxy Management',
    managerName: 'Admin',
    teamLeader: 'Samantha Ray',
    earningsType: 'Type 2',
    status: 'Active',
    paymentStatus: 'Paid',
    cutLogic: {
      type: 'Type 2',
      percentage1: 0,
      threshold: 0,
      fixedAmount: 0,
      percentage2: 30,
    },
     commissionRules: {
      baseCommission: 3.5,
      bonusEnabled: true,
      bonusThreshold: 1200,
      bonusCommission: 6,
    },
    notes: '',
  },
  {
    id: '5',
    modelName: 'Elena',
    clientAgencyName: 'Starlight Agency',
    managerName: 'Admin',
    teamLeader: 'Mike Williams',
    earningsType: 'Type 1',
    status: 'Active',
    paymentStatus: 'Not Paid',
    cutLogic: {
      type: 'Type 1',
      percentage1: 18,
      threshold: 4500,
      fixedAmount: 900,
      percentage2: 0,
    },
    commissionRules: {
      baseCommission: 3.5,
      bonusEnabled: true,
      bonusThreshold: 800,
      bonusCommission: 4.5,
    },
    notes: 'New model, performing well.',
  },
  {
    id: '6',
    modelName: 'Maria',
    clientAgencyName: 'Galaxy Management',
    managerName: 'Admin',
    teamLeader: 'Mike Williams',
    earningsType: 'Type 2',
    status: 'Active',
    paymentStatus: 'Paid',
    cutLogic: {
      type: 'Type 2',
      percentage1: 0,
      threshold: 0,
      fixedAmount: 0,
      percentage2: 22,
    },
    commissionRules: {
      baseCommission: 3,
      bonusEnabled: false,
      bonusThreshold: 0,
      bonusCommission: 0,
    },
    notes: '',
  },
  {
    id: '7',
    modelName: 'Sophia',
    clientAgencyName: 'Celestial Models',
    managerName: 'Admin',
    teamLeader: 'Sarah Chen',
    earningsType: 'Type 1',
    status: 'Inactive',
    paymentStatus: 'Not Paid',
    cutLogic: {
      type: 'Type 1',
      percentage1: 16,
      threshold: 4200,
      fixedAmount: 850,
      percentage2: 0,
    },
    commissionRules: {
      baseCommission: 3.2,
      bonusEnabled: true,
      bonusThreshold: 900,
      bonusCommission: 4.8,
    },
    notes: 'Temporarily inactive.',
  },
  {
    id: '8',
    modelName: 'Emma',
    clientAgencyName: 'Starlight Agency',
    managerName: 'Admin',
    teamLeader: 'Sarah Chen',
    earningsType: 'Type 2',
    status: 'Inactive',
    paymentStatus: 'Paid',
    cutLogic: {
      type: 'Type 2',
      percentage1: 0,
      threshold: 0,
      fixedAmount: 0,
      percentage2: 28,
    },
    commissionRules: {
      baseCommission: 3.8,
      bonusEnabled: false,
      bonusThreshold: 0,
      bonusCommission: 0,
    },
    notes: 'On extended break.',
  }
];

// Helper functions
export const getActiveTeamLeaders = () => teamLeaders.filter(tl => tl.status === 'Active');
export const getActiveModels = () => models.filter(model => model.status === 'Active');
export const getActiveChatters = () => chatters.filter(chatter => chatter.status === 'active');
export const getModelNames = () => models.map(model => model.modelName);
export const getTeamLeaderNames = () => teamLeaders.map(tl => tl.name);
