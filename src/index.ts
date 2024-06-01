import { Ableron, AbleronConfig, LoggerInterface } from '@ableron/ableron';
import type { NextFunction, Request, Response } from 'express';

export default function ableron(config?: Partial<AbleronConfig>, logger?: LoggerInterface): any {
  const ableron = new Ableron(config || {}, logger);

  if (!ableron.getConfig().enabled) {
    return (req: Request, res: Response, next: NextFunction) => {
      next && next();
    };
  }

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
          (!res.getHeader('content-type') || isHtmlResponse(res));
      }

      if (isIntercepting && chunk && (typeof chunk === 'string' || Buffer.isBuffer(chunk))) {
        chunks.push(
          Buffer.isBuffer(chunk)
            ? chunk
            : Buffer.from(chunk, typeof encoding === 'string' && Buffer.isEncoding(encoding) ? encoding : 'utf8')
        );
      }

      if (!isIntercepting) {
        ableron
          .getLogger()
          .debug(
            `[Ableron] Skipping UI composition (response status: ${res.statusCode}, content-type: ${res.getHeader(
              'content-type'
            )})`
          );
      }

      return isIntercepting;
    }

    function isHtmlResponse(res: Response) {
      return /^text\/html/i.test(String(res.getHeader('content-type')));
    }

    // @ts-ignore
    res.write = function (
      chunk: string | Buffer | Uint8Array,
      encodingOrCallback?: BufferEncoding | ((error: Error | null | undefined) => void),
      callback?: (error: Error | null | undefined) => void
    ) {
      if (!intercept(chunk, encodingOrCallback)) {
        // @ts-ignore
        originalWrite.apply(res, Array.from(arguments));
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

        if (isHtmlResponse(res)) {
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
                ableron.getLogger().error(`[Ableron] Unable to perform UI composition: ${e.stack || e.message}`);
                originalEnd.call(res, originalBody, 'utf8', callbackToPass);
              });
          } catch (e: any) {
            ableron.getLogger().error(`[Ableron] Unable to perform UI composition: ${e.stack || e.message}`);
            originalEnd.call(res, originalBody, 'utf8', callbackToPass);
          }
        } else {
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
