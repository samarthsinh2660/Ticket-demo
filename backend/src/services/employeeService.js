const userRepository = require('../repositories/userRepository');
const ticketRepository = require('../repositories/ticketRepository');
const AppError = require('../utils/appError');
const bcrypt = require('bcryptjs');
const prisma = require('../database');

class EmployeeService {
  /**
   * List all employees with filter, search, sort, and pagination.
   * Computes counts for assigned, open, and completed tickets.
   */
  async getEmployees(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10)); // cap at 100
    const offset = (page - 1) * limit;


    const sqlFilters = ["u.role IN ('EMPLOYEE', 'ADMIN')"];
    const sqlParams = [];

    // Filters
    if (query.role) {
      sqlParams.push(query.role);
      sqlFilters.push(`u.role = $${sqlParams.length}`);
    }
    if (query.status) {
      sqlParams.push(query.status);
      sqlFilters.push(`u.status = $${sqlParams.length}`);
    }
    if (query.department) {
      sqlParams.push(`%${query.department}%`);
      sqlFilters.push(`u.department ILIKE $${sqlParams.length}`);
    }

    // Search by name, email, department
    if (query.search) {
      sqlParams.push(`%${query.search}%`);
      sqlFilters.push(`(u.name ILIKE $${sqlParams.length} OR u.email ILIKE $${sqlParams.length} OR u.department ILIKE $${sqlParams.length})`);
    }

    const whereClause = sqlFilters.join(' AND ');

    // Determine sorting column — strict whitelist to prevent SQL injection in raw query
    const ALLOWED_SORT_KEYS = ['workload', 'completionRate', 'overdueCount', 'lastActivity', 'name', 'email', 'department', 'createdAt'];
    if (query.sortBy && !ALLOWED_SORT_KEYS.includes(query.sortBy)) {
      throw new AppError(`Invalid sortBy value. Permitted: ${ALLOWED_SORT_KEYS.join(', ')}`, 400);
    }

    let sortColumn = 'u."createdAt"';

    if (query.sortBy === 'workload') {
      sortColumn = 'COUNT(t.id) FILTER (WHERE t.status != \'DONE\' AND t.status != \'CLOSED\')';
    } else if (query.sortBy === 'completionRate') {
      sortColumn = 'CASE WHEN COUNT(t.id) > 0 THEN (COUNT(t.id) FILTER (WHERE t.status = \'DONE\' OR t.status = \'CLOSED\')::float / COUNT(t.id)) * 100 ELSE 0 END';
    } else if (query.sortBy === 'overdueCount') {
      sortColumn = 'COUNT(t.id) FILTER (WHERE t.status != \'DONE\' AND t.status != \'CLOSED\' AND t."dueDate" IS NOT NULL AND t."dueDate" < NOW())';
    } else if (query.sortBy === 'lastActivity') {
      sortColumn = 'COALESCE(MAX(t."updatedAt"), u."createdAt")';
    } else if (query.sortBy === 'name') {
      sortColumn = 'u.name';
    } else if (query.sortBy === 'email') {
      sortColumn = 'u.email';
    } else if (query.sortBy === 'department') {
      sortColumn = 'u.department';
    }
    const sortOrder = query.sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Count query
    const countQuery = `
      SELECT COUNT(DISTINCT u.id)::int as total
      FROM users u
      LEFT JOIN tickets t ON t."assigneeId" = u.id
      WHERE ${whereClause}
    `;
    const countResults = await prisma.$queryRawUnsafe(countQuery, ...sqlParams);
    const totalCount = countResults[0]?.total || 0;

    // Fetch data query
    const dataQuery = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.department, 
        u.status, 
        u."createdAt", 
        u."updatedAt",
        COUNT(t.id)::int AS "assignedTicketsCount",
        COUNT(t.id) FILTER (WHERE t.status != 'DONE' AND t.status != 'CLOSED')::int AS "openTicketsCount",
        COUNT(t.id) FILTER (WHERE t.status = 'DONE' OR t.status = 'CLOSED')::int AS "completedTicketsCount",
        COUNT(t.id) FILTER (WHERE t.status = 'TO_DO')::int AS "todoTicketsCount",
        COUNT(t.id) FILTER (WHERE t.status = 'IN_PROGRESS')::int AS "inProgressTicketsCount",
        COUNT(t.id) FILTER (WHERE t.status = 'CLOSED')::int AS "closedTicketsCount",
        COUNT(t.id) FILTER (WHERE t.status != 'DONE' AND t.status != 'CLOSED' AND t."dueDate" IS NOT NULL AND t."dueDate" < NOW())::int AS "overdueCount",
        (
          SELECT json_build_object(
            'id', lt.id, 
            'ticketNumber', lt."ticketNumber", 
            'title', lt.title, 
            'updatedAt', lt."updatedAt"
          )
          FROM tickets lt
          WHERE lt."assigneeId" = u.id AND (lt.status = 'DONE' OR lt.status = 'CLOSED')
          ORDER BY lt."updatedAt" DESC
          LIMIT 1
        ) AS "lastCompletedTicket",
        COALESCE(
          (
            SELECT ROUND(AVG(EXTRACT(EPOCH FROM (rt."updatedAt" - rt."createdAt")) / 3600))::int
            FROM tickets rt
            WHERE rt."assigneeId" = u.id AND (rt.status = 'DONE' OR rt.status = 'CLOSED')
          ),
          0
        ) AS "avgResolutionTime",
        COALESCE(MAX(t."updatedAt"), u."createdAt") AS "lastActivity"
      FROM users u
      LEFT JOIN tickets t ON t."assigneeId" = u.id
      WHERE ${whereClause}
      GROUP BY u.id, u.name, u.email, u.role, u.department, u.status, u."createdAt", u."updatedAt"
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const rawEmployees = await prisma.$queryRawUnsafe(dataQuery, ...sqlParams);

    // Format metrics
    const formattedEmployees = rawEmployees.map((emp) => {
      const assignedCount = emp.assignedTicketsCount || 0;
      const completedCount = emp.completedTicketsCount || 0;
      const completionRate = assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0;

      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        role: emp.role,
        department: emp.department,
        status: emp.status,
        createdAt: emp.createdAt,
        updatedAt: emp.updatedAt,
        assignedTicketsCount: assignedCount,
        openTicketsCount: emp.openTicketsCount || 0,
        todoTicketsCount: emp.todoTicketsCount || 0,
        inProgressTicketsCount: emp.inProgressTicketsCount || 0,
        completedTicketsCount: completedCount,
        closedTicketsCount: emp.closedTicketsCount || 0,
        workload: emp.openTicketsCount || 0, // raw open tickets count
        completionRate,
        avgResolutionTime: emp.avgResolutionTime || 0,
        overdueCount: emp.overdueCount || 0,
        lastCompletedTicket: emp.lastCompletedTicket || null,
        lastActivity: emp.lastActivity,
      };
    });

    return {
      employees: formattedEmployees,
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
