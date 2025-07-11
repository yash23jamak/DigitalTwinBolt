export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer';
  status: 'active' | 'inactive' | 'suspended';
  avatar?: string;
  department?: string;
  position?: string;
  phone?: string;
  lastLogin?: Date;
  loginCount: number;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'models' | 'sensors' | 'analytics' | 'system' | 'users';
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface UserFormData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: User['role'];
  department?: string;
  position?: string;
  phone?: string;
  permissions: string[];
}

export interface UserFilters {
  search: string;
  role: string;
  status: string;
  department: string;
}