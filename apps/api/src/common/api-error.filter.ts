import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ApiErrorCode } from '@dinner/shared';
import { ApiException } from './api-error';

interface ErrorPayload {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
}

interface ApiResponseLike {
  status: (statusCode: number) => ApiResponseLike;
  json: (body: unknown) => unknown;
}

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse() as ApiResponseLike;

    const { status, payload } = this.toError(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        exception instanceof Error ? exception.message : String(exception),
      );
    }

    response.status(status).json({ error: payload });
  }

  private toError(exception: unknown): {
    status: number;
    payload: ErrorPayload;
  } {
    if (exception instanceof ApiException) {
      return {
        status: exception.status,
        payload: {
          code: exception.code,
          message: exception.message,
          ...(exception.details !== undefined
            ? { details: exception.details }
            : {}),
        },
      };
    }

    if (exception instanceof HttpException) {
      return {
        status: exception.getStatus(),
        payload: this.httpPayload(exception),
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      payload: {
        code: 'INTERNAL_ERROR',
        message: 'Wystąpił nieoczekiwany błąd serwera.',
      },
    };
  }

  private httpPayload(exception: HttpException): ErrorPayload {
    const response = exception.getResponse();

    if (
      typeof response === 'object' &&
      response !== null &&
      'code' in response
    ) {
      const body = response as {
        code: ApiErrorCode;
        message?: string;
        details?: unknown;
      };

      return {
        code: body.code,
        message: body.message ?? exception.message,
        ...(body.details !== undefined ? { details: body.details } : {}),
      };
    }

    const message = typeof response === 'string' ? response : exception.message;
    return { code: 'HTTP_ERROR', message };
  }
}
