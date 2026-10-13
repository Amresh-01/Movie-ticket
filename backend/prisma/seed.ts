import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Seed Script ---');

  // 1. Seed Screen 1
  let screen = await prisma.screen.findFirst({
    where: { name: 'Screen 1' },
  });

  if (!screen) {
    screen = await prisma.screen.create({
      data: {
        name: 'Screen 1',
      },
    });
    console.log(`Created Screen: ${screen.name} (${screen.id})`);
  } else {
    console.log(`Screen already exists: ${screen.name}`);
  }

  // 2. Seed exactly 80 seats: Rows A through H, Seats 1 through 10
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const seatNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  let seatCount = 0;
  for (const row of rows) {
    for (const number of seatNumbers) {
      await prisma.seat.upsert({
        where: {
          screenId_row_number: {
            screenId: screen.id,
            row,
            number,
          },
        },
        update: {},
        create: {
          screenId: screen.id,
          row,
          number,
        },
      });
      seatCount++;
    }
  }
  console.log(`Verified/Seeded ${seatCount} physical seats for ${screen.name}`);

  // 3. Seed Admin user (never registered through public endpoints)
  const adminEmail = 'admin@cinema.com';
  const adminPassword = 'Admin@12345Password!';
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: Role.ADMIN,
    },
    create: {
      email: adminEmail,
      name: 'Cinema Administrator',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });
  console.log(`Seeded Admin User: ${admin.email} (Role: ${admin.role})`);

  // 4. Seed a sample customer user for testing
  const customerEmail = 'customer@test.com';
  const customerPassword = 'Customer@12345Password!';
  const customerPasswordHash = await bcrypt.hash(customerPassword, 12);

  const customer = await prisma.user.upsert({
    where: { email: customerEmail },
    update: {},
    create: {
      email: customerEmail,
      name: 'John Doe',
      passwordHash: customerPasswordHash,
      role: Role.CUSTOMER,
    },
  });
  console.log(`Seeded Demo Customer: ${customer.email} (Role: ${customer.role})`);

  // 5. Seed sample movies
  const moviesData = [
    {
      title: 'Inception',
      description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea.',
      durationMin: 148,
      language: 'English',
      rating: 'UA',
      posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800',
    },
    {
      title: 'Interstellar',
      description: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot is tasked to pilot a spacecraft along with a team of researchers.',
      durationMin: 169,
      language: 'English',
      rating: 'UA',
      posterUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800',
    },
    {
      title: 'The Dark Knight',
      description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological tests.',
      durationMin: 152,
      language: 'English',
      rating: 'A',
      posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800',
    },
  ];

  const createdMovies = [];
  for (const m of moviesData) {
    const movie = await prisma.movie.upsert({
      where: { id: m.title }, // will create if not found
      update: {},
      create: {
        title: m.title,
        description: m.description,
        durationMin: m.durationMin,
        language: m.language,
        rating: m.rating,
        posterUrl: m.posterUrl,
      },
    }).catch(async () => {
      // fallback search by title
      const existing = await prisma.movie.findFirst({ where: { title: m.title } });
      if (existing) return existing;
      return prisma.movie.create({ data: m });
    });
    createdMovies.push(movie);
  }
  console.log(`Seeded ${createdMovies.length} sample movies`);

  // 6. Seed an upcoming show for Movie 1
  const movie1 = createdMovies[0];
  const startTime = new Date();
  startTime.setHours(startTime.getHours() + 2); // 2 hours in the future
  const endTime = new Date(startTime.getTime() + movie1.durationMin * 60000 + 15 * 60000); // duration + 15 min buffer

  let sampleShow = await prisma.show.findFirst({
    where: {
      movieId: movie1.id,
      screenId: screen.id,
    },
  });

  if (!sampleShow) {
    sampleShow = await prisma.show.create({
      data: {
        movieId: movie1.id,
        screenId: screen.id,
        startTime,
        endTime,
        price: 12.50,
      },
    });

    // Populate the 80 ShowSeat instances for this show
    const seats = await prisma.seat.findMany({
      where: { screenId: screen.id },
    });

    await prisma.showSeat.createMany({
      data: seats.map((seat) => ({
        showId: sampleShow!.id,
        seatId: seat.id,
      })),
      skipDuplicates: true,
    });
    console.log(`Created sample show for '${movie1.title}' with 80 show-seats linked`);
  } else {
    console.log(`Sample show already exists for '${movie1.title}'`);
  }

  console.log('--- Seed Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
