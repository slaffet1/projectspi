import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:80',
      'http://localhost',
    ],
    methods: 'GET,POST,PUT,DELETE,PATCH',
    credentials: true,
  });
  console.log('NODE_ENV:', process.env.NODE_ENV);
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
