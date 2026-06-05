import { createApp } from './bootstrap';

async function bootstrap() {
  const app = await createApp();
  const port = parseInt(process.env.PORT ?? '2005', 10);
  await app.listen(port);
}

void bootstrap();
