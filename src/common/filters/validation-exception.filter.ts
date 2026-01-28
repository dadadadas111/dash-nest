import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from 'src/common/interfaces/response.interface';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let validationErrors: Record<string, string | string[]> = {};

    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    ) {
      const responseObj = exceptionResponse as { message: unknown };
      const messages = responseObj.message;

      if (Array.isArray(messages)) {
        // Transform validation errors into a more readable format
        validationErrors = (messages as unknown[]).reduce(
          (acc: Record<string, string[]>, msg: unknown) => {
            if (typeof msg !== 'string') return acc;
            // Extract field name from error message if possible
            const match = msg.match(/^(\w+)\s/);
            const field = match ? match[1] : 'general';

            const currentErrors = acc[field] || [];
            // Safe assignment instead of mutation which caused unsafe return
            acc[field] = [...currentErrors, msg];
            return acc;
          },
          {} as Record<string, string[]>,
        ) as Record<string, string[]>;
      } else if (typeof messages === 'string') {
        validationErrors = { general: messages };
      }
    }

    const errorResponse: ApiResponse = {
      success: false,
      message: 'Validation failed',
      error: validationErrors,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(errorResponse);
  }
}
