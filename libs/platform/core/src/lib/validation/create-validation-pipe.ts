import { HttpStatus, UnprocessableEntityException, ValidationPipe } from '@nestjs/common';

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    exceptionFactory: (errors) =>
      new UnprocessableEntityException({
        error: 'Unprocessable Entity',
        message: errors.flatMap((error) => Object.values(error.constraints ?? {})),
      }),
  });
}
