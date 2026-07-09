// Baseline env vars so unit tests that transitively import platform-core's
// config module (which validates process.env as soon as it's imported,
// because @nestjs/config's ConfigModule.forRoot runs synchronously) don't
// crash just for lacking a real .env. Individual tests can still override
// process.env.* before importing the module under test.
process.env['DATABASE_URL'] ??= 'postgresql://test:test@localhost:5432/africahr_test';
process.env['REDIS_HOST'] ??= 'localhost';
process.env['REDIS_PORT'] ??= '6379';
