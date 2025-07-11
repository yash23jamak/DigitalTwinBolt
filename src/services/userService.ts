import { User, UserFormData, Permission } from '../types/user';
import { generateId } from '../utils/helpers';
import { notificationService } from './notificationService';

class UserService {
  private static instance: UserService;
  private users: Map<string, User> = new Map();
  private permissions: Permission[] = [];

  private constructor() {
    this.initializePermissions();
    this.initializeMockData();
  }

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  private initializePermissions(): void {
    this.permissions = [
      {
        id: 'perm-001',
        name: 'View Models',
        description: 'View 3D models and their details',
        category: 'models',
        actions: ['read']
      },
      {
        id: 'perm-002',
        name: 'Manage Models',
        description: 'Create, update, and delete 3D models',
        category: 'models',
        actions: ['create', 'read', 'update', 'delete']
      },
      {
        id: 'perm-003',
        name: 'View Sensors',
        description: 'View sensor data and configurations',
        category: 'sensors',
        actions: ['read']
      },
      {
        id: 'perm-004',
        name: 'Manage Sensors',
        description: 'Create, update, and delete sensors',
        category: 'sensors',
        actions: ['create', 'read', 'update', 'delete']
      },
      {
        id: 'perm-005',
        name: 'View Analytics',
        description: 'Access analytics and reports',
        category: 'analytics',
        actions: ['read']
      },
      {
        id: 'perm-006',
        name: 'System Configuration',
        description: 'Configure system settings',
        category: 'system',
        actions: ['read', 'update']
      },
      {
        id: 'perm-007',
        name: 'User Management',
        description: 'Manage user accounts and permissions',
        category: 'users',
        actions: ['create', 'read', 'update', 'delete']
      }
    ];
  }

  private initializeMockData(): void {
    const mockUsers: User[] = [
      {
        id: 'user-001',
        username: 'admin',
        email: 'admin@digitaltwin.com',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        status: 'active',
        department: 'IT',
        position: 'System Administrator',
        phone: '+1-555-0001',
        lastLogin: new Date(),
        loginCount: 156,
        permissions: this.permissions,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'user-002',
        username: 'jsmith',
        email: 'john.smith@digitaltwin.com',
        firstName: 'John',
        lastName: 'Smith',
        role: 'manager',
        status: 'active',
        department: 'Engineering',
        position: 'Project Manager',
        phone: '+1-555-0002',
        lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
        loginCount: 89,
        permissions: this.permissions.filter(p => p.category !== 'users'),
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        createdBy: 'admin'
      },
      {
        id: 'user-003',
        username: 'mjohnson',
        email: 'mary.johnson@digitaltwin.com',
        firstName: 'Mary',
        lastName: 'Johnson',
        role: 'operator',
        status: 'active',
        department: 'Operations',
        position: 'Senior Operator',
        phone: '+1-555-0003',
        lastLogin: new Date(Date.now() - 4 * 60 * 60 * 1000),
        loginCount: 234,
        permissions: this.permissions.filter(p => ['models', 'sensors', 'analytics'].includes(p.category) && p.actions.includes('read')),
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date(),
        createdBy: 'admin'
      },
      {
        id: 'user-004',
        username: 'bwilson',
        email: 'bob.wilson@digitaltwin.com',
        firstName: 'Bob',
        lastName: 'Wilson',
        role: 'viewer',
        status: 'inactive',
        department: 'Quality Assurance',
        position: 'QA Analyst',
        phone: '+1-555-0004',
        lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        loginCount: 45,
        permissions: this.permissions.filter(p => p.actions.includes('read')),
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date(),
        createdBy: 'admin'
      }
    ];

    mockUsers.forEach(user => this.users.set(user.id, user));
  }

  public async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  public async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  public async createUser(data: UserFormData): Promise<User> {
    const user: User = {
      id: generateId(),
      ...data,
      status: 'active',
      loginCount: 0,
      permissions: this.permissions.filter(p => data.permissions.includes(p.id)),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current-user' // In real app, get from auth context
    };

    this.users.set(user.id, user);

    notificationService.success(
      'User Created',
      `User "${user.firstName} ${user.lastName}" has been created successfully.`
    );

    return user;
  }

  public async updateUser(id: string, data: Partial<UserFormData>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) {
      notificationService.error('User Not Found', `User with ID ${id} not found.`);
      return null;
    }

    const updatedUser: User = {
      ...user,
      ...data,
      permissions: data.permissions ? this.permissions.filter(p => data.permissions!.includes(p.id)) : user.permissions,
      updatedAt: new Date()
    };

    this.users.set(id, updatedUser);

    notificationService.success(
      'User Updated',
      `User "${updatedUser.firstName} ${updatedUser.lastName}" has been updated successfully.`
    );

    return updatedUser;
  }

  public async deleteUser(id: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) {
      notificationService.error('User Not Found', `User with ID ${id} not found.`);
      return false;
    }

    if (user.username === 'admin') {
      notificationService.error('Cannot Delete Admin', 'The admin user cannot be deleted.');
      return false;
    }

    this.users.delete(id);

    notificationService.success(
      'User Deleted',
      `User "${user.firstName} ${user.lastName}" has been deleted successfully.`
    );

    return true;
  }

  public async updateUserStatus(id: string, status: User['status']): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;

    user.status = status;
    user.updatedAt = new Date();
    this.users.set(id, user);

    notificationService.info(
      'User Status Updated',
      `User "${user.firstName} ${user.lastName}" status changed to ${status}.`
    );

    return true;
  }

  public getAllPermissions(): Permission[] {
    return this.permissions;
  }

  public getUserStatistics() {
    const users = Array.from(this.users.values());
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const inactiveUsers = users.filter(u => u.status === 'inactive').length;
    const suspendedUsers = users.filter(u => u.status === 'suspended').length;

    const usersByRole = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const usersByDepartment = users.reduce((acc, user) => {
      if (user.department) {
        acc[user.department] = (acc[user.department] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      usersByRole,
      usersByDepartment
    };
  }
}

export const userService = UserService.getInstance();