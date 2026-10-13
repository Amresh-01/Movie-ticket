import { createApp } from './app';
import { config } from './config/env';

const app = createApp();

app.listen(config.port, () => {
  console.log(`🚀 Cinema Booking API server running on http://localhost:${config.port}`);
});
