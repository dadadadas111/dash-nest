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

    let validationErrors: any = {};

    if (
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const messages = exceptionResponse.message;

      if (Array.isArray(messages)) {
        // Transform validation errors into a more readable format
        validationErrors = messages.reduce((acc, msg) => {
          // Extract field name from error message if possible
          const match = msg.match(/^(\w+)\s/);
          const field = match ? match[1] : 'general';

          if (!acc[field]) {
            acc[field] = [];
          }
          acc[field].push(msg);
          return acc;
        }, {});
      } else {
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
