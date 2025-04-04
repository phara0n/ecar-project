// Mock data for testing UI components
const mockCustomers = [
  {
    id: 1,
    name: "Ahmed Ben Ali",
    email: "ahmed.benali@gmail.com",
    phone: "+216 55 123 456",
    vehicles: 2,
    last_visit: "2024-04-01",
    status: "active",
    address: "123 Main St, Tunis"
  },
  {
    id: 2,
    name: "Fatima Mansour",
    email: "fatima.m@yahoo.fr",
    phone: "+216 99 876 543",
    vehicles: 1,
    last_visit: "2024-03-28",
    status: "active",
    address: "456 Olive Ave, Sfax"
  },
  {
    id: 3,
    name: "Mohammed Trabelsi",
    email: "m.trabelsi@hotmail.com",
    phone: "+216 21 987 654",
    vehicles: 3,
    last_visit: "2024-03-15",
    status: "active",
    address: "789 Palm Rd, Sousse"
  },
  {
    id: 4,
    name: "Leila Ben Salah",
    email: "leila.bensalah@gmail.com",
    phone: "+216 52 789 123",
    vehicles: 1,
    last_visit: "2024-02-22",
    status: "inactive",
    address: "321 Cedar Blvd, Monastir"
  },
  {
    id: 5,
    name: "Karim Jebali",
    email: "karim.j@outlook.com",
    phone: "+216 97 321 654",
    vehicles: 2,
    last_visit: "2024-04-02",
    status: "active",
    address: "654 Pine St, Hammamet"
  },
];

const mockVehicles = [
  {
    id: 1,
    make: "Volkswagen",
    model: "Golf",
    year: 2018,
    license_plate: "123 TUN 4567",
    vin: "1HGCM82633A123456",
    customer: 1,
    status: "active"
  },
  {
    id: 2,
    make: "Renault",
    model: "Clio",
    year: 2019,
    license_plate: "234 TUN 5678",
    vin: "2FMDK48C87BB12345",
    customer: 1,
    status: "active"
  },
  {
    id: 3,
    make: "Peugeot",
    model: "208",
    year: 2020,
    license_plate: "345 TUN 6789",
    vin: "3VWFE21C04M123456",
    customer: 2,
    status: "active"
  },
  {
    id: 4,
    make: "Citroën",
    model: "C3",
    year: 2017,
    license_plate: "456 TUN 7890",
    vin: "4T1BF22K51U123456",
    customer: 3,
    status: "active"
  },
  {
    id: 5,
    make: "Fiat",
    model: "500",
    year: 2021,
    license_plate: "567 TUN 8901",
    vin: "5YJSA1DN5CFP12345",
    customer: 3,
    status: "active"
  },
  {
    id: 6,
    make: "Mercedes",
    model: "C-Class",
    year: 2019,
    license_plate: "678 TUN 9012",
    vin: "6G1MK52Y0VP123456",
    customer: 3,
    status: "active"
  },
  {
    id: 7,
    make: "BMW",
    model: "3 Series",
    year: 2018,
    license_plate: "789 TUN 0123",
    vin: "7FARW2H52JE123456",
    customer: 4,
    status: "inactive"
  },
  {
    id: 8,
    make: "Audi",
    model: "A4",
    year: 2020,
    license_plate: "890 TUN 1234",
    vin: "8JTHBJ46G1Y123456",
    customer: 5,
    status: "active"
  },
  {
    id: 9,
    make: "Toyota",
    model: "Corolla",
    year: 2017,
    license_plate: "901 TUN 2345",
    vin: "9JTDKN3DU0D123456",
    customer: 5,
    status: "active"
  },
];

// Helper function to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Customer mock services
export const mockCustomerService = {
  getAll: async () => {
    await delay(800); // Simulate network delay
    return { data: mockCustomers };
  },
  
  getById: async (id: number) => {
    await delay(500);
    const customer = mockCustomers.find(c => c.id === id);
    if (!customer) {
      return Promise.reject({ response: { status: 404, data: { detail: "Customer not found" } } });
    }
    return { data: customer };
  },
  
  create: async (data: any) => {
    await delay(800);
    const newCustomer = {
      ...data,
      id: Math.max(...mockCustomers.map(c => c.id)) + 1,
      vehicles: 0,
      status: "active",
      last_visit: null
    };
    mockCustomers.push(newCustomer);
    return { data: newCustomer };
  },
  
  update: async (id: number, data: any) => {
    await delay(800);
    const index = mockCustomers.findIndex(c => c.id === id);
    if (index === -1) {
      return Promise.reject({ response: { status: 404, data: { detail: "Customer not found" } } });
    }
    
    const updatedCustomer = {
      ...mockCustomers[index],
      ...data
    };
    mockCustomers[index] = updatedCustomer;
    return { data: updatedCustomer };
  },
  
  delete: async (id: number) => {
    await delay(800);
    const index = mockCustomers.findIndex(c => c.id === id);
    if (index === -1) {
      return Promise.reject({ response: { status: 404, data: { detail: "Customer not found" } } });
    }
    
    mockCustomers.splice(index, 1);
    return { data: { success: true } };
  }
};

// Vehicle mock services
export const mockVehicleService = {
  getAll: async () => {
    await delay(800);
    return { data: mockVehicles };
  },
  
  getById: async (id: number) => {
    await delay(500);
    const vehicle = mockVehicles.find(v => v.id === id);
    if (!vehicle) {
      return Promise.reject({ response: { status: 404, data: { detail: "Vehicle not found" } } });
    }
    return { data: vehicle };
  },
  
  getByCustomer: async (customerId: number) => {
    await delay(600);
    const vehicles = mockVehicles.filter(v => v.customer === customerId);
    return { data: vehicles };
  },
  
  create: async (data: any) => {
    await delay(800);
    const newVehicle = {
      ...data,
      id: Math.max(...mockVehicles.map(v => v.id)) + 1,
      status: "active"
    };
    mockVehicles.push(newVehicle);
    return { data: newVehicle };
  },
  
  update: async (id: number, data: any) => {
    await delay(800);
    const index = mockVehicles.findIndex(v => v.id === id);
    if (index === -1) {
      return Promise.reject({ response: { status: 404, data: { detail: "Vehicle not found" } } });
    }
    
    const updatedVehicle = {
      ...mockVehicles[index],
      ...data
    };
    mockVehicles[index] = updatedVehicle;
    return { data: updatedVehicle };
  },
  
  delete: async (id: number) => {
    await delay(800);
    const index = mockVehicles.findIndex(v => v.id === id);
    if (index === -1) {
      return Promise.reject({ response: { status: 404, data: { detail: "Vehicle not found" } } });
    }
    
    mockVehicles.splice(index, 1);
    return { data: { success: true } };
  }
}; 