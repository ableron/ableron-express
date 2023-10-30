import { Ableron, AbleronConfig, AbstractLogger } from '@ableron/ableron';
import { Request, Response } from 'express';
const interceptor = require('express-interceptor');

export function createAbleronMiddleware(ableronConfig?: AbleronConfig, providedLogger?: AbstractLogger): any {
  const ableron = new Ableron(ableronConfig || {});
  const logger = providedLogger || console;

  return interceptor((req: Request, res: Response) => {
    return {
      isInterceptable: () => {
        return (
          !(res.statusCode >= 100 && res.statusCode <= 199) &&
          !(res.statusCode >= 300 && res.statusCode <= 399) &&
          /^text\/html/i.test(String(res.getHeader('content-type')))
        );
      },
      intercept: (body: string, send: (body: string) => void) => {
        try {
          ableron
            .resolveIncludes(body, req.headers)
            .then((transclusionResult) => {
              transclusionResult
                .getResponseHeadersToPass()
                .forEach((headerValue, headerName) => res.setHeader(headerName, headerValue));
              res.setHeader(
                'Cache-Control',
                transclusionResult.calculateCacheControlHeaderValueByResponseHeaders(res.getHeaders())
              );
              res.setHeader('Content-Length', Buffer.byteLength(transclusionResult.getContent()));
              res.status(transclusionResult.getStatusCodeOverride() || res.statusCode);
              send(transclusionResult.getContent());
            })
            .catch((e) => {
              logger.error(`Unable to perform ableron UI composition: ${e.stack || e.message}`);
              send(body);
            });
        } catch (e: any) {
          logger.error(`Unable to perform ableron UI composition: ${e.stack || e.message}`);
          send(body);
        }
      }
    };
  });
}
