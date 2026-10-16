const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

const DUMMY_MOVIES = [
  {
    title: 'Inception',
    description: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    durationMin: 148,
    language: 'English',
    rating: 'UA',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800',
  },
  {
    title: 'Interstellar',
    description: 'When Earth becomes uninhabitable, a team of ex-NASA astronauts travels through a wormhole near Saturn in search of a new home for mankind.',
    durationMin: 169,
    language: 'English',
    rating: 'UA',
    posterUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800',
  },
  {
    title: 'The Dark Knight',
    description: 'When the menace known as the Joker emerges from his mysterious past, he wreaks havoc and chaos on the people of Gotham City.',
    durationMin: 152,
    language: 'English',
    rating: 'A',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800',
  },
  {
    title: 'Avatar: The Way of Water',
    description: 'Jake Sully lives with his newfound family on the extrasolar moon Pandora. Once a familiar threat returns, he must work with Neytiri and the Na\'vi.',
    durationMin: 192,
    language: 'English',
    rating: 'UA',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
  },
  {
    title: 'Oppenheimer',
    description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
    durationMin: 180,
    language: 'English',
    rating: 'A',
    posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800',
  },
  {
    title: 'Spider-Man: Across the Spider-Verse',
    description: 'Miles Morales catapults across the Multiverse, encountering a team of Spider-People charged with protecting its very existence.',
    durationMin: 140,
    language: 'English',
    rating: 'U',
    posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=800',
  },
  {
    title: 'Dune: Part Two',
    description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
    durationMin: 166,
    language: 'English',
    rating: 'UA',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800',
  },
  {
    title: 'Gladiator II',
    description: 'Years after witnessing the death of Maximus at the hands of his uncle, Lucius must enter the Colosseum to save Rome.',
    durationMin: 148,
    language: 'English',
    rating: 'A',
    posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800',
  }
];

async function seed() {
  console.log('[1/4] Ensuring Screen 1 exists...');
  let screen = await prisma.screen.findFirst({ where: { name: 'Screen 1' } });
  if (!screen) {
    screen = await prisma.screen.create({ data: { name: 'Screen 1' } });
  }

  console.log('[2/4] Verifying 80 physical seats for Screen 1...');
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const seatNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const seatsData = [];
  for (const row of rows) {
    for (const number of seatNumbers) {
      seatsData.push({ screenId: screen.id, row, number });
    }
  }

  await prisma.seat.createMany({
    data: seatsData,
    skipDuplicates: true,
  });

  const allSeats = await prisma.seat.findMany({ where: { screenId: screen.id } });
  console.log(`[INFO] Screen has ${allSeats.length} physical seats ready.`);

  console.log('[3/4] Seeding movies and upcoming shows...');
  const now = new Date();

  for (let i = 0; i < DUMMY_MOVIES.length; i++) {
    const movieData = DUMMY_MOVIES[i];
    
    // Upsert movie
    let movie = await prisma.movie.findFirst({ where: { title: movieData.title } });
    if (!movie) {
      movie = await prisma.movie.create({ data: movieData });
    } else {
      movie = await prisma.movie.update({
        where: { id: movie.id },
        data: {
          description: movieData.description,
          durationMin: movieData.durationMin,
          posterUrl: movieData.posterUrl,
          isActive: true
        }
      });
    }

    // Schedule 2 upcoming shows for each movie (e.g. today evening, tomorrow afternoon)
    const showTimes = [
      { offsetHours: 2 + (i * 1.5), price: 14.50 },
      { offsetHours: 24 + (i * 2), price: 16.00 },
      { offsetHours: 48 + (i * 2.5), price: 15.00 },
    ];

    for (const st of showTimes) {
      const startTime = new Date(now.getTime() + st.offsetHours * 3600 * 1000);
      const endTime = new Date(startTime.getTime() + movie.durationMin * 60 * 1000 + 15 * 60 * 1000);

      // Check if show already exists at this start time
      const existingShow = await prisma.show.findFirst({
        where: {
          movieId: movie.id,
          startTime: {
            gte: new Date(startTime.getTime() - 10 * 60 * 1000),
            lte: new Date(startTime.getTime() + 10 * 60 * 1000)
          }
        }
      });

      if (!existingShow) {
        const show = await prisma.show.create({
          data: {
            movieId: movie.id,
            screenId: screen.id,
            startTime,
            endTime,
            price: st.price,
          }
        });

        // Link the 80 seats to this show
        await prisma.showSeat.createMany({
          data: allSeats.map(seat => ({
            showId: show.id,
            seatId: seat.id,
          })),
          skipDuplicates: true
        });

        console.log(`Created show for "${movie.title}" at ${startTime.toLocaleTimeString()} with 80 seats.`);
      }
    }
  }

  console.log('[4/4] Seed successfully completed!');
}

seed()
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
