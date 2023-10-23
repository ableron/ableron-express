import {Ableron, AbleronConfig} from 'ableron';
import {NextFunction, Request, Response} from 'express';

export function ableronMiddleware(ableronConfig: AbleronConfig) {
  const ableron = new Ableron(ableronConfig);

  return (req: Request, res: Response, next: NextFunction) => {
    const write = res.write;
    // @ts-ignore, TODO
    res.write = async function (chunk) {
      // @ts-ignore, TODO
      if (res.getHeader('Content-Type').indexOf('text/html') !== -1) {
        chunk instanceof Buffer && (chunk = chunk.toString());

        // @ts-ignore, TODO
        const transclusionResult = await ableron.resolveIncludes(chunk, req.headers)
        transclusionResult.getResponseHeadersToPass().forEach((headerValue, headerName) => res.setHeader(headerName, headerValue))
        // @ts-ignore, TODO
        res.setHeader('Cache-Control', transclusionResult.calculateCacheControlHeaderValueByResponseHeaders(res.getHeaders()))

        if (transclusionResult.getStatusCodeOverride()) {
          // @ts-ignore, TODO
          res.status(transclusionResult.getStatusCodeOverride())
        }

        chunk = transclusionResult.getContent();
        res.setHeader('Content-Length', chunk.length);
      }
      // @ts-ignore, TODO
      write.apply(this, arguments);
    };
    next();
  }
}
