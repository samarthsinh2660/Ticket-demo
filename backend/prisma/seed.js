const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding rich database records...');

  // Clean existing tables to avoid unique constraint violations on re-seeding
  await prisma.activityLog.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Cleared existing database records.');

  // Pre-hash passwords
  const hashedAdmin = await bcrypt.hash('admin123', 10);
  const hashedCustomer = await bcrypt.hash('customer123', 10);
  const hashedStaff = await bcrypt.hash('password123', 10);

  // 1. Seed Administrators
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'System Admin',
      password: hashedAdmin,
      role: 'ADMIN',
      department: 'Management',
    },
  });

  // 2. Seed Employees
  const dev = await prisma.user.create({
    data: {
      email: 'dev1@example.com',
      name: 'Alice Dev',
      password: hashedStaff,
      role: 'EMPLOYEE',
      department: 'Engineering',
      status: 'ACTIVE',
    },
  });

  const support = await prisma.user.create({
    data: {
      email: 'support1@example.com',
      name: 'Bob Support',
      password: hashedStaff,
      role: 'EMPLOYEE',
      department: 'Customer Success',
      status: 'ACTIVE',
    },
  });

  const billing = await prisma.user.create({
    data: {
      email: 'billing1@example.com',
      name: 'Charlie Billing',
      password: hashedStaff,
      role: 'EMPLOYEE',
      department: 'Finance',
      status: 'ACTIVE',
    },
  });

  const inactiveStaff = await prisma.user.create({
    data: {
      email: 'inactive_staff@example.com',
      name: 'Diana Former',
      password: hashedStaff,
      role: 'EMPLOYEE',
      department: 'Marketing',
      status: 'INACTIVE',
    },
  });

  // 3. Seed Customers
  const customer1 = await prisma.user.create({
    data: {
      email: 'customer@example.com',
      name: 'Jane Customer',
      password: hashedCustomer,
      role: 'CUSTOMER',
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: 'customer2@example.com',
      name: 'John Doe Customer',
      password: hashedCustomer,
      role: 'CUSTOMER',
    },
  });

  const customer3 = await prisma.user.create({
    data: {
      email: 'acme@example.com',
      name: 'ACME Corp Client',
      password: hashedCustomer,
      role: 'CUSTOMER',
    },
  });

  console.log('Seeded demo users.');

  // 4. Seed Tickets with diverse statuses, priorities, and categories
  const ticketsData = [
    {
      ticketNumber: 'TCK-1001',
      title: 'Database connection pools leaking',
      description: 'The production database shows connection count creeping up to max under heavy loads. Needs pgpool configuration inspection.',
      status: 'TO_DO',
      priority: 'CRITICAL',
      category: 'TECHNICAL',
      customerId: customer1.id,
      assigneeId: dev.id,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    },
    {
      ticketNumber: 'TCK-1002',
      title: 'Payment gateway timeout on checkout',
      description: 'Users reporting billing failures at stripe redirection screen. Check webhooks response timestamps.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      category: 'BILLING',
      customerId: customer2.id,
      assigneeId: billing.id,
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    },
    {
      ticketNumber: 'TCK-1003',
      title: 'Dark mode styling fixes for modals',
      description: 'Modal borders are rendering default slate-200 color in dark theme instead of slate-700 gray. Adjust colors.',
      status: 'DONE',
      priority: 'LOW',
      category: 'BUG',
      customerId: customer1.id,
      assigneeId: dev.id,
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      ticketNumber: 'TCK-1004',
      title: 'Add export to CSV button on boards',
      description: 'Customers requesting an export option to pull ticket history boards into local excel tables.',
      status: 'TO_DO',
      priority: 'MEDIUM',
      category: 'FEATURE_REQUEST',
      customerId: customer3.id,
      assigneeId: null, // Unassigned
    },
    {
      ticketNumber: 'TCK-1005',
      title: 'API endpoint throws 500 on large file upload',
      description: 'Large log uploads exceed body parser configurations, triggering raw express failures. Increase upload limits.',
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
      category: 'BUG',
      customerId: customer3.id,
      assigneeId: dev.id,
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    },
    {
      ticketNumber: 'TCK-1006',
      title: 'Subscription invoices not sending automatically',
      description: 'Monthly renew invoices are generated in stripe dashboard but email triggers fail to deploy to customer inbox.',
      status: 'TO_DO',
      priority: 'HIGH',
      category: 'BILLING',
      customerId: customer2.id,
      assigneeId: billing.id,
    },
    {
      ticketNumber: 'TCK-1007',
      title: 'Reset password link redirects to blank page',
      description: 'Auth token reset link contains double slashes in URL pathname. Clean route template generators.',
      status: 'CLOSED',
      priority: 'CRITICAL',
      category: 'BUG',
      customerId: customer1.id,
      assigneeId: support.id,
    },
    {
      ticketNumber: 'TCK-1008',
      title: 'Workspace onboarding instructions document',
      description: 'Create a static markup details drawer outlining how to invite members and assign workspace projects.',
      status: 'DONE',
      priority: 'MEDIUM',
      category: 'SUPPORT',
      customerId: customer2.id,
      assigneeId: support.id,
    },
    {
      ticketNumber: 'TCK-1009',
      title: 'High memory usage on chart components render',
      description: 'Recharts canvas loops triggers redraw loops on window resizing events. Throttle window listener hooks.',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      category: 'TECHNICAL',
      customerId: customer3.id,
      assigneeId: dev.id,
    },
    {
      ticketNumber: 'TCK-1010',
      title: 'Add custom field tagging support',
      description: 'Provide custom metadata tag arrays on tickets schemas to support nested filtering boards.',
      status: 'TO_DO',
      priority: 'LOW',
      category: 'FEATURE_REQUEST',
      customerId: customer1.id,
      assigneeId: null,
    },
    {
      ticketNumber: 'TCK-1011',
      title: 'Refund processing for duplicate transaction',
      description: 'Customer charged twice during billing page refresh. Trigger stripe refund and log activity.',
      status: 'DONE',
      priority: 'CRITICAL',
      category: 'BILLING',
      customerId: customer2.id,
      assigneeId: billing.id,
    },
    {
      ticketNumber: 'TCK-1012',
      title: 'Update privacy policies agreement modal',
      description: 'Display standard policies checklist block before registration forms submit.',
      status: 'TO_DO',
      priority: 'LOW',
      category: 'OTHER',
      customerId: customer3.id,
      assigneeId: null,
    }
  ];

  const tickets = [];
  for (const tData of ticketsData) {
    const ticket = await prisma.ticket.create({
      data: tData,
    });
    tickets.push(ticket);
  }

  console.log('Seeded demo tickets.');

  // 5. Seed Activity Logs
  const logsData = [
    {
      ticketId: tickets[0].id,
      userId: customer1.id,
      action: 'Created',
      details: 'Ticket raised by customer',
    },
    {
      ticketId: tickets[0].id,
      userId: admin.id,
      action: 'Assigned',
      details: 'Assigned to Alice Dev',
    },
    {
      ticketId: tickets[1].id,
      userId: customer2.id,
      action: 'Created',
      details: 'Ticket raised by customer',
    },
    {
      ticketId: tickets[1].id,
      userId: admin.id,
      action: 'Assigned',
      details: 'Assigned to Charlie Billing',
    },
    {
      ticketId: tickets[2].id,
      userId: customer1.id,
      action: 'Created',
      details: 'Ticket raised by customer',
    },
    {
      ticketId: tickets[2].id,
      userId: dev.id,
      action: 'Status Changed',
      details: 'Status updated from TO_DO to DONE',
    },
    {
      ticketId: tickets[4].id,
      userId: customer3.id,
      action: 'Created',
      details: 'Ticket raised by customer',
    },
    {
      ticketId: tickets[4].id,
      userId: dev.id,
      action: 'Employee Reply',
      details: 'We are investigating the parser limit configurations now.',
    },
    {
      ticketId: tickets[6].id,
      userId: customer1.id,
      action: 'Created',
      details: 'Ticket raised by customer',
    },
    {
      ticketId: tickets[6].id,
      userId: support.id,
      action: 'Closed',
      details: 'Resolved password link path configs and verified link.',
    }
  ];

  for (const log of logsData) {
    await prisma.activityLog.create({
      data: log,
    });
  }

  console.log('Seeded demo activity logs.');
  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
