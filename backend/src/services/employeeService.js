const userRepository = require('../repositories/userRepository');
const ticketRepository = require('../repositories/ticketRepository');
const AppError = require('../utils/appError');
const bcrypt = require('bcryptjs');

class EmployeeService {
  /**
   * List all employees with filter, search, sort, and pagination.
   * Computes counts for assigned, open, and completed tickets.
   */
  async getEmployees(query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const where = {
      role: { in: ['EMPLOYEE', 'ADMIN'] },
    };

    // Filters
    if (query.role) {
      where.role = query.role;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.department) {
      where.department = { contains: query.department, mode: 'insensitive' };
    }

    // Search by name, email, department
    if (query.search) {
      const searchPattern = query.search;
      where.OR = [
        { name: { contains: searchPattern, mode: 'insensitive' } },
        { email: { contains: searchPattern, mode: 'insensitive' } },
        { department: { contains: searchPattern, mode: 'insensitive' } },
      ];
    }

    // Fetch ALL matching users (to sort in memory correctly)
    const employees = await userRepository.findMany({
      where,
      include: {
        ticketsAssigned: {
          select: {
            id: true,
            status: true,
            updatedAt: true,
            createdAt: true,
            dueDate: true,
          },
        },
      },
    });

    const now = new Date();

    // Format metrics
    const formattedEmployees = employees.map((emp) => {
      const tickets = emp.ticketsAssigned || [];
      const assignedCount = tickets.length;
      const openCount = tickets.filter(t => t.status !== 'DONE' && t.status !== 'CLOSED').length;
      const completedTickets = tickets.filter(t => t.status === 'DONE' || t.status === 'CLOSED');
      const completedCount = completedTickets.length;
      const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length;
      const todoCount = tickets.filter(t => t.status === 'TO_DO').length;
      const closedCount = tickets.filter(t => t.status === 'CLOSED').length;

      // Overdue tickets count
      const overdueCount = tickets.filter(t => t.status !== 'DONE' && t.status !== 'CLOSED' && t.dueDate && new Date(t.dueDate) < now).length;

      // Average Resolution Time (in hours)
      let avgResolutionTime = 0;
      if (completedTickets.length > 0) {
        const totalDuration = completedTickets.reduce((sum, t) => {
          return sum + (new Date(t.updatedAt) - new Date(t.createdAt));
        }, 0);
        avgResolutionTime = Math.round((totalDuration / completedTickets.length) / (1000 * 60 * 60));
      }

      // Last Completed Ticket
      const lastCompletedTicket = completedTickets.reduce((latest, t) => {
        return !latest || t.updatedAt > latest.updatedAt ? t : latest;
      }, null);

      // Last Ticket Update (last activity)
      const lastTicketUpdate = tickets.reduce((latest, t) => {
        return !latest || t.updatedAt > latest ? t.updatedAt : latest;
      }, null);

      const completionRate = assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0;

      const { password: _, ...employeeProfile } = emp;

      return {
        ...employeeProfile,
        assignedTicketsCount: assignedCount,
        openTicketsCount: openCount,
        todoTicketsCount: todoCount,
        inProgressTicketsCount: inProgressCount,
        completedTicketsCount: completedCount,
        closedTicketsCount: closedCount,
        workload: openCount, // raw open tickets count
        completionRate,
        avgResolutionTime,
        overdueCount,
        lastCompletedTicket: lastCompletedTicket ? { id: lastCompletedTicket.id, ticketNumber: lastCompletedTicket.ticketNumber, title: lastCompletedTicket.title, updatedAt: lastCompletedTicket.updatedAt } : null,
        lastActivity: lastTicketUpdate || emp.createdAt,
      };
    });

    // In-memory Sorting
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    formattedEmployees.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (valA === undefined || valA === null) valA = 0;
      if (valB === undefined || valB === null) valB = 0;

      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (valA instanceof Date || (typeof valA === 'string' && !isNaN(Date.parse(valA)))) {
        const timeA = new Date(valA).getTime();
        const timeB = new Date(valB).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      } else {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
    });

    const totalCount = formattedEmployees.length;
    const paginatedEmployees = formattedEmployees.slice(skip, skip + limit);

    return {
      employees: paginatedEmployees,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  /**
   * Fetch specific employee details and performance analytics.
   */
  async getEmployeeById(id) {
    const emp = await userRepository.findUnique({
      where: { id },
      include: {
        ticketsAssigned: {
          include: {
            customer: { select: { id: true, name: true } },
          },
        },
        activityLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            ticket: { select: { id: true, ticketNumber: true, title: true } },
          },
        },
      },
    });

    if (!emp || emp.role === 'CUSTOMER') {
      throw new AppError('Employee not found.', 404);
    }

    const tickets = emp.ticketsAssigned || [];
    const assignedCount = tickets.length;
    const openTickets = tickets.filter(t => t.status !== 'DONE' && t.status !== 'CLOSED');
    const openCount = openTickets.length;
    const completedTickets = tickets.filter(t => t.status === 'DONE' || t.status === 'CLOSED');
    const completedCount = completedTickets.length;
    const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length;
    const todoCount = tickets.filter(t => t.status === 'TO_DO').length;
    const closedCount = tickets.filter(t => t.status === 'CLOSED').length;
    
    // Average resolution time (in hours)
    let avgResolutionTime = 0;
    if (completedTickets.length > 0) {
      const totalTimeMs = completedTickets.reduce((sum, t) => {
        return sum + (new Date(t.updatedAt) - new Date(t.createdAt));
      }, 0);
      avgResolutionTime = Math.round((totalTimeMs / (1000 * 60 * 60 * completedTickets.length)) * 10) / 10;
    }

    const completionRate = assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0;

    // Overdue tickets count
    const now = new Date();
    const overdueCount = tickets.filter(t => t.status !== 'DONE' && t.status !== 'CLOSED' && t.dueDate && new Date(t.dueDate) < now).length;

    // Last Completed Ticket
    const lastCompletedTicket = completedTickets.reduce((latest, t) => {
      return !latest || t.updatedAt > latest.updatedAt ? t : latest;
    }, null);

    // Last Activity
    const lastTicketUpdate = tickets.reduce((latest, t) => {
      return !latest || t.updatedAt > latest ? t.updatedAt : latest;
    }, null);

    const { password: _, ...employeeProfile } = emp;

    return {
      ...employeeProfile,
      stats: {
        assignedTicketsCount: assignedCount,
        openTicketsCount: openCount,
        todoTicketsCount: todoCount,
        inProgressTicketsCount: inProgressCount,
        completedTicketsCount: completedCount,
        closedTicketsCount: closedCount,
        workload: openCount,
        avgResolutionTime,
        completionRate,
        overdueCount,
        lastCompletedTicket: lastCompletedTicket ? { id: lastCompletedTicket.id, ticketNumber: lastCompletedTicket.ticketNumber, title: lastCompletedTicket.title, updatedAt: lastCompletedTicket.updatedAt } : null,
        lastActivity: lastTicketUpdate || emp.createdAt,
      },
      currentTickets: openTickets,
      recentCompletedTickets: completedTickets.slice(0, 5),
    };
  }

  /**
   * Create a new Admin or Employee account.
   */
  async createEmployee(data) {
    const { name, email, password, role, department } = data;

    if (!name || !email || !password || !role) {
      throw new AppError('Full name, email, password, and role are required.', 400);
    }

    if (!['EMPLOYEE', 'ADMIN'].includes(role)) {
      throw new AppError('Invalid role specified. Permitted: EMPLOYEE, ADMIN', 400);
    }

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('Email is already in use.', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userRepository.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        department: department || null,
        status: 'ACTIVE',
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update Employee or Admin profile details.
   */
  async updateEmployee(id, data) {
    const emp = await userRepository.findUnique({ where: { id } });
    if (!emp || emp.role === 'CUSTOMER') {
      throw new AppError('Employee not found.', 404);
    }

    const updateData = {};
    if (data.name) updateData.name = data.name;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.status) updateData.status = data.status;
    if (data.role) {
      if (!['EMPLOYEE', 'ADMIN'].includes(data.role)) {
        throw new AppError('Invalid role.', 400);
      }
      updateData.role = data.role;
    }

    if (data.email && data.email !== emp.email) {
      const existingUser = await userRepository.findByEmail(data.email);
      if (existingUser) {
        throw new AppError('Email is already in use by another account.', 400);
      }
      updateData.email = data.email;
    }

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = await userRepository.update({
      where: { id },
      data: updateData,
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Delete an Employee or Admin account.
   * Asserts that the employee has no active assigned tickets first.
   */
  async deleteEmployee(id) {
    const emp = await userRepository.findUnique({
      where: { id },
      include: {
        ticketsAssigned: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!emp || emp.role === 'CUSTOMER') {
      throw new AppError('Employee not found.', 404);
    }

    // Check for active assigned tickets
    const activeTicketsCount = emp.ticketsAssigned.filter(
      t => t.status !== 'DONE' && t.status !== 'CLOSED'
    ).length;

    if (activeTicketsCount > 0) {
      throw new AppError(
        `Cannot delete employee. They currently have ${activeTicketsCount} active assigned tickets. Reassign tickets first.`,
        400
      );
    }

    await userRepository.delete({ where: { id } });
    return true;
  }
}

module.exports = new EmployeeService();
