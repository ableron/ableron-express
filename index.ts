import { Ableron, AbleronConfig } from 'ableron';
import { Request, Response } from 'express';
import { AbstractLogger } from 'ableron/dist/types/abstract-logger';
const interceptor = require('express-interceptor');

export function createAbleronMiddleware(ableronConfig: AbleronConfig, logger: AbstractLogger): any {
  logger = logger || console;
  const ableron = new Ableron(ableronConfig);

  return interceptor((req: Request, res: Response) => {
    return {
      isInterceptable: () => {
        return (
          !(res.statusCode >= 100 && res.statusCode <= 199) &&
          !(res.statusCode >= 300 && res.statusCode <= 399) &&
          /^text\/html/i.test(res.getHeader('content-type'))
        );
      },
      intercept: (body, send) => {
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
              res.setHeader('Content-Length', transclusionResult.getContent().length);

              if (transclusionResult.getStatusCodeOverride()) {
                res.status(transclusionResult.getStatusCodeOverride());
              }

              send(transclusionResult.getContent());
            })
            .catch((e) => {
              logger.error(`Unable to perform ableron UI composition: ${e.message}`);
              send(body);
            });
        } catch (e) {
          logger.error(`Unable to perform ableron UI composition: ${e.message}`);
          send(body);
        }
      }
    };
  });
}
