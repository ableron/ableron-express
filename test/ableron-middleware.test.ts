import { describe, expect, it } from 'vitest';
import express from 'express';
import type { Request, Response } from 'express';
import ableron from '../src';
import request from 'supertest';

describe('Ableron Express Middleware', () => {
  it.each([
    [
      'body set via multiple res.write with content type set before first res.write',
      (res: Response) => {
        res
          .status(200)
          .setHeader('Content-Type', 'text/html; charset=utf-8')
          .write('<ableron-include src="unknown">fallback');
        res.write('</ableron-include>');
        res.end();
      }
    ],
    [
      'body set via multiple res.write with content type set after first res.write',
      (res: Response) => {
        res.write('<ableron-include src="unknown">');
        res.write('fallback');
        res.write('</ableron-include>');
        res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').end();
      }
    ],
    [
      'body set via res.end',
      (res: Response) =>
        res
          .status(200)
          .setHeader('Content-Type', 'text/html; charset=utf-8')
          .end('<ableron-include src="unknown">fallback</ableron-include>')
    ],
    [
      'body set via res.send',
      (res: Response) =>
        res
          .status(200)
          .setHeader('Content-Type', 'text/html; charset=utf-8')
          .send('<ableron-include src="unknown">fallback</ableron-include>')
    ],
    [
      'body set via res.send with content-type header set implicitly',
      (res: Response) => res.status(200).send('<ableron-include src="unknown">fallback</ableron-include>')
    ],
    [
      'mixed res.write with string and buffer',
      (res: Response) => {
        res.write('<ableron-include src="unknown">');
        res.write(Buffer.from('fallback'));
        res.write('</ableron-include>');
        res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').end();
      }
    ],
    [
      'mixed res.write with string and buffer and given encoding',
      (res: Response) => {
        res.write(Buffer.from('<ableron-include src="unknown">'), 'binary');
        res.write('ZmFsbGJhY2s=', 'base64');
        res.write(Buffer.from('PC9hYmxlcm9uLWluY2x1ZGU+', 'base64'));
        res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').end();
      }
    ],
    [
      'mixed res.write with string and buffer and given callbacks',
      (res: Response) => {
        res.write(Buffer.from('<ableron-include src="unknown">'), () => null);
        res.write('fallback', () => null);
        res.write(Buffer.from('PC9hYmxlcm9uLWluY2x1ZGU+', 'base64'), () => null);
        res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').end();
      }
    ],
    [
      'res.write called with invalid encoding',
      (res: Response) => {
        res.write('<ableron-include src="unknown">', 'utf8');
        // @ts-ignore
        res.write('fallback', 'unknown');
        res.write('</ableron-include>', 'latin1');
        res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').end();
      }
    ],
    [
      'res.end with callback',
      (res: Response) => {
        res.write('<ableron-include src="unknown">fallback</ableron-include>');
        res
          .status(200)
          .setHeader('Content-Type', 'text/html; charset=utf-8')
          .end(() => null);
      }
    ],
    [
      'res.end with buffer chunk and callback',
      (res: Response) => {
        res
          .status(200)
          .setHeader('Content-Type', 'text/html; charset=utf-8')
          .end(Buffer.from('<ableron-include src="unknown">fallback</ableron-include>'), () => undefined);
      }
    ],
    [
      'res.end with string chunk and callback',
      (res: Response) => {
        res
          .status(200)
          .setHeader('Content-Type', 'text/html; charset=utf-8')
          .end('<ableron-include src="unknown">fallback</ableron-include>', () => undefined);
      }
    ],
    [
      'res.end with string chunk, encoding and callback',
      (res: Response) => {
        res
          .status(200)
          .setHeader('Content-Type', 'text/html; charset=utf-8')
          .end(
            'PGFibGVyb24taW5jbHVkZSBzcmM9InVua25vd24iPmZhbGxiYWNrPC9hYmxlcm9uLWluY2x1ZGU+',
            'base64',
            () => undefined
          );
      }
    ]
  ])('should handle %s', async (caseDescription: string, generateResponse) => {
    // given
    const server = express()
      .use(ableron())
      .get('/', (req: Request, res: Response) => generateResponse(res));

    // when
    const response = await request(server).get('/');

    // then
    expect(response.headers['content-type']).toBe('text/html; charset=utf-8');
    expect(response.headers['content-length']).toBe(String('fallback'.length));
    expect(response.status).toEqual(200);
    expect(response.text).toEqual('fallback');
  });

  it('should apply transclusion', async () => {
    // given
    const server = express()
      .use(ableron())
      .get('/', (req: Request, res: Response) => {
        res.status(200).send(`<ableron-include src="${getFragmentBaseUrl(req)}/fragment">fallback</ableron-include>`);
      })
      .get('/fragment', (req: Request, res: Response) => {
        res.status(200).send('fragment');
      });

    // when
    const response = await request(server).get('/');

    // then
    expect(response.headers['content-type']).toBe('text/html; charset=utf-8');
    expect(response.headers['content-length']).toBe(String('fragment'.length));
    expect(response.status).toEqual(200);
    expect(response.text).toEqual('fragment');
  });

  it('should pass request headers to resolveIncludes()', async () => {
    // given
    const server = express()
      .use(ableron())
      .get('/', (req: Request, res: Response) => {
        res.status(200).send(`<ableron-include src="${getFragmentBaseUrl(req)}/fragment">fallback</ableron-include>`);
      })
      .get('/fragment', (req: Request, res: Response) => {
        res.status(200).send(req.headers['user-agent']);
      });

    // when
    const response = await request(server).get('/').set('User-Agent', 'test');

    // then
    expect(response.text).toEqual('test');
  });

  it('should check content-type text/html case insensitive', async () => {
    // given
    const server = express()
      .use(ableron())
      .get('/', (req: Request, res: Response) => {
        res
          .status(200)
          .setHeader('content-type', 'TEXT/HTML')
          .end(`<ableron-include src="${getFragmentBaseUrl(req)}/fragment">fallback</ableron-include>`);
      })
      .get('/fragment', (req: Request, res: Response) => {
        res.status(200).send('fragment');
      });

    // when
    const response = await request(server).get('/');

    // then
    expect(response.headers['content-type']).toBe('TEXT/HTML');
    expect(response.headers['content-length']).toBe(String('fragment'.length));
    expect(response.status).toEqual(200);
    expect(response.text).toEqual('fragment');
  });

  it('should skip transclusion when content-type is not text/html', async () => {
    // given
    const originalBody = `<ableron-include id="test">fallback</ableron-include>`;
    const server = express()
      .use(ableron())
      .get('/', (req: Request, res: Response) => {
        res.status(200).setHeader('content-type', 'text/plain').send(originalBody);
      });

    // when
    const response = await request(server).get('/');

    // then
    expect(response.headers['content-type']).toBe('text/plain; charset=utf-8');
    expect(response.headers['content-length']).toBe(String(originalBody.length));
    expect(response.status).toEqual(200);
    expect(response.text).toEqual(originalBody);
  });

  it('should skip transclusion when status code is 3xx', async () => {
    // given
    const originalBody = `<ableron-include id="test">fallback</ableron-include>`;
    const server = express()
      .use(ableron())
      .get('/', (req: Request, res: Response) => {
        res.status(301).send(originalBody);
      });

    // when
    const response = await request(server).get('/');

    // then
    expect(response.headers['content-type']).toBe('text/html; charset=utf-8');
    expect(response.headers['content-length']).toBe(String(originalBody.length));
    expect(response.status).toEqual(301);
    expect(response.text).toEqual(originalBody);
  });

  it('should skip transclusion when content type is set after first write to other than text/html', async () => {
    // given
    const originalBody = `<ableron-include id="test">fallback</ableron-include>`;
    const server = express()
      .use(ableron())
      .get('/', (req: Request, res: Response) => {
        res.write(originalBody);
        res.setHeader('content-type', 'text/plain').send();
      });

    // when
    const response = await request(server).get('/');

    // then
    expect(response.headers['content-type']).toBe('text/plain');
    expect(response.headers['content-length']).toBe(String(originalBody.length));
    expect(response.status).toEqual(200);
    expect(response.text).toEqual(originalBody);
  });

  it('should handle multibyte characters', async () => {
    // given
    const server = express()
      .use(ableron())
      .get('/', (req: Request, res: Response) => {
        res.write(Buffer.from([0xe2]));
        res.write(Buffer.from([0x98]));
        res.write(Buffer.from([0xba]));
        res.setHeader('content-type', 'text/html; charset=utf-8').end();
      });

    // when
    const response = await request(server).get('/');

    // then
    expect(response.headers['content-type']).toBe('text/html; charset=utf-8');
    expect(response.headers['content-length']).toBe('3');
    expect(response.status).toEqual(200);
    expect(response.text).toEqual('☺');
  });

  it('should handle res.write calls correctly when not intercepting the response - callback as 2nd argument', async () => {
    // given
    const server = express()
      .use(ableron())
      .get('/', (req: Request, res: Response) => {
        res.setHeader('content-type', 'text/plain');
        res.write('callback', () => {
          res.write(' called correctly');
          res.end();
        });
      });

    // when
    const response = await request(server).get('/');

    // then
    expect(response.headers['content-type']).toBe('text/plain');
    expect(response.status).toEqual(200);
    expect(response.text).toEqual('callback called correctly');
  });

  it('should handle res.write calls correctly when not intercepting the response - callback as 3rd argument', async () => {
    // given
    const server = express()
      .use(ableron())
      .get('/', (req: Request, res: Response) => {
        res.setHeader('content-type', 'text/plain');
        res.write('callback', 'utf8', () => {
          res.write(' called correctly');
          res.end();
        });
      });

    // when
    const response = await request(server).get('/');

    // then
    expect(response.headers['content-type']).toBe('text/plain');
    expect(response.status).toEqual(200);
    expect(response.text).toEqual('callback called correctly');
  });

  function getFragmentBaseUrl(req: Request): string {
    return req.protocol + '://' + req.get('host');
  }
});
