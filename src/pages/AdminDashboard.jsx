
import React, { useState, useEffect } from 'react';
import { 
  Users, Cat, Calendar, Stethoscope, Building2, ShoppingBag, Warehouse, 
  Plus, Pencil, Trash2, Search, LogOut, LayoutDashboard, Loader2, CalendarClock, Sparkles,
  Syringe, Scissors, Activity, HeartPulse, FileText, Clock, AlertCircle, Eye, Info, Thermometer,
  FolderTree
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Logo from '@/components/Logo';
import InventoryProducts from '@/components/InventoryProducts';
import InventoryCategories from '@/components/InventoryCategories';

// Helper to parse JWT
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

const DAYS_MAP = {
  MONDAY: 'Lunes',
  TUESDAY: 'Martes',
  WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves',
  FRIDAY: 'Viernes',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo'
};

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  
  // Data specific for Pets logic
  const [ownersList, setOwnersList] = useState([]);
  const [ownersMap, setOwnersMap] = useState({}); 

  // Data specific for Agendas logic
  const [veterinariansList, setVeterinariansList] = useState([]);
  const [selectedVetId, setSelectedVetId] = useState('');
  const [agendaData, setAgendaData] = useState([]);
  const [loadingAgenda, setLoadingAgenda] = useState(false);

  // Data specific for Appointments logic
  const [servicesList, setServicesList] = useState([]);
  const [petsForForm, setPetsForForm] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [formData, setFormData] = useState({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  
  // Details Modal State
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Bulk Generate Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkDays, setBulkDays] = useState([]);
  
  const [bulkTimes, setBulkTimes] = useState({
    horaInicioJornada: '',
    horaFinJornada: '',
    horaInicioDescanso: '',
    horaFinDescanso: ''
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // --- Entity Configurations ---
  const ENTITIES = {
    users: {
      label: 'Usuarios',
      icon: Users,
      color: 'text-blue-500',
      columns: ['id', 'foto', 'nombre', 'apellido', 'correo', 'telefono', 'direccion', 'userRole', 'activo', 'createdAt', 'updatedAt'],
      headers: ['ID', 'Foto', 'Nombre', 'Apellido', 'Correo', 'Teléfono', 'Dirección', 'Rol', 'Estado', 'Creado', 'Actualizado'],
      fields: [
        { name: 'nombre', label: 'Nombre', type: 'text' },
        { name: 'apellido', label: 'Apellido', type: 'text' },
        { name: 'correo', label: 'Correo', type: 'email' },
        { name: 'contrasenia', label: 'Contraseña', type: 'password', showOnEdit: false },
        { name: 'telefono', label: 'Teléfono', type: 'tel' },
        { name: 'direccion', label: 'Dirección', type: 'text' },
        { 
          name: 'userRole', 
          label: 'Rol', 
          type: 'select', 
          options: [
            { value: 'ROLE_ADMIN', label: 'Administrador' },
            { value: 'ROLE_VETERINARIO', label: 'Veterinario' },
            { value: 'ROLE_DUENIO', label: 'Dueño' }
          ] 
        },
        { name: 'especialidad', label: 'Especialidad', type: 'text', showIfRole: 'ROLE_VETERINARIO' },
        { name: 'activo', label: 'Activo', type: 'select', options: ['true', 'false'] }
      ]
    },
    veterinarians: {
      label: 'Veterinarios',
      icon: Stethoscope,
      color: 'text-green-500',
      columns: ['id', 'foto', 'nombre', 'apellido', 'correo', 'telefono', 'especialidad', 'activo'],
      headers: ['ID', 'Foto', 'Nombre', 'Apellido', 'Correo', 'Teléfono', 'Especialidad', 'Estado'],
      fields: [
        { name: 'nombre', label: 'Nombre', type: 'text' },
        { name: 'apellido', label: 'Apellido', type: 'text' },
        { name: 'correo', label: 'Correo', type: 'email' },
        { name: 'contrasenia', label: 'Contraseña', type: 'password', showOnEdit: false },
        { name: 'telefono', label: 'Teléfono', type: 'tel' },
        { name: 'direccion', label: 'Dirección', type: 'text' },
        { name: 'especialidad', label: 'Especialidad', type: 'text' },
        { name: 'activo', label: 'Activo', type: 'select', options: ['true', 'false'] }
      ]
    },
    pets: {
      label: 'Mascotas',
      icon: Cat,
      color: 'text-orange-500',
      columns: ['id', 'nombre', 'especie', 'raza', 'sexo', 'color', 'peso', 'duenioId', 'active'], 
      headers: ['ID', 'Nombre', 'Especie', 'Raza', 'Sexo', 'Color', 'Peso (kg)', 'Dueño', 'Estado'], 
      fields: [
        { name: 'nombre', label: 'Nombre', type: 'text' },
        { name: 'especie', label: 'Especie', type: 'text' },
        { name: 'raza', label: 'Raza', type: 'text' },
        { name: 'fechaNacimiento', label: 'Fecha Nacimiento', type: 'date' },
        { name: 'sexo', label: 'Sexo', type: 'select', options: ['Macho', 'Hembra'] },
        { name: 'color', label: 'Color', type: 'text' },
        { name: 'peso', label: 'Peso', type: 'number' },
        { name: 'duenioId', label: 'Dueño', type: 'custom_owner_select' }, 
        { name: 'active', label: 'Activo', type: 'select', options: ['true', 'false'], showOnCreate: false }
      ]
    },
    services: {
      label: 'Servicios',
      icon: Activity,
      color: 'text-indigo-600',
      columns: ['iconType', 'nombre', 'tipoServicio', 'descripcion', 'precio', 'duracionPromedioMinutos'],
      headers: ['', 'Nombre', 'Tipo', 'Descripción', 'Precio', 'Duración (min)'],
      fields: [
        { name: 'tipoServicio', label: 'Tipo de Servicio', type: 'select', options: [
            { value: 'CONSULTA', label: 'Consulta' },
            { value: 'CIRUGIA', label: 'Cirugía' },
            { value: 'VACUNACION', label: 'Vacunación' },
            { value: 'ESTETICA', label: 'Estética' }
          ] 
        },
        { name: 'nombre', label: 'Nombre', type: 'text' },
        { name: 'descripcion', label: 'Descripción', type: 'text' },
        { name: 'precio', label: 'Precio', type: 'number' },
        { name: 'duracionPromedioMinutos', label: 'Duración (min)', type: 'number' },
        { name: 'requiereQuirofano', label: 'Requiere Quirófano', type: 'select', options: ['true', 'false'], showIfType: 'CIRUGIA' },
        { name: 'notasPreoperatorias', label: 'Notas Preoperatorias', type: 'text', showIfType: 'CIRUGIA' },
        { name: 'nombreBiologico', label: 'Nombre Biológico', type: 'text', showIfType: 'VACUNACION' },
        { name: 'tipoArreglo', label: 'Tipo de Arreglo', type: 'text', showIfType: 'ESTETICA' }
      ]
    },
    agendas: {
      label: 'Agendas',
      icon: CalendarClock,
      color: 'text-teal-500',
      customRender: true,
      columns: [],
      headers: [],
      fields: []
    },
    appointments: {
      label: 'Citas',
      icon: Calendar,
      color: 'text-purple-500',
      columns: ['id', 'fechaInicio', 'mascotaNombre', 'veterinarioNombre', 'servicioNombre', 'estado'],
      headers: ['ID', 'Fecha y Hora', 'Mascota', 'Veterinario', 'Servicio', 'Estado'],
      fields: [] // Using custom form
    },
    clinics: {
      label: 'Clínicas',
      icon: Building2,
      color: 'text-indigo-500',
      columns: ['name', 'address', 'phone'],
      headers: ['Nombre', 'Dirección', 'Teléfono'],
      fields: [
        { name: 'name', label: 'Nombre', type: 'text' },
        { name: 'address', label: 'Dirección', type: 'text' },
        { name: 'phone', label: 'Teléfono', type: 'tel' }
      ]
    },
    products: {
      label: 'Productos',
      icon: ShoppingBag,
      color: 'text-pink-500',
      columns: ['name', 'category', 'price', 'sku'],
      headers: ['Nombre', 'Categoría', 'Precio', 'SKU'],
      fields: [
        { name: 'name', label: 'Nombre', type: 'text' },
        { name: 'category', label: 'Categoría', type: 'text' },
        { name: 'price', label: 'Precio', type: 'number' },
        { name: 'sku', label: 'SKU', type: 'text' }
      ]
    },
    'inventory-products': {
      label: 'Productos',
      icon: ShoppingBag,
      color: 'text-pink-500',
      customRender: true,
      columns: [],
      headers: [],
      fields: []
    },
    'inventory-categories': {
      label: 'Categorías',
      icon: FolderTree,
      color: 'text-teal-500',
      customRender: true,
      columns: [],
      headers: [],
      fields: []
    }
  };

  const currentConfig = ENTITIES[activeTab];

  // Initial User Identification
  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      const decoded = parseJwt(token);
      let userId = localStorage.getItem('userId');
      
      if (!userId) {
          const userInfoStr = localStorage.getItem('userInfo');
          if (userInfoStr) {
              try {
                  const userInfo = JSON.parse(userInfoStr);
                  userId = userInfo.id || userInfo.userId;
              } catch (e) {}
          }
      }

      if (!userId && decoded) {
          userId = decoded.userId || decoded.id || decoded.sub; 
      }

      if (decoded) {
        // Improved Role Extraction
        let role = 'ROLE_DUENIO'; // Default
        if (decoded.roles && Array.isArray(decoded.roles)) {
            if (decoded.roles.includes('ROLE_ADMIN')) role = 'ROLE_ADMIN';
            else if (decoded.roles.includes('ROLE_VETERINARIO')) role = 'ROLE_VETERINARIO';
            else role = decoded.roles[0];
        } else if (decoded.role) {
            role = decoded.role;
        } else if (decoded.authorities?.[0]) {
             const auth = decoded.authorities[0];
             role = (typeof auth === 'object') ? auth.authority : auth;
        }

        setCurrentUser({
          id: userId, 
          role: role,
          email: decoded.sub
        });
      }
    }
  }, []);

  // Fetch active tab data
  useEffect(() => {
    // Log at the very start of this useEffect
    console.log("🔵 useEffect (activeTab/currentUser) triggered. Current activeTab:", activeTab);

    if (activeTab === 'pets' && !currentUser) return;
    if (activeTab === 'agendas') {
      fetchAuxiliaryData();
      return;
    }
    if (activeTab === 'appointments') {
      console.log("🔵 Effect triggered: activeTab is appointments. Calling fetchPetsForAppointments...");
      fetchPetsForAppointments();
      fetchAuxiliaryData(); // Fetch other data like services/vets
    }
    fetchData();
  }, [activeTab, currentUser]); 

  // Dedicated function for pets
  const fetchPetsForAppointments = async () => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      console.error("❌ fetchPetsForAppointments Aborted: No token found in localStorage");
      return;
    }

    const url = 'https://api.veterinariacue.com/api/mascotas';
    console.log(`🚀 [1] fetchPetsForAppointments START`);
    console.log(`🔗 [2] Calling URL: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
      });

      console.log(`📡 [3] Response Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const petsData = await response.json();
        console.log(`📦 [4] Full Response Data:`, petsData);
        
        if (Array.isArray(petsData)) {
          setPetsForForm(petsData);
          console.log(`💾 [5] State Updated: petsForForm set with ${petsData.length} items`);
        } else {
          console.warn(`⚠️ [5] Warning: Response is not an array. Setting empty array.`);
          setPetsForForm([]);
        }
      } else {
        const errorText = await response.text();
        console.error(`❌ [4] API Error Details:`, errorText);
        
        // Fallback: Try fetching by owner if global fails
        if (currentUser?.id && !String(currentUser.id).includes('@')) {
             const fallbackUrl = `https://api.veterinariacue.com/api/mascotas/owner/${currentUser.id}`;
             console.log(`🔄 Attempting fallback fetch by owner ID: ${fallbackUrl}`);
             const fallbackRes = await fetch(fallbackUrl, {
                 headers: { 'Authorization': `Bearer ${token}` }
             });
             if (fallbackRes.ok) {
                 const fallbackPets = await fallbackRes.json();
                 console.log(`📦 Fallback Data:`, fallbackPets);
                 setPetsForForm(Array.isArray(fallbackPets) ? fallbackPets : []);
             } else {
                 console.error(`❌ Fallback failed with status: ${fallbackRes.status}`);
             }
        }
      }
    } catch (error) {
      console.error(`🔥 [CRITICAL] Fetch Error:`, error);
    }
  };

  const fetchAuxiliaryData = async () => {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;
    
    try {
      // Fetch Vets
      const userRes = await fetch('https://api.veterinariacue.com/api/auth/active/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (userRes.ok) {
        const users = await userRes.json();
        const vets = users.filter(u => u.userRole === 'ROLE_VETERINARIO' || u.role === 'ROLE_VETERINARIO');
        setVeterinariansList(vets);
      }

      // Fetch Services if needed
      if (activeTab === 'appointments') {
         const srvRes = await fetch('https://api.veterinariacue.com/api/agendamiento/servicios-admin', {
           headers: { 'Authorization': `Bearer ${token}` }
         });
         if (srvRes.ok) {
           setServicesList(await srvRes.json());
         }
         
         await fetchAndMapOwners();
      }
    } catch (error) {
      console.error("❌ Error in fetchAuxiliaryData:", error);
    }
  };

  // Fetch Jornadas when vet selected
  useEffect(() => {
    if (activeTab === 'agendas' && selectedVetId) {
      fetchAgendaData(selectedVetId);
    }
  }, [selectedVetId, activeTab]);

  const fetchAgendaData = async (vetId) => {
    setLoadingAgenda(true);
    const token = localStorage.getItem('jwtToken');
    try {
      const response = await fetch(`https://api.veterinariacue.com/api/agendamiento/jornada/veterinario/${vetId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAgendaData(data);
      } else {
        setAgendaData([]);
        toast({ title: "Info", description: "No hay agenda configurada o error al cargar." });
      }
    } catch (error) {
      console.error("Error fetching agenda:", error);
      toast({ title: "Error", description: "No se pudo cargar la agenda.", variant: "destructive" });
    } finally {
      setLoadingAgenda(false);
    }
  };

  const fetchAndMapOwners = async () => {
      console.log("OWNERS FETCH: fetchAndMapOwners function called."); // Log at the beginning of the function
      const token = localStorage.getItem('jwtToken');
      if (!token) return;
      try {
          const response = await fetch('https://api.veterinariacue.com/api/auth/active/users', {
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
          });
          if (response.ok) {
              const allUsers = await response.json();
              console.log("OWNERS FETCH: Raw API response before filtering:", allUsers); // Log raw API response

              const owners = allUsers.filter(u => 
                u.userRole === 'ROLE_DUENIO' || u.role === 'ROLE_DUENIO' || 
                (u.authorities && u.authorities.some(a => a.authority === 'ROLE_DUENIO'))
              );
              console.log("OWNERS FETCHED:", owners); // Log the complete ownersList
              
              console.log("OWNERS FETCH: Iterating through ownersList to show properties:");
              owners.forEach(owner => {
                console.log(`  Owner ID: ${owner.id}, Nombre: ${owner.nombre}, Apellido: ${owner.apellido}, Correo: ${owner.correo}`);
                // You can add more properties here as needed, e.g., owner.telefono, owner.direccion, etc.
              });

              const map = {};
              owners.forEach(owner => { map[owner.id] = `${owner.nombre} ${owner.apellido}`; });
              console.log("ownersMap after creation:", map); // Log the resulting ownersMap
              setOwnersList(owners);
              setOwnersMap(map);
          }
      } catch (error) { console.error("Error fetching owners:", error); }
  };

  const fetchData = async () => {
    if (activeTab === 'agendas') return; 
    setLoading(true);
    setData([]); 
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token && (activeTab === 'users' || activeTab === 'pets' || activeTab === 'veterinarians' || activeTab === 'services' || activeTab === 'appointments')) {
        toast({ title: "Sesión expirada", description: "Inicia sesión nuevamente.", variant: "destructive" });
        navigate('/login');
        return;
      }

      if (activeTab === 'users' || activeTab === 'veterinarians') {
        const response = await fetch('https://api.veterinariacue.com/api/auth/active/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const allUsers = await response.json();
          if (activeTab === 'veterinarians') {
             const vets = allUsers.filter(u => 
               u.userRole === 'ROLE_VETERINARIO' || 
               u.role === 'ROLE_VETERINARIO' || 
               (u.authorities && u.authorities.some(a => a.authority === 'ROLE_VETERINARIO'))
             );
             setData(vets);
          } else {
             setData(allUsers);
          }
        } else {
          throw new Error("Error al obtener usuarios");
        }
      } 
      else if (activeTab === 'pets') {
        if (!currentUser) return;
        await fetchAndMapOwners();
        const response = await fetch('https://api.veterinariacue.com/api/mascotas', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          let petData = await response.json();
          setData(petData);
        } else {
           throw new Error("Error al obtener mascotas");
        }
      }
      else if (activeTab === 'services') {
        const response = await fetch('https://api.veterinariacue.com/api/agendamiento/servicios-admin', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          let servicesData = await response.json();
          setData(servicesData);
        } else {
           throw new Error("Error al obtener servicios");
        }
      }
      else if (activeTab === 'appointments') {
        const response = await fetch('https://api.veterinariacue.com/api/citas/all', { // Changed endpoint here
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
           const citas = await response.json();
           // CRITICAL: Log the raw API response for appointments
           console.log("Raw API response for appointments:", citas);
           setData(citas);
        } else {
           throw new Error("Error al obtener citas");
        }
      }
      else {
        const result = await api.get(activeTab);
        setData(result);
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: `No se cargaron datos de ${activeTab}.`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---
  const handleCreate = () => {
    setCurrentRecord(null);
    setFormData({});
    
    if (activeTab === 'pets' && currentUser?.role === 'ROLE_DUENIO') {
      setFormData({ duenioId: currentUser.id }); 
    }
    if (activeTab === 'agendas') {
      setFormData({ veterinarioId: selectedVetId });
    }
    if (activeTab === 'veterinarians') {
      setFormData({ userRole: 'ROLE_VETERINARIO' });
    }
    if (activeTab === 'services') {
      setFormData({ tipoServicio: 'CONSULTA' });
    }
    if (activeTab === 'appointments') {
      // Ensure we have fresh data when opening modal
      fetchPetsForAppointments(); // Always fetch fresh pets when creating an appointment
      
      if (currentUser?.role === 'ROLE_DUENIO') {
        setFormData({ ownerId: currentUser.id });
      }
    }

    setIsModalOpen(true);
  };

  const handleBulkCreate = () => {
    setBulkDays([]);
    setBulkTimes({
      horaInicioJornada: '',
      horaFinJornada: '',
      horaInicioDescanso: '',
      horaFinDescanso: ''
    });
    setIsBulkModalOpen(true);
  };

  const handleEdit = (record) => {
    setCurrentRecord(record);
    let editData = { ...record };
    
    if (typeof editData.active === 'boolean') editData.active = editData.active ? 'true' : 'false';
    if (activeTab === 'pets' && editData.fechaNacimiento) editData.fechaNacimiento = editData.fechaNacimiento.split('T')[0];
    
    if (activeTab === 'agendas') {
      if (editData.horaInicioJornada) editData.horaInicioJornada = editData.horaInicioJornada.substring(0, 5);
      if (editData.horaFinJornada) editData.horaFinJornada = editData.horaFinJornada.substring(0, 5);
      if (editData.horaInicioDescanso) editData.horaInicioDescanso = editData.horaInicioDescanso.substring(0, 5);
      if (editData.horaFinDescanso) editData.horaFinDescanso = editData.horaFinDescanso.substring(0, 5);
    }

    if (activeTab === 'services') {
        if (typeof editData.requiereQuirofano === 'boolean') editData.requiereQuirofano = editData.requiereQuirofano ? 'true' : 'false';
    }
    
    if (activeTab === 'appointments') {
       // Normalize date from 'fechahora' or 'fechayhora' if 'fechaInicio' is not set
       if (!editData.fechaInicio) {
           editData.fechaInicio = editData.fechaHoraInicio || editData.fechayhora || editData.fechahora;
       }

       // Prepare data for editing appointment
       if (editData.fechaInicio) {
          const d = new Date(editData.fechaInicio);
          // Check if date is valid and format to ISO string for input (YYYY-MM-DDThh:mm)
          if (!isNaN(d.getTime())) {
             const offset = d.getTimezoneOffset() * 60000;
             // Create local ISO string
             editData.fechaInicio = (new Date(d.getTime() - offset)).toISOString().slice(0, 16);
          }
       }
       
       // Map flat IDs if needed or fallback to nested objects
       let petId = editData.petId || editData.mascota?.id;
       let ownerId = editData.ownerId || editData.mascota?.duenioId || editData.mascota?.duenio?.id;
       
       // Try to derive owner from pet if missing
       if (!ownerId && petId && Array.isArray(petsForForm)) {
           const foundPet = petsForForm.find(p => p.id == petId);
           if (foundPet) {
               ownerId = foundPet.duenioId || foundPet.duenio?.id;
           }
       }

       editData.ownerId = ownerId;
       editData.petId = petId;
       editData.veterinarianId = editData.veterinarianId || editData.veterinario?.id;
       editData.servicioId = editData.servicioId || editData.servicio?.id;
       editData.motivoConsulta = editData.motivoConsulta || editData.motivo; // Map 'motivo' to 'motivoConsulta'

       // Ensure pets are available for edit mode
       fetchPetsForAppointments(); // Always fetch fresh pets when editing an appointment
    }

    setFormData(editData);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id) => {
    setRecordToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleViewDetails = async (id) => {
    setLoadingDetails(true);
    setIsDetailsModalOpen(true);
    setAppointmentDetails(null);
    
    const token = localStorage.getItem('jwtToken');
    try {
      const response = await fetch(`https://api.veterinariacue.com/api/citas/${id}/detail`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Raw Appointment Details:", data);

        // Enrich data
        let enriched = { ...data };
        
        // --- Enrich Pet Name ---
        const pId = enriched.petId || enriched.mascota?.id;
        let foundPet = null;
        
        // Log current petsForForm for debugging
        console.log("petsForForm for pet lookup:", petsForForm);

        // Look in petsForForm array (which is populated if appointments tab is active)
        if (pId && Array.isArray(petsForForm)) {
             foundPet = petsForForm.find(p => String(p.id) === String(pId));
        }

        if (foundPet) {
            enriched.petName = foundPet.nombre;
            console.log(`Pet lookup successful for ID ${pId}. Found pet:`, foundPet);
        } else {
            // Fallback
            enriched.petName = enriched.mascota?.nombre || enriched.mascotaNombre;
            console.log(`Pet lookup for ID ${pId} failed in petsForForm. Using fallback name: ${enriched.petName}`);
        }

        // --- Enrich Owner Name ---
        // Determine Owner ID from Detail or from found Pet
        const oId = enriched.duenioId || enriched.duenio?.id || (foundPet && foundPet.duenioId) || (foundPet && foundPet.duenio?.id) || (enriched.mascota && enriched.mascota.duenioId);
        console.log("Attempting owner lookup for owner ID:", oId);
        console.log("Current ownersList for owner lookup:", ownersList);
        console.log("Current ownersMap for owner lookup:", ownersMap);

        if (oId) {
            let ownerNameFound = null;
            // Try ownersMap first (O(1))
            if (ownersMap[oId]) {
                ownerNameFound = ownersMap[oId];
                console.log(`Owner lookup successful in ownersMap for ID ${oId}:`, ownerNameFound);
            } else {
                // Try array find
                const foundOwner = ownersList.find(o => String(o.id) === String(oId));
                if (foundOwner) {
                    ownerNameFound = `${foundOwner.nombre} ${foundOwner.apellido}`;
                    console.log(`Owner lookup successful in ownersList for ID ${oId}:`, foundOwner);
                } else {
                    console.log(`Owner lookup for ID ${oId} failed in both ownersMap and ownersList.`);
                }
            }
            enriched.ownerName = ownerNameFound;
        }
        
        // Ultimate fallback if still not found
        if (!enriched.ownerName) {
             if (enriched.duenio?.nombre) enriched.ownerName = `${enriched.duenio.nombre} ${enriched.duenio.apellido}`;
             else if (enriched.mascota?.duenio?.nombre) enriched.ownerName = `${enriched.mascota.duenio.nombre} ${enriched.mascota.duenio.apellido}`;
             console.log("Final fallback for owner name:", enriched.ownerName);
        }

        setAppointmentDetails(enriched);
        console.log("Enriched Appointment Details (after owner/pet name assignment):", enriched);
      } else {
        throw new Error("Error al cargar detalles");
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "No se pudieron cargar los detalles.", variant: "destructive" });
      setIsDetailsModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const confirmDelete = async () => {
    if (recordToDelete) {
      const token = localStorage.getItem('jwtToken');
      try {
        if (activeTab === 'pets') {
          const response = await fetch(`https://api.veterinariacue.com/api/mascotas/desactivar/${recordToDelete}`, {
            method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
             toast({ title: "Éxito", description: "Mascota desactivada." });
             fetchData();
          }
        } else if (activeTab === 'users' || activeTab === 'veterinarians') {
          await api.delete(activeTab, recordToDelete);
          toast({ title: "Éxito", description: "Usuario eliminado (Mock)." });
          setData(prev => prev.filter(item => item.id !== recordToDelete));
        } else if (activeTab === 'services') {
          const response = await fetch(`https://api.veterinariacue.com/api/agendamiento/servicios-admin/${recordToDelete}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            toast({ title: "Éxito", description: "Servicio eliminado." });
            fetchData();
          } else {
            throw new Error("Error eliminando servicio");
          }
        } else if (activeTab === 'appointments') {
          const response = await fetch(`https://api.veterinariacue.com/api/citas/${recordToDelete}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            toast({ title: "Éxito", description: "Cita eliminada." });
            fetchData();
          } else {
             throw new Error("Error eliminando cita");
          }
        } else {
          await api.delete(activeTab, recordToDelete);
          toast({ title: "Éxito", description: "Registro eliminado." });
          setData(prev => prev.filter(item => item.id !== recordToDelete));
        }
      } catch (error) {
        toast({ title: "Error", description: "No se pudo realizar la acción.", variant: "destructive" });
      }
    }
    setDeleteConfirmOpen(false);
    setRecordToDelete(null);
  };

  const handleAgendaToggle = async (id, currentStatus) => {
    const token = localStorage.getItem('jwtToken');
    try {
      const response = await fetch(`https://api.veterinariacue.com/api/agendamiento/jornada/${id}/estado?activa=${!currentStatus}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast({ title: "Actualizado", description: "Estado de jornada actualizado." });
        fetchAgendaData(selectedVetId);
      } else {
        throw new Error("Falló actualización");
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudo cambiar el estado.", variant: "destructive" });
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    
    if (bulkDays.length === 0) {
      toast({ title: "Error", description: "Debe seleccionar al menos un día.", variant: "destructive" });
      return;
    }

    const token = localStorage.getItem('jwtToken');
    
    try {
      const payload = {
        veterinarioId: selectedVetId,
        diasSeleccionados: bulkDays,
        horaInicioJornada: bulkTimes.horaInicioJornada.length === 5 ? bulkTimes.horaInicioJornada + ':00' : bulkTimes.horaInicioJornada,
        horaFinJornada: bulkTimes.horaFinJornada.length === 5 ? bulkTimes.horaFinJornada + ':00' : bulkTimes.horaFinJornada,
        horaInicioDescanso: bulkTimes.horaInicioDescanso.length === 5 ? bulkTimes.horaInicioDescanso + ':00' : bulkTimes.horaInicioDescanso,
        horaFinDescanso: bulkTimes.horaFinDescanso.length === 5 ? bulkTimes.horaFinDescanso + ':00' : bulkTimes.horaFinDescanso,
      };

      const response = await fetch('https://api.veterinariacue.com/api/agendamiento/jornada/masiva', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast({ title: "Éxito", description: "Jornadas generadas correctamente." });
        setIsBulkModalOpen(false);
        fetchAgendaData(selectedVetId);
      } else {
        const errorText = await response.text();
        throw new Error(`Error al generar jornadas: ${errorText}`);
      }
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const toggleBulkDay = (dayKey) => {
    setBulkDays(prev => 
      prev.includes(dayKey) ? prev.filter(d => d !== dayKey) : [...prev, dayKey]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('jwtToken');

    // APPOINTMENTS SUBMIT
    if (activeTab === 'appointments') {
      try {
        const payload = {
          petId: formData.petId,
          veterinarianId: formData.veterinarianId,
          servicioId: formData.servicioId,
          fechaInicio: new Date(formData.fechaInicio).toISOString(),
          motivoConsulta: formData.motivoConsulta,
          estadoGeneralMascota: formData.estadoGeneralMascota
        };
        
        // Determine URL and Method
        const url = currentRecord 
          ? `https://api.veterinariacue.com/api/citas/${currentRecord.id}`
          : 'https://api.veterinariacue.com/api/citas';
        const method = currentRecord ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method: method,
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          toast({ title: "Éxito", description: currentRecord ? "Cita actualizada." : "Cita agendada exitosamente." });
          setIsModalOpen(false);
          fetchData();
        } else {
          if (response.status === 400) {
            throw new Error("El doctor seleccionado no atiende en ese horario.");
          } else if (response.status === 409) {
            throw new Error("Conflicto de horario. Por favor seleccione otra hora.");
          } else {
            const txt = await response.text();
            throw new Error(`Error al guardar cita: ${txt}`);
          }
        }
      } catch(err) {
         toast({ title: "Error", description: err.message, variant: "destructive" });
      }
      return;
    }

    // AGENDAS SUBMIT
    if (activeTab === 'agendas') {
      try {
        const payload = {
          id: currentRecord ? currentRecord.id : undefined,
          veterinarioId: selectedVetId,
          diaSemana: formData.diaSemana,
          horaInicioJornada: formData.horaInicioJornada.length === 5 ? formData.horaInicioJornada + ':00' : formData.horaInicioJornada,
          horaFinJornada: formData.horaFinJornada.length === 5 ? formData.horaFinJornada + ':00' : formData.horaFinJornada,
          horaInicioDescanso: formData.horaInicioDescanso.length === 5 ? formData.horaInicioDescanso + ':00' : formData.horaInicioDescanso,
          horaFinDescanso: formData.horaFinDescanso.length === 5 ? formData.horaFinDescanso + ':00' : formData.horaFinDescanso,
        };

        const response = await fetch('https://api.veterinariacue.com/api/agendamiento/jornada', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          toast({ title: "Éxito", description: "Jornada guardada correctamente." });
          setIsModalOpen(false);
          fetchAgendaData(selectedVetId);
        } else {
          const errorText = await response.text();
          throw new Error(`Error al guardar jornada: ${errorText}`);
        }
      } catch (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
      return;
    }

    // SERVICES SUBMIT
    if (activeTab === 'services') {
      try {
        const type = formData.tipoServicio;
        let endpointSuffix = '';
        let payload = {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          precio: parseFloat(formData.precio),
          duracionPromedioMinutos: parseInt(formData.duracionPromedioMinutos),
          tipoServicio: type
        };

        switch(type) {
          case 'CONSULTA': endpointSuffix = 'consulta'; break;
          case 'CIRUGIA': endpointSuffix = 'cirugia'; payload.requiereQuirofano = String(formData.requiereQuirofano) === 'true'; payload.notasPreoperatorias = formData.notasPreoperatorias; break;
          case 'VACUNACION': endpointSuffix = 'vacunacion'; payload.nombreBiologico = formData.nombreBiologico; break;
          case 'ESTETICA': endpointSuffix = 'estetica'; payload.tipoArreglo = formData.tipoArreglo; break;
          default: endpointSuffix = 'consulta';
        }

        if (currentRecord) {
          const response = await fetch(`https://api.veterinariacue.com/api/agendamiento/servicios-admin/${currentRecord.id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
           if (!response.ok) { const err = await response.text(); throw new Error(`Error actualizando servicio: ${err}`); }
           toast({ title: "Éxito", description: "Servicio actualizado." });
        } else {
          const response = await fetch(`https://api.veterinariacue.com/api/agendamiento/servicios-admin/${endpointSuffix}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!response.ok) { const err = await response.text(); throw new Error(`Error creando servicio: ${err}`); }
          toast({ title: "Éxito", description: "Servicio creado." });
        }
        setIsModalOpen(false);
        fetchData();
      } catch (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
      return;
    }


    // PETS SUBMIT
    if (activeTab === 'pets') {
      try {
        const payload = { ...formData };
        if (payload.active) payload.active = String(payload.active) === 'true';

        if (currentRecord) {
          const response = await fetch(`https://api.veterinariacue.com/api/mascotas/${currentRecord.id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!response.ok) throw new Error("Error al actualizar mascota");
          toast({ title: "Éxito", description: "Mascota actualizada." });
        } else {
          const response = await fetch('https://api.veterinariacue.com/api/mascotas', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!response.ok) throw new Error("Error al crear mascota");
          toast({ title: "Éxito", description: "Mascota creada." });
        }
        setIsModalOpen(false);
        fetchData();
      } catch (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
      return;
    }

    // USERS & VETERINARIANS SUBMIT
    if (activeTab === 'users' || activeTab === 'veterinarians') {
      try {
        if (currentRecord) {
          const payload = {
            nombre: formData.nombre,
            apellido: formData.apellido,
            correo: formData.correo,
            telefono: formData.telefono,
            direccion: formData.direccion,
            userRole: formData.userRole || (activeTab === 'veterinarians' ? 'ROLE_VETERINARIO' : null),
            activo: String(formData.activo) === 'true'
          };
          if (activeTab === 'veterinarians' || payload.userRole === 'ROLE_VETERINARIO') {
             payload.especialidad = formData.especialidad;
          }

          const response = await fetch(`https://api.veterinariacue.com/api/auth/${currentRecord.id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!response.ok) throw new Error("Error al actualizar usuario");
          toast({ title: "Éxito", description: "Usuario actualizado." });
        } else {
          const role = formData.userRole || (activeTab === 'veterinarians' ? 'ROLE_VETERINARIO' : '');
          const tipoUsuario = role.replace('ROLE_', '');
          const payload = {
            nombre: formData.nombre,
            apellido: formData.apellido,
            direccion: formData.direccion,
            telefono: formData.telefono,
            correo: formData.correo,
            contrasenia: formData.contrasenia,
            tipoUsuario: tipoUsuario
          };
          if (role === 'ROLE_VETERINARIO' && formData.especialidad) {
            payload.especialidad = formData.especialidad;
          }
          const response = await fetch('https://api.veterinariacue.com/api/auth/register', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!response.ok) throw new Error("Error al crear usuario");
          toast({ title: "Éxito", description: "Usuario creado." });
        }
        setIsModalOpen(false);
        fetchData();
      } catch (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
      return;
    }

    // MOCK SUBMIT
    try {
      if (currentRecord) {
        await api.update(activeTab, currentRecord.id, formData);
        toast({ title: "Éxito", description: "Registro actualizado." });
      } else {
        await api.create(activeTab, formData);
        toast({ title: "Éxito", description: "Registro creado." });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Ocurrió un error al guardar.", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('userPhoto');
    localStorage.removeItem('userId');
    navigate('/login');
    toast({ description: "Has cerrado sesión correctamente." });
  };

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      val !== null && val !== undefined && String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const renderTableCell = (item, col) => {
    const value = item[col];
    
    if (col === 'iconType') {
      switch(item.tipoServicio) {
        case 'CONSULTA': return <Stethoscope className="w-5 h-5 text-blue-500" />;
        case 'CIRUGIA': return <Activity className="w-5 h-5 text-red-500" />;
        case 'VACUNACION': return <Syringe className="w-5 h-5 text-green-500" />;
        case 'ESTETICA': return <Scissors className="w-5 h-5 text-pink-500" />;
        default: return <FileText className="w-5 h-5 text-slate-400" />;
      }
    }
    if (col === 'tipoServicio') {
      const colorMap = {
        'CONSULTA': 'bg-blue-100 text-blue-800',
        'CIRUGIA': 'bg-red-100 text-red-800',
        'VACUNACION': 'bg-green-100 text-green-800',
        'ESTETICA': 'bg-pink-100 text-pink-800'
      };
      return <span className={`px-2 py-1 rounded text-xs font-semibold ${colorMap[value] || 'bg-slate-100 text-slate-800'}`}>{value}</span>;
    }

    // Appointments custom columns
    if (activeTab === 'appointments') {
      if (col === 'fechaInicio') {
        // Use fechaHoraInicio as primary source for full datetime
        // Fallback to others if missing
        const dateValue = item.fechaHoraInicio || item.fechayhora || item.fechahora || item.fechaInicio;
        
        if (!dateValue) return <span className="text-slate-400">-</span>;
        
        // Robust parsing function
        const parseDate = (raw) => {
            if (raw instanceof Date) return raw;
            if (!raw) return null;
            
            // 1. If strictly YYYY-MM-DD, force local midnight
            if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
                return new Date(raw + 'T00:00:00');
            }

            // 2. Standard ISO or other parsable formats
            let d = new Date(raw);
            if (!isNaN(d.getTime())) return d;

            return null;
        };

        const dateObj = parseDate(dateValue);

        if (!dateObj) {
            // Show raw value if parsing fails, so user can see what it is
            return <span className="text-slate-600 font-mono text-xs">{String(dateValue)}</span>;
        }
        
        return <span className="font-medium text-slate-900">
           {dateObj.toLocaleDateString('es-ES', { 
             day: '2-digit', 
             month: '2-digit', 
             year: 'numeric',
           })}
           , {dateObj.toLocaleTimeString('es-ES', {
             hour: '2-digit',
             minute: '2-digit',
             hour12: false
           })}
        </span>;
      }

      if (col === 'mascotaNombre') {
         // Look up via flat ID or nested object
         const pId = item.petId || item.mascota?.id;
         // Use petsForForm which contains all pets for mapping
         // Ensure string/number comparison works
         const pet = Array.isArray(petsForForm) ? petsForForm.find(p => String(p.id) === String(pId)) : null;
         
         const name = pet ? pet.nombre : (item.mascota?.nombre || '-');
         // Debug log if missing
         if (!pet && pId) console.log(`Pet ID ${pId} not found in petsList`, petsForForm);
         
         return <span className="text-slate-700">{name}</span>;
      }

      if (col === 'veterinarioNombre') {
         const vId = item.veterinarianId || item.veterinario?.id;
         const vet = veterinariansList.find(v => String(v.id) === String(vId));
         const name = vet ? `${vet.nombre} ${vet.apellido}` : (item.veterinario ? `${item.veterinario.nombre} ${item.veterinario.apellido}` : '-');
         return <span className="text-slate-700">{name}</span>;
      }

      if (col === 'servicioNombre') {
        // Render "Motivo" instead of Service Name
         const motivo = item.motivo || item.motivoConsulta;
         return <span className="text-slate-700">{motivo || '-'}</span>;
      }

      if (col === 'estado') return <span className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold text-slate-700">{item.estado || 'PENDIENTE'}</span>;
    }

    if (col === 'duenioId') {
        if (!value) return <span className="text-slate-400">-</span>;
        const ownerName = ownersMap[value] || `Dueño #${value}`;
        return <span className="font-medium text-slate-700">{ownerName}</span>;
    }
    if (col === 'foto') {
      const imageUrl = value ? `https://api.veterinariacue.com${value}` : null;
      return (
        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
          {imageUrl ? (
            <img src={imageUrl} alt="Avatar" className="w-full h-full object-cover" onError={(e) => {e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block';}} />
          ) : null}
          <Users className={`w-5 h-5 text-slate-400 ${imageUrl ? 'hidden' : 'block'}`} />
        </div>
      );
    }
    if (col === 'activo' || col === 'active') { 
      const isActive = typeof value === 'boolean' ? value : String(value).toLowerCase() === 'true';
      return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{isActive ? 'Activo' : 'Inactivo'}</span>;
    }
    if (col === 'createdAt' || col === 'updatedAt') {
      if (!value) return <span className="text-slate-400">-</span>;
      try { return new Date(value).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return value; }
    }
    if (col === 'userRole') {
        const roleLabels = { 'ROLE_ADMIN': 'Administrador', 'ROLE_VETERINARIO': 'Veterinario', 'ROLE_DUENIO': 'Dueño' };
        return <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">{roleLabels[value] || String(value).replace('ROLE_', '')}</span>;
    }
    if (col === 'price') return `$${value}`;
    return value;
  };

  const renderAgendaForm = () => (
    <>
      <div className="grid gap-2">
        <Label>Veterinario ID</Label>
        <Input value={selectedVetId} disabled className="bg-slate-50 text-slate-900" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="diaSemana">Día de la Semana</Label>
        <select id="diaSemana" className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900" value={formData.diaSemana || ''} onChange={(e) => setFormData({...formData, diaSemana: e.target.value})} required>
          <option value="">Seleccionar Día</option>
          {Object.keys(DAYS_MAP).map(key => (
            <option key={key} value={key} className="text-slate-900">{DAYS_MAP[key]}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="horaInicioJornada">Hora Entrada</Label>
          <Input id="horaInicioJornada" type="time" value={formData.horaInicioJornada || ''} onChange={(e) => setFormData({...formData, horaInicioJornada: e.target.value})} required className="text-slate-900" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="horaFinJornada">Hora Salida</Label>
          <Input id="horaFinJornada" type="time" value={formData.horaFinJornada || ''} onChange={(e) => setFormData({...formData, horaFinJornada: e.target.value})} required className="text-slate-900" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="horaInicioDescanso">Descanso Inicio</Label>
          <Input id="horaInicioDescanso" type="time" value={formData.horaInicioDescanso || ''} onChange={(e) => setFormData({...formData, horaInicioDescanso: e.target.value})} required className="text-slate-900" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="horaFinDescanso">Descanso Fin</Label>
          <Input id="horaFinDescanso" type="time" value={formData.horaFinDescanso || ''} onChange={(e) => setFormData({...formData, horaFinDescanso: e.target.value})} required className="text-slate-900" />
        </div>
      </div>
    </>
  );

  const renderAppointmentForm = () => {
    // Defensive check: ensure petsList is always an array
    let petsList = [];
    if (Array.isArray(petsForForm)) {
      petsList = petsForForm;
    } else {
      // Log warning if it's not an array so we can debug, but don't crash
      console.warn('petsForForm is not an array:', petsForForm);
      petsList = [];
    }
    
    console.log("Render Appointment Form: petsList count:", petsList.length);

    return (
    <>
      <div className="grid gap-4 py-4">
        {/* Owner Selection (Optional Filter for Admin/Vet - No longer filters pet dropdown) */}
        {(!currentUser || currentUser.role !== 'ROLE_DUENIO') && (
           <div className="grid gap-2">
             <Label htmlFor="ownerId" className="text-slate-900">Filtrar por Dueño (Opcional, para contexto)</Label>
             <select 
               id="ownerId"
               className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
               value={formData.ownerId || ''}
               onChange={(e) => setFormData({...formData, ownerId: e.target.value})} // Removed petId reset
             >
               <option value="">Todos los dueños (No filtra mascotas abajo)</option>
               {ownersList.map(owner => (
                 <option key={owner.id} value={owner.id}>{owner.nombre} {owner.apellido}</option>
               ))}
             </select>
           </div>
        )}
        
        {/* Pet Selection */}
        <div className="grid gap-2">
           <Label htmlFor="petId" className="text-slate-900">Mascota</Label>
           <select 
             id="petId"
             className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
             value={formData.petId || ''}
             onChange={(e) => setFormData({...formData, petId: e.target.value})}
             required
           >
             <option value="">Seleccionar Mascota</option>
             {petsList.map(pet => (
               <option key={pet.id} value={pet.id}>
                 {pet.nombre} ({pet.especie}) {pet.duenio ? `- ${pet.duenio.nombre} ${pet.duenio.apellido}` : ''}
               </option>
             ))}
           </select>
           {petsList.length === 0 && (
               <span className="text-xs text-red-500">No hay mascotas disponibles. Verifique que se hayan cargado correctamente.</span>
           )}
        </div>

        {/* Vet Selection */}
        <div className="grid gap-2">
           <Label htmlFor="veterinarianId" className="text-slate-900">Veterinario</Label>
           <select 
             id="veterinarianId"
             className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
             value={formData.veterinarianId || ''}
             onChange={(e) => setFormData({...formData, veterinarianId: e.target.value})}
             required
           >
             <option value="">Seleccionar Veterinario</option>
             {veterinariansList.map(vet => (
               <option key={vet.id} value={vet.id}>{vet.nombre} {vet.apellido} - {vet.especialidad}</option>
             ))}
           </select>
        </div>

        {/* Service Selection */}
        <div className="grid gap-2">
           <Label htmlFor="servicioId" className="text-slate-900">Servicio</Label>
           <select 
             id="servicioId"
             className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
             value={formData.servicioId || ''}
             onChange={(e) => setFormData({...formData, servicioId: e.target.value})}
             required
           >
             <option value="">Seleccionar Servicio</option>
             {servicesList.map(srv => (
               <option key={srv.id} value={srv.id}>{srv.nombre} (${srv.precio})</option>
             ))}
           </select>
        </div>

        {/* Date Time */}
        <div className="grid gap-2">
           <Label htmlFor="fechaInicio" className="text-slate-900">Fecha y Hora</Label>
           <Input 
              id="fechaInicio" 
              type="datetime-local" 
              min={new Date().toISOString().slice(0, 16)}
              value={formData.fechaInicio || ''}
              onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})}
              required
              className="text-slate-900"
           />
        </div>

        {/* Motivo */}
        <div className="grid gap-2">
           <Label htmlFor="motivoConsulta" className="text-slate-900">Motivo de Consulta</Label>
           <Input 
              id="motivoConsulta" 
              value={formData.motivoConsulta || ''} 
              onChange={(e) => setFormData({...formData, motivoConsulta: e.target.value})} 
              required
              placeholder="Ej. Vacunación anual"
              className="text-slate-900"
           />
        </div>

        {/* Estado General */}
        <div className="grid gap-2">
           <Label htmlFor="estadoGeneralMascota" className="text-slate-900">Estado General</Label>
           <Input 
              id="estadoGeneralMascota" 
              value={formData.estadoGeneralMascota || ''} 
              onChange={(e) => setFormData({...formData, estadoGeneralMascota: e.target.value})} 
              required
              placeholder="Ej. Aparentemente sano"
              className="text-slate-900"
           />
        </div>
      </div>
    </>
    );
  };

  const DetailRow = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="font-medium text-slate-500 text-sm">{label}</span>
      <span className="text-slate-900 text-sm text-right font-medium">{value || value === 0 ? value : '-'}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <Helmet>
        <title>Administrador - VetCUE</title>
      </Helmet>
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col fixed h-full overflow-y-auto z-20">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Logo className="w-12 h-12" />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-xl font-bold leading-tight">Vet<span className="text-yellow-400">CUE</span></h1>
              <span className="text-slate-400 text-sm leading-tight">Admin</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {Object.entries(ENTITIES).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium
                  ${activeTab === key ? 'bg-yellow-400 text-slate-900' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <Icon className={`w-5 h-5 ${activeTab === key ? 'text-slate-900' : config.color}`} />
                {config.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800 gap-2">
            <LogOut className="w-5 h-5" /> Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8 overflow-x-hidden">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{currentConfig.label}</h2>
            <p className="text-slate-500 text-sm mt-1">Gestión de {currentConfig.label.toLowerCase()} del sistema</p>
          </div>
          {activeTab !== 'agendas' && activeTab !== 'inventory-products' && activeTab !== 'inventory-categories' && (
            <Button onClick={handleCreate} className="bg-slate-900 hover:bg-slate-800 gap-2">
              <Plus className="w-4 h-4" /> Nuevo Registro
            </Button>
          )}
        </header>

        {/* Special Render for Inventory */}
        {activeTab === 'inventory-products' ? (
          <InventoryProducts />
        ) : activeTab === 'inventory-categories' ? (
          <InventoryCategories />
        ) : activeTab === 'agendas' ? (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <Label className="mb-2 block">Seleccionar Veterinario</Label>
              <select 
                className="w-full md:w-1/2 h-10 rounded-md border border-slate-200 bg-white px-3 text-slate-900" 
                value={selectedVetId}
                onChange={(e) => setSelectedVetId(e.target.value)}
              >
                <option value="" className="text-slate-900">-- Seleccione un veterinario --</option>
                {veterinariansList.map(vet => (
                  <option key={vet.id} value={vet.id} className="text-slate-900">
                    {vet.nombre} {vet.apellido}
                  </option>
                ))}
              </select>
            </div>

            {selectedVetId && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                   <h3 className="font-semibold text-slate-700">Jornadas Laborales</h3>
                   <div className="flex gap-2">
                     <Button size="sm" onClick={handleBulkCreate} className="bg-blue-600 hover:bg-blue-700 gap-2">
                        <Sparkles className="w-4 h-4" /> Generar Jornadas Automáticamente
                     </Button>
                     <Button size="sm" onClick={handleCreate} className="bg-teal-600 hover:bg-teal-700">
                        <Plus className="w-4 h-4 mr-2" /> Nueva Jornada
                     </Button>
                   </div>
                </div>
                {loadingAgenda ? (
                  <div className="h-40 flex items-center justify-center text-slate-400"><Loader2 className="animate-spin mr-2"/> Cargando agenda...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-slate-900">Día</TableHead>
                        <TableHead className="text-slate-900">Entrada</TableHead>
                        <TableHead className="text-slate-900">Salida</TableHead>
                        <TableHead className="text-slate-900">Descanso</TableHead>
                        <TableHead className="text-slate-900">Estado</TableHead>
                        <TableHead className="text-right text-slate-900">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agendaData.length > 0 ? agendaData.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium text-slate-900">{DAYS_MAP[item.diaSemana] || item.diaSemana}</TableCell>
                          <TableCell className="text-slate-900">{item.horaInicioJornada}</TableCell>
                          <TableCell className="text-slate-900">{item.horaFinJornada}</TableCell>
                          <TableCell className="text-slate-900">{item.horaInicioDescanso} - {item.horaFinDescanso}</TableCell>
                          <TableCell className="text-slate-900">
                            <Switch 
                              checked={item.activa} 
                              onCheckedChange={() => handleAgendaToggle(item.id, item.activa)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                              <Pencil className="w-4 h-4 text-blue-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )) : (
                         <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">No hay jornadas configuradas.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Standard Generic Table */
          <>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Buscar..." className="pl-10 bg-slate-50 text-slate-900" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              {loading ? (
                <div className="h-64 flex items-center justify-center text-slate-400 gap-2"><Loader2 className="w-6 h-6 animate-spin" /> Cargando datos...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {currentConfig.headers.map((header, i) => (<TableHead key={i} className="font-bold whitespace-nowrap text-slate-900">{header}</TableHead>))}
                        <TableHead className="text-right text-slate-900">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.length > 0 ? filteredData.map((item) => {
                         // DEBUG: Log appointment structure
                         if (activeTab === 'appointments') {
                           console.log("Rendering Appointment Item:", item);
                         }
                         return (
                        <TableRow key={item.id}>
                          {currentConfig.columns.map((col, i) => (<TableCell key={i} className="text-slate-900 whitespace-nowrap">{renderTableCell(item, col)}</TableCell>))}
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {activeTab === 'appointments' && (
                                <Button variant="ghost" size="icon" onClick={() => handleViewDetails(item.id)} title="Ver Detalles">
                                  <Eye className="w-4 h-4 text-slate-500" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Pencil className="w-4 h-4 text-blue-500" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(item.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}) : (
                        <TableRow><TableCell colSpan={currentConfig.headers.length + 1} className="h-32 text-center text-slate-400">No se encontraron resultados.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" aria-describedby="modal-description">
          <DialogHeader>
            <DialogTitle className="text-slate-900">{currentRecord ? `Editar ${currentConfig.label.slice(0, -1)}` : `Nuevo ${currentConfig.label.slice(0, -1)}`}</DialogTitle>
            <DialogDescription id="modal-description" className="text-sm text-slate-500">Complete el formulario.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {activeTab === 'agendas' ? renderAgendaForm() : 
             activeTab === 'appointments' ? renderAppointmentForm() : (
               /* Generic Form Generation */
               currentConfig.fields.map((field) => {
                if (field.showOnEdit === false && currentRecord) return null;
                if (field.showOnCreate === false && !currentRecord) return null;
                if (field.showIfRole && formData.userRole !== field.showIfRole) return null;
                if (field.showIfType && formData.tipoServicio !== field.showIfType) return null;

                if (field.type === 'custom_owner_select') {
                  return (
                    <div key={field.name} className="grid gap-2">
                      <Label htmlFor={field.name}>{field.label}</Label>
                      <select id={field.name} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900" value={formData[field.name] || ''} onChange={(e) => setFormData({...formData, [field.name]: e.target.value})} required>
                        <option value="" className="text-slate-900">Seleccionar Dueño</option>
                        {ownersList.map(owner => (<option key={owner.id} value={owner.id} className="text-slate-900">{owner.nombre} {owner.apellido} (ID: {owner.id})</option>))}
                      </select>
                    </div>
                  );
                }
                return (
                  <div key={field.name} className="grid gap-2">
                    <Label htmlFor={field.name}>{field.label}</Label>
                    {field.type === 'select' ? (
                      <select id={field.name} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900" value={formData[field.name] || ''} onChange={(e) => setFormData({...formData, [field.name]: e.target.value})} required>
                        <option value="" className="text-slate-900">Seleccionar {field.label}</option>
                        {field.options.map(opt => { const val = typeof opt === 'object' ? opt.value : opt; const lab = typeof opt === 'object' ? opt.label : opt; return <option key={val} value={val} className="text-slate-900">{lab}</option>; })}
                      </select>
                    ) : (
                      <Input id={field.name} type={field.type} value={formData[field.name] || ''} onChange={(e) => setFormData({...formData, [field.name]: e.target.value})} required={field.showOnEdit === false ? !currentRecord : true} className="text-slate-900" />
                    )}
                  </div>
                );
              })
            )}
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Bulk Generate Modal */}
      <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
        <DialogContent className="sm:max-w-[600px]" aria-describedby="bulk-modal-description">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Generar Jornadas Masivas</DialogTitle>
            <DialogDescription id="bulk-modal-description" className="text-sm text-slate-500">Seleccione los días y configure el horario para aplicarlo a múltiples días.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBulkSubmit} className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-base font-medium text-slate-900">Días de la Semana</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(DAYS_MAP).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2 border border-slate-200 rounded-lg p-2 hover:bg-slate-50">
                    <Checkbox 
                      id={`day-${key}`} 
                      checked={bulkDays.includes(key)}
                      onCheckedChange={() => toggleBulkDay(key)}
                    />
                    <Label htmlFor={`day-${key}`} className="cursor-pointer font-normal text-slate-900">{label}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                 <Label className="text-base font-medium text-slate-900">Horario de Trabajo</Label>
                 <div className="grid gap-2">
                    <Label htmlFor="bulkHoraInicio" className="text-xs text-slate-500">Entrada</Label>
                    <Input id="bulkHoraInicio" type="time" value={bulkTimes.horaInicioJornada} onChange={(e) => setBulkTimes({...bulkTimes, horaInicioJornada: e.target.value})} required className="text-slate-900" />
                 </div>
                 <div className="grid gap-2">
                    <Label htmlFor="bulkHoraFin" className="text-xs text-slate-500">Salida</Label>
                    <Input id="bulkHoraFin" type="time" value={bulkTimes.horaFinJornada} onChange={(e) => setBulkTimes({...bulkTimes, horaFinJornada: e.target.value})} required className="text-slate-900" />
                 </div>
              </div>
              
              <div className="space-y-3">
                 <Label className="text-base font-medium text-slate-900">Horario de Descanso</Label>
                 <div className="grid gap-2">
                    <Label htmlFor="bulkDescansoInicio" className="text-xs text-slate-500">Inicio</Label>
                    <Input id="bulkDescansoInicio" type="time" value={bulkTimes.horaInicioDescanso} onChange={(e) => setBulkTimes({...bulkTimes, horaInicioDescanso: e.target.value})} required className="text-slate-900" />
                 </div>
                 <div className="grid gap-2">
                    <Label htmlFor="bulkDescansoFin" className="text-xs text-slate-500">Fin</Label>
                    <Input id="bulkDescansoFin" type="time" value={bulkTimes.horaFinDescanso} onChange={(e) => setBulkTimes({...bulkTimes, horaFinDescanso: e.target.value})} required className="text-slate-900" />
                 </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsBulkModalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Generar Jornadas</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
            <DialogTitle className="text-slate-900">Detalles de la Cita</DialogTitle>
            </DialogHeader>
            {loadingDetails ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin w-8 h-8 text-blue-500" /></div>
            ) : appointmentDetails ? (
            <div className="space-y-6">
                {/* Header with Status */}
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Cita #{appointmentDetails.id}</h3>
                        <p className="text-slate-500 text-sm">
                            {(appointmentDetails.fechaHoraInicio || appointmentDetails.fechaInicio) ? new Date(appointmentDetails.fechaHoraInicio || appointmentDetails.fechaInicio).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' }) : '-'}
                        </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold 
                        ${appointmentDetails.estado === 'COMPLETADA' ? 'bg-green-100 text-green-800' : 
                        appointmentDetails.estado === 'CANCELADA' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                        {appointmentDetails.estado || 'PENDIENTE'}
                    </span>
                </div>

                {/* Section 1: Información General */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4" /> Información General
                    </h4>
                    <DetailRow label="ID Cita" value={appointmentDetails.id} />
                    
                    <DetailRow 
                        label="Dueño" 
                        value={appointmentDetails.ownerName || '-'} 
                    />
                    
                    <DetailRow 
                        label="Mascota" 
                        value={appointmentDetails.petName || '-'} 
                    />
                    
                    <DetailRow 
                        label="Veterinario" 
                        value={
                             (appointmentDetails.veterinario?.nombre && `${appointmentDetails.veterinario.nombre} ${appointmentDetails.veterinario.apellido}`) ||
                             appointmentDetails.veterinarioNombre ||
                             veterinariansList.find(v => v.id == (appointmentDetails.veterinarianId || appointmentDetails.veterinario?.id))?.nombre + ' ' + veterinariansList.find(v => v.id == (appointmentDetails.veterinarianId || appointmentDetails.veterinario?.id))?.apellido ||
                             '-'
                        } 
                    />

                    <DetailRow label="Fecha y Hora" value={(appointmentDetails.fechaHoraInicio || appointmentDetails.fechaInicio) ? new Date(appointmentDetails.fechaHoraInicio || appointmentDetails.fechaInicio).toLocaleString('es-ES') : '-'} />
                    <DetailRow label="Estado" value={appointmentDetails.estado} />
                </div>

                {/* Section 2: Datos del Servicio */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Datos del Servicio
                    </h4>
                    <DetailRow label="Servicio" value={appointmentDetails.nombreServicio || appointmentDetails.servicio?.nombre || '-'} />
                    <DetailRow label="Precio" value={appointmentDetails.precioServicio ? `$${appointmentDetails.precioServicio}` : (appointmentDetails.servicio?.precio ? `$${appointmentDetails.servicio.precio}` : '-')} />
                    <div className="mt-2">
                        <span className="font-medium text-slate-500 text-sm block mb-1">Motivo de Consulta</span>
                        <p className="text-slate-900 text-sm bg-white p-2 rounded border border-slate-200">
                            {appointmentDetails.motivoConsulta || '-'}
                        </p>
                    </div>
                </div>

                {/* Section 3: Signos Vitales */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <HeartPulse className="w-4 h-4" /> Signos Vitales y Estado
                    </h4>
                    <DetailRow label="Peso" value={appointmentDetails.peso ? `${appointmentDetails.peso} kg` : '-'} />
                    <DetailRow label="Temperatura" value={appointmentDetails.temperatura ? `${appointmentDetails.temperatura} °C` : '-'} />
                    <DetailRow label="Frecuencia Cardíaca" value={appointmentDetails.frecuenciaCardiaca ? `${appointmentDetails.frecuenciaCardiaca} lpm` : '-'} />
                    <DetailRow label="Frecuencia Respiratoria" value={appointmentDetails.frecuenciaRespiratoria ? `${appointmentDetails.frecuenciaRespiratoria} rpm` : '-'} />
                    <div className="mt-2">
                        <span className="font-medium text-slate-500 text-sm block mb-1">Estado General</span>
                        <p className="text-slate-900 text-sm bg-white p-2 rounded border border-slate-200">
                            {appointmentDetails.estadoGeneralMascota || '-'}
                        </p>
                    </div>
                </div>

                {/* Section 4: Diagnóstico y Tratamiento */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Stethoscope className="w-4 h-4" /> Diagnóstico y Tratamiento
                    </h4>
                    
                    <div className="mb-3">
                        <span className="font-medium text-slate-500 text-sm block mb-1">Diagnóstico</span>
                        <p className="text-slate-900 text-sm bg-white p-2 rounded border border-slate-200">
                            {appointmentDetails.diagnostico || '-'}
                        </p>
                    </div>

                    <div className="mb-3">
                        <span className="font-medium text-slate-500 text-sm block mb-1">Tratamiento</span>
                        <p className="text-slate-900 text-sm bg-white p-2 rounded border border-slate-200">
                            {appointmentDetails.tratamiento || '-'}
                        </p>
                    </div>

                    <div className="mb-3">
                        <span className="font-medium text-slate-500 text-sm block mb-1">Medicamentos Recetados</span>
                        <p className="text-slate-900 text-sm bg-white p-2 rounded border border-slate-200">
                            {appointmentDetails.medicamentosRecetados || '-'}
                        </p>
                    </div>
                    
                    <div className="mb-3">
                        <span className="font-medium text-slate-500 text-sm block mb-1">Exámenes Realizados</span>
                        <p className="text-slate-900 text-sm bg-white p-2 rounded border border-slate-200">
                            {appointmentDetails.examenesRealizados || '-'}
                        </p>
                    </div>

                    <div>
                        <span className="font-medium text-slate-500 text-sm block mb-1">Observaciones</span>
                        <p className="text-slate-900 text-sm bg-white p-2 rounded border border-slate-200">
                            {appointmentDetails.observaciones || '-'}
                        </p>
                    </div>
                </div>
            </div>
            ) : (
            <p className="text-center py-4 text-slate-500">No se encontraron detalles.</p>
            )}
            <DialogFooter>
                <Button onClick={() => setIsDetailsModalOpen(false)}>Cerrar</Button>
            </DialogFooter>
        </DialogContent>
     </Dialog>

      {/* Delete/Confirm Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Confirmar acción</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600 py-4">{activeTab === 'pets' ? "¿Desactivar esta mascota?" : "¿Eliminar registro?"}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
            <Button className="bg-red-500 hover:bg-red-600" onClick={confirmDelete}>{activeTab === 'pets' ? 'Desactivar' : 'Eliminar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminDashboard;
