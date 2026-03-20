import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';

/**
 * Intercepteur de performance : log les requêtes lentes (> 500ms)
 * et toutes les requêtes en dev pour le debugging.
 */
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Performance');
  private readonly slowThresholdMs = 500;

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        const { method, url } = request;
        const status = response.statusCode;

        if (duration >= this.slowThresholdMs) {
          this.logger.warn(
            `🐌 SLOW [${method}] ${url} → ${status} (${duration}ms)`,
          );
        }
      }),
    );
  }
}
