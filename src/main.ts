import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from 'src/common/filters/all-exceptions.filter';
import { ValidationExceptionFilter } from 'src/common/filters/validation-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // apply filters
  app.useGlobalFilters(
    new ValidationExceptionFilter(),
    new AllExceptionsFilter(),
  );

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
