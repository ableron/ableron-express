import express from 'express';
import type { Request, Response } from 'express';
import { AbleronConfig } from 'ableron';
import { createAbleronMiddleware } from '../index';
const request = require('supertest');

describe('Ableron Express Middleware', () => {
  const ableronMiddleware = createAbleronMiddleware(new AbleronConfig(), console);

  it.each([
    [
      'body set via multiple res.write',
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
    ]
  ])('should handle %s', async (caseDescription: string, generateResponse) => {
    // given
    const server = express()
      .use(ableronMiddleware)
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
      .use(ableronMiddleware)
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

  it('should check content-type text/html case insensitive', async () => {
    // given
    const server = express()
      .use(ableronMiddleware)
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

  it('should skip transclusion when content-type ist not text/html', async () => {
    // given
    let originalBody = '';
    const server = express()
      .use(ableronMiddleware)
      .get('/', (req: Request, res: Response) => {
        originalBody = `<ableron-include src="${getFragmentBaseUrl(req)}/fragment">fallback</ableron-include>`;
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
    let originalBody = '';
    const server = express()
      .use(ableronMiddleware)
      .get('/', (req: Request, res: Response) => {
        originalBody = `<ableron-include src="${getFragmentBaseUrl(req)}/fragment">fallback</ableron-include>`;
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

  function getFragmentBaseUrl(req: Request): string {
    return req.protocol + '://' + req.get('host');
  }
});
