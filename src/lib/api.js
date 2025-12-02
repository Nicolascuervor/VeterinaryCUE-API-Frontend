
// This is a mock API service that uses localStorage to simulate a backend.
// In a production environment, these functions would use fetch() to call real API endpoints.

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const INITIAL_DATA = {
  users: [
    { id: '1', name: 'Admin User', email: 'admin@vetcue.com', role: 'admin' },
    { id: '2', name: 'Dr. Smith', email: 'smith@vetcue.com', role: 'veterinarian' },
    { id: '3', name: 'John Doe', email: 'john@example.com', role: 'owner' },
  ],
  pets: [
    { id: '1', name: 'Max', species: 'Dog', breed: 'Golden Retriever', owner: 'John Doe', age: 5 },
    { id: '2', name: 'Luna', species: 'Cat', breed: 'Siamese', owner: 'Jane Smith', age: 2 },
  ],
  appointments: [
    { id: '1', date: '2023-10-25', time: '10:00', pet: 'Max', vet: 'Dr. Smith', reason: 'Checkup' },
    { id: '2', date: '2023-10-26', time: '14:30', pet: 'Luna', vet: 'Dr. Smith', reason: 'Vaccination' },
  ],
  veterinarians: [
    { id: '1', name: 'Dr. Smith', specialization: 'Surgery', license: 'VET-12345', phone: '555-0101' },
    { id: '2', name: 'Dr. Jones', specialization: 'Dermatology', license: 'VET-67890', phone: '555-0102' },
  ],
  clinics: [
    { id: '1', name: 'Main Campus Clinic', address: 'University Ave 123', phone: '555-1000' },
    { id: '2', name: 'Downtown Satellite', address: 'Main St 456', phone: '555-2000' },
  ],
  products: [
    { id: '1', name: 'Premium Dog Food', category: 'Food', price: 45.99, sku: 'FOOD-001' },
    { id: '2', name: 'Flea Collar', category: 'Accessories', price: 15.50, sku: 'ACC-002' },
  ],
  inventory: [
    { id: '1', product: 'Premium Dog Food', quantity: 50, location: 'Warehouse A' },
    { id: '2', product: 'Flea Collar', quantity: 120, location: 'Shelf B3' },
  ]
};

const getStorageData = () => {
  const data = localStorage.getItem('vetcue_db');
  if (data) return JSON.parse(data);
  
  localStorage.setItem('vetcue_db', JSON.stringify(INITIAL_DATA));
  return INITIAL_DATA;
};

const setStorageData = (data) => {
  localStorage.setItem('vetcue_db', JSON.stringify(data));
};

export const api = {
  get: async (entity) => {
    await delay(300); // Simulate network latency
    const db = getStorageData();
    return db[entity] || [];
  },

  create: async (entity, item) => {
    await delay(300);
    const db = getStorageData();
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
    
    if (!db[entity]) db[entity] = [];
    db[entity].push(newItem);
    
    setStorageData(db);
    return newItem;
  },

  update: async (entity, id, item) => {
    await delay(300);
    const db = getStorageData();
    
    if (!db[entity]) return null;
    
    const index = db[entity].findIndex(i => i.id === id);
    if (index === -1) return null;
    
    db[entity][index] = { ...db[entity][index], ...item };
    setStorageData(db);
    return db[entity][index];
  },

  delete: async (entity, id) => {
    await delay(300);
    const db = getStorageData();
    
    if (!db[entity]) return false;
    
    db[entity] = db[entity].filter(i => i.id !== id);
    setStorageData(db);
    return true;
  }
};
