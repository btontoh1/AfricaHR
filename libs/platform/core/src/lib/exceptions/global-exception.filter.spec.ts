import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let logger: jest.Mocked<PinoLogger>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    logger = {
      setContext: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    } as unknown as jest.Mocked<PinoLogger>;

    filter = new GlobalExceptionFilter(logger);

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    host = {
      switchToHttp: () => ({
        getResponse: () => ({ status: statusMock }),
        getRequest: () => ({ url: '/api/employees', id: 'corr-123' }),
      }),
    } as unknown as ArgumentsHost;
  });

  it('maps an HttpException to its status and message', () => {
    filter.catch(new BadRequestException('Invalid payload'), host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid payload',
        path: '/api/employees',
        correlationId: 'corr-123',
      }),
    );
    expect(logger.warn).toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('maps an unknown error to a 500 without leaking internals', () => {
    filter.catch(new Error('db connection string leaked'), host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      }),
    );
    expect(logger.error).toHaveBeenCalled();
  });
});
