import { Ableron, AbleronConfig, AbstractLogger } from '@ableron/ableron';
import { NextFunction, Request, Response } from 'express';

export function createAbleronMiddleware(ableronConfig?: Partial<AbleronConfig>, providedLogger?: AbstractLogger): any {
  const ableron = new Ableron(ableronConfig || {});
  const logger = providedLogger || console;

  return (req: Request, res: Response, next: NextFunction) => {
    const originalEnd = res.end;
    const originalWrite = res.write;
    const chunks: Buffer[] = [];
    let isIntercepting = false;
    let isFirstWrite = true;

    function intercept(chunk, encoding) {
      if (isFirstWrite) {
        isFirstWrite = false;
        isIntercepting =
          !(res.statusCode >= 100 && res.statusCode <= 199) &&
          !(res.statusCode >= 300 && res.statusCode <= 399) &&
          (!res.getHeader('content-type') || /^text\/html/i.test(String(res.getHeader('content-type'))));
      }

      if (isIntercepting && chunk && (typeof chunk === 'string' || Buffer.isBuffer(chunk))) {
        chunks.push(
          Buffer.isBuffer(chunk)
            ? chunk
            : Buffer.from(chunk, typeof encoding === 'string' && Buffer.isEncoding(encoding) ? encoding : 'utf8')
        );
      }

      return isIntercepting;
    }

    // @ts-ignore
    res.write = (
      chunk: any,
      encodingOrCallback?: BufferEncoding | ((error: Error | null | undefined) => void),
      callback?: (error: Error | null | undefined) => void
    ) => {
      if (!intercept(chunk, encodingOrCallback)) {
        // @ts-ignore
        originalWrite.call(res, chunk, encodingOrCallback, callback);
      }
    };

    // @ts-ignore
    res.end = function (
      chunkOrCallback?: any,
      encodingOrCallback?: BufferEncoding | (() => void),
      callback?: () => void
    ) {
      if (intercept(chunkOrCallback, encodingOrCallback)) {
        isIntercepting = false;
        const originalBody = Buffer.concat(chunks).toString('utf8');
        let callbackToPass;

        if (typeof chunkOrCallback === 'function') {
          callbackToPass = chunkOrCallback;
        } else if (typeof encodingOrCallback === 'function') {
          callbackToPass = encodingOrCallback;
        } else {
          callbackToPass = callback;
        }

        try {
          ableron
            .resolveIncludes(originalBody, req.headers)
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
              originalEnd.call(res, transclusionResult.getContent(), 'utf8', callbackToPass);
            })
            .catch((e) => {
              logger.error(`Unable to perform ableron UI composition: ${e.stack || e.message}`);
              originalEnd.call(res, originalBody, 'utf8', callbackToPass);
            });
        } catch (e: any) {
          logger.error(`Unable to perform ableron UI composition: ${e.stack || e.message}`);
          originalEnd.call(res, originalBody, 'utf8', callbackToPass);
        }
      } else {
        // @ts-ignore
        originalEnd.apply(res, Array.from(arguments));
      }
    };

    if (next) {
      next();
    }
  };
}
