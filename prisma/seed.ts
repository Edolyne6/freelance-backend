import { PrismaClient, UserRole, TaskCategory, TaskStatus } from '@prisma/client';
import { AuthService } from '../src/utils/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@freelancemarketplace.com',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      passwordHash: await AuthService.hashPassword('Admin123!'),
      isVerified: true,
      bio: 'Platform administrator',
      skills: ['Management', 'Support'],
    }
  });

  // Create sample clients
  const client1 = await prisma.user.create({
    data: {
      email: 'client1@example.com',
      username: 'techstartup',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: UserRole.CLIENT,
      passwordHash: await AuthService.hashPassword('Client123!'),
      isVerified: true,
      bio: 'CEO of a tech startup looking for talented developers and designers.',
      location: 'San Francisco, CA',
      timezone: 'America/Los_Angeles',
      languages: ['English'],
      website: 'https://techstartup.example.com',
      linkedin: 'https://linkedin.com/in/sarah-johnson',
      totalSpent: 15000,
    }
  });

  const client2 = await prisma.user.create({
    data: {
      email: 'client2@example.com',
      username: 'marketingagency',
      firstName: 'Michael',
      lastName: 'Chen',
      role: UserRole.CLIENT,
      passwordHash: await AuthService.hashPassword('Client123!'),
      isVerified: true,
      bio: 'Digital marketing agency owner seeking creative professionals.',
      location: 'New York, NY',
      timezone: 'America/New_York',
      languages: ['English', 'Mandarin'],
      website: 'https://marketingpro.example.com',
      totalSpent: 8500,
    }
  });

  // Create sample freelancers
  const freelancer1 = await prisma.user.create({
    data: {
      email: 'freelancer1@example.com',
      username: 'alexdev',
      firstName: 'Alex',
      lastName: 'Rodriguez',
      role: UserRole.FREELANCER,
      passwordHash: await AuthService.hashPassword('Freelancer123!'),
      isVerified: true,
      bio: 'Full-stack developer with 5+ years experience in React, Node.js, and cloud technologies.',
      location: 'Austin, TX',
      timezone: 'America/Chicago',
      languages: ['English', 'Spanish'],
      skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'Docker'],
      hourlyRate: 85,
      website: 'https://alexdev.example.com',
      github: 'https://github.com/alexdev',
      linkedin: 'https://linkedin.com/in/alex-rodriguez',
      averageRating: 4.8,
      totalReviews: 47,
      totalEarnings: 32000,
      portfolio: {
        projects: [
          {
            title: 'E-commerce Platform',
            description: 'Built a scalable e-commerce platform using React and Node.js',
            technologies: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
            url: 'https://github.com/alexdev/ecommerce-platform'
          }
        ]
      }
    }
  });

  const freelancer2 = await prisma.user.create({
    data: {
      email: 'freelancer2@example.com',
      username: 'emilydesign',
      firstName: 'Emily',
      lastName: 'Davis',
      role: UserRole.FREELANCER,
      passwordHash: await AuthService.hashPassword('Freelancer123!'),
      isVerified: true,
      bio: 'Creative UI/UX designer specializing in modern, user-friendly interfaces.',
      location: 'Los Angeles, CA',
      timezone: 'America/Los_Angeles',
      languages: ['English'],
      skills: ['UI/UX Design', 'Figma', 'Adobe Creative Suite', 'Prototyping', 'User Research'],
      hourlyRate: 75,
      website: 'https://emilydesign.example.com',
      linkedin: 'https://linkedin.com/in/emily-davis',
      averageRating: 4.9,
      totalReviews: 33,
      totalEarnings: 28500,
      portfolio: {
        projects: [
          {
            title: 'Mobile App Design',
            description: 'Designed a complete mobile app interface for a fintech startup',
            technologies: ['Figma', 'Principle', 'User Research'],
            url: 'https://behance.net/emilydesign/mobile-app'
          }
        ]
      }
    }
  });

  const freelancer3 = await prisma.user.create({
    data: {
      email: 'freelancer3@example.com',
      username: 'markwriter',
      firstName: 'Mark',
      lastName: 'Thompson',
      role: UserRole.FREELANCER,
      passwordHash: await AuthService.hashPassword('Freelancer123!'),
      isVerified: true,
      bio: 'Professional content writer and copywriter with expertise in tech and marketing.',
      location: 'Remote',
      timezone: 'America/New_York',
      languages: ['English', 'French'],
      skills: ['Content Writing', 'Copywriting', 'SEO', 'Technical Writing', 'Blog Writing'],
      hourlyRate: 45,
      website: 'https://markwriter.example.com',
      linkedin: 'https://linkedin.com/in/mark-thompson',
      averageRating: 4.7,
      totalReviews: 28,
      totalEarnings: 18500,
    }
  });

  // Create sample tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Build a Modern E-commerce Website',
      description: `We need a full-featured e-commerce website built from scratch. The platform should include:

## Requirements:
- User authentication and registration
- Product catalog with search and filtering
- Shopping cart and checkout process
- Payment integration (Stripe)
- Order management system
- Admin dashboard for managing products and orders
- Responsive design for mobile and desktop
- SEO optimization

## Technology Preferences:
- Frontend: React or Next.js
- Backend: Node.js with Express
- Database: PostgreSQL or MongoDB
- Payment: Stripe integration
- Deployment: AWS or Vercel

## Timeline:
We need this completed within 6-8 weeks with regular milestone deliveries.

## Budget:
$8,000 - $12,000 depending on experience and portfolio.`,
      category: TaskCategory.WEB_DEVELOPMENT,
      skills: ['React', 'Node.js', 'PostgreSQL', 'Stripe', 'AWS'],
      budget: 10000,
      budgetType: 'fixed',
      timeline: 56, // 8 weeks
      deadline: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000),
      status: TaskStatus.PUBLISHED,
      clientId: client1.id,
      views: 45,
      isUrgent: false,
      isFeatured: true,
    }
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Mobile App UI/UX Design',
      description: `Looking for a talented UI/UX designer to create a modern, intuitive design for our fitness tracking mobile app.

## Project Scope:
- User research and persona development
- Wireframes and user flow diagrams
- High-fidelity mockups for iOS and Android
- Interactive prototypes
- Design system and style guide
- Developer handoff documentation

## App Features:
- User onboarding and registration
- Workout tracking and planning
- Progress visualization and analytics
- Social features and community
- In-app purchases and subscriptions

## Deliverables:
- Figma files with organized components
- Prototype with key user interactions
- Design specifications for developers
- Style guide and component library

## Timeline:
4-6 weeks with weekly design reviews.`,
      category: TaskCategory.DESIGN,
      skills: ['UI/UX Design', 'Figma', 'Prototyping', 'User Research', 'Mobile Design'],
      budget: 5500,
      budgetType: 'fixed',
      timeline: 42, // 6 weeks
      deadline: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
      status: TaskStatus.PUBLISHED,
      clientId: client2.id,
      views: 32,
      isUrgent: false,
      isFeatured: false,
    }
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Technical Blog Writing - 10 Articles',
      description: `Seeking an experienced technical writer to create high-quality blog content for our SaaS platform.

## Content Requirements:
- 10 in-depth technical articles (2000-3000 words each)
- Topics around cloud computing, DevOps, and software development
- SEO-optimized content with keyword research
- Engaging titles and meta descriptions
- Code examples and practical tutorials
- Images and diagrams where appropriate

## Sample Topics:
- "Complete Guide to Docker for Developers"
- "Kubernetes Best Practices for Production"
- "Building Scalable APIs with Node.js"
- "CI/CD Pipeline Setup with GitHub Actions"
- "Monitoring and Logging in Microservices"

## Requirements:
- Technical writing experience required
- Software development background preferred
- Portfolio of published technical content
- Native English proficiency
- SEO knowledge

## Timeline:
2 articles per week over 5 weeks.`,
      category: TaskCategory.WRITING,
      skills: ['Technical Writing', 'Content Writing', 'SEO', 'Software Development', 'Blog Writing'],
      budget: 75,
      budgetType: 'hourly',
      timeline: 35, // 5 weeks
      deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
      status: TaskStatus.PUBLISHED,
      clientId: client1.id,
      views: 18,
      isUrgent: false,
      isFeatured: false,
    }
  });

  // Create sample bids
  const bid1 = await prisma.bid.create({
    data: {
      amount: 9500,
      coverLetter: `Hello Sarah,

I'm excited about your e-commerce project and believe I'm the perfect fit for this job. With 5+ years of full-stack development experience, I've built several e-commerce platforms similar to what you're looking for.

## My Approach:
- Week 1-2: Project setup, user authentication, and basic structure
- Week 3-4: Product catalog and search functionality
- Week 5-6: Shopping cart and checkout process
- Week 7-8: Payment integration, admin dashboard, and final testing

## Why Choose Me:
- Proven experience with React, Node.js, and PostgreSQL
- Previous e-commerce projects in my portfolio
- Strong focus on responsive design and SEO
- Regular communication and milestone deliveries
- 30-day warranty on all delivered work

I can start immediately and deliver a high-quality, scalable solution within your timeline. Let's discuss your specific requirements in detail.

Best regards,
Alex Rodriguez`,
      timeline: 56,
      status: 'PENDING',
      taskId: task1.id,
      freelancerId: freelancer1.id,
      milestones: {
        milestones: [
          { title: 'Project Setup & Authentication', amount: 2000, timeline: 14 },
          { title: 'Product Catalog & Search', amount: 2500, timeline: 14 },
          { title: 'Shopping Cart & Checkout', amount: 2500, timeline: 14 },
          { title: 'Payment & Admin Dashboard', amount: 2500, timeline: 14 }
        ]
      }
    }
  });

  const bid2 = await prisma.bid.create({
    data: {
      amount: 5200,
      coverLetter: `Hi Michael,

I'm Emily, a UI/UX designer with extensive experience in mobile app design. Your fitness app project aligns perfectly with my expertise and passion for health and wellness applications.

## My Design Process:
1. **Discovery Phase** (Week 1)
   - User research and competitive analysis
   - Define user personas and journey maps

2. **Design Phase** (Week 2-4)
   - Wireframes and information architecture
   - High-fidelity mockups for all screens
   - Interactive prototypes

3. **Refinement Phase** (Week 5-6)
   - Design system creation
   - Developer handoff documentation
   - Final revisions based on feedback

## What You'll Get:
- Complete Figma design files
- Interactive InVision prototype
- Comprehensive design system
- Developer handoff specifications
- 2 rounds of revisions included

I've designed 3 fitness apps in the past year, and I understand the importance of motivation, ease of use, and data visualization in this space. Check out my portfolio for similar projects.

Looking forward to creating an amazing user experience for your app!

Best,
Emily Davis`,
      timeline: 42,
      status: 'PENDING',
      taskId: task2.id,
      freelancerId: freelancer2.id,
    }
  });

  const bid3 = await prisma.bid.create({
    data: {
      amount: 65,
      coverLetter: `Hello,

I'm Mark, a technical writer specializing in software development and DevOps content. I've written over 200 technical articles for various SaaS companies and developer publications.

## My Qualifications:
- 8+ years in technical writing
- Software development background (5 years as a developer)
- Published author on Medium, Dev.to, and company blogs
- SEO expertise with proven traffic growth results
- Experience with the exact topics you mentioned

## My Process:
- Comprehensive topic research and keyword analysis
- Outline creation and approval before writing
- In-depth articles with practical examples
- Code samples tested and validated
- SEO optimization with meta descriptions
- 2 revision rounds included

## Sample Work:
I can provide links to my published articles on Docker, Kubernetes, and Node.js that have generated thousands of views and high engagement.

I can deliver 2 high-quality articles per week consistently, meeting your 5-week timeline. Each article will be thoroughly researched, technically accurate, and optimized for search engines.

Let's discuss your content strategy and specific requirements.

Best regards,
Mark Thompson`,
      timeline: 35,
      status: 'PENDING',
      taskId: task3.id,
      freelancerId: freelancer3.id,
    }
  });

  // Create sample reviews
  await prisma.review.create({
    data: {
      rating: 5,
      comment: `Alex delivered exceptional work on our e-commerce platform. The code quality is outstanding, and he completed the project ahead of schedule. Great communication throughout the project and very professional. Highly recommended!`,
      taskId: task1.id,
      authorId: client1.id,
      recipientId: freelancer1.id,
    }
  });

  await prisma.review.create({
    data: {
      rating: 5,
      comment: `Emily's design work exceeded our expectations. The UI is beautiful and intuitive, and her attention to detail is remarkable. She understood our brand perfectly and delivered a design that our users love. Will definitely work with her again!`,
      taskId: task2.id,
      authorId: client2.id,
      recipientId: freelancer2.id,
    }
  });

  // Create sample notifications
  await prisma.notification.create({
    data: {
      type: 'NEW_BID',
      title: 'New Bid Received',
      message: 'Alex Rodriguez submitted a bid on your e-commerce project',
      userId: client1.id,
      metadata: {
        taskId: task1.id,
        bidId: bid1.id,
        freelancerId: freelancer1.id
      }
    }
  });

  await prisma.notification.create({
    data: {
      type: 'NEW_BID',
      title: 'New Bid Received',
      message: 'Emily Davis submitted a bid on your mobile app design project',
      userId: client2.id,
      metadata: {
        taskId: task2.id,
        bidId: bid2.id,
        freelancerId: freelancer2.id
      }
    }
  });

  // Create sample saved searches
  await prisma.savedSearch.create({
    data: {
      name: 'React Developers',
      query: 'react developer',
      filters: {
        skills: ['React', 'JavaScript', 'TypeScript'],
        minBudget: 5000,
        categories: ['WEB_DEVELOPMENT']
      },
      userId: client1.id,
    }
  });

  await prisma.savedSearch.create({
    data: {
      name: 'UI/UX Designers',
      query: 'ui ux designer',
      filters: {
        skills: ['UI/UX Design', 'Figma', 'Prototyping'],
        minBudget: 3000,
        categories: ['DESIGN']
      },
      userId: client2.id,
    }
  });

  // Create sample analytics data
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  await prisma.analytics.create({
    data: {
      date: today,
      totalUsers: 156,
      totalTasks: 42,
      totalPayments: 25000,
      platformRevenue: 1250,
      newSignups: 8,
      tasksCompleted: 5,
    }
  });

  await prisma.analytics.create({
    data: {
      date: yesterday,
      totalUsers: 148,
      totalTasks: 38,
      totalPayments: 22000,
      platformRevenue: 1100,
      newSignups: 12,
      tasksCompleted: 3,
    }
  });

  console.log('✅ Database seeding completed successfully!');
  
  console.log('\n🎯 Sample Data Created:');
  console.log(`👤 Admin: admin@freelancemarketplace.com (password: Admin123!)`);
  console.log(`👨‍💼 Client 1: client1@example.com (password: Client123!)`);
  console.log(`👨‍💼 Client 2: client2@example.com (password: Client123!)`);
  console.log(`👨‍💻 Freelancer 1: freelancer1@example.com (password: Freelancer123!)`);
  console.log(`👩‍🎨 Freelancer 2: freelancer2@example.com (password: Freelancer123!)`);
  console.log(`✍️ Freelancer 3: freelancer3@example.com (password: Freelancer123!)`);
  console.log(`📋 Tasks: 3 sample tasks created`);
  console.log(`💼 Bids: 3 sample bids created`);
  console.log(`⭐ Reviews: 2 sample reviews created`);
  console.log(`🔍 Saved Searches: 2 sample searches created`);
  console.log(`📊 Analytics: 2 days of sample data created`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
