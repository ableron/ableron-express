# Ableron JavaScript Library

[![Build Status](https://github.com/ableron/ableron-express/actions/workflows/test.yml/badge.svg)](https://github.com/ableron/ableron-express/actions/workflows/test.yml)
[![npm version](https://badge.fury.io/js/@ableron%2Fexpress.svg)](https://badge.fury.io/js/@ableron%2Fexpress)
[![Node.js Version](https://img.shields.io/badge/Node.js-19+-4EB1BA.svg)](https://nodejs.org/docs/latest-v19.x/api/)

Express Middleware for Ableron Server Side UI Composition

## Installation

```shell
npm i @ableron/express
```

## Usage

```js
import express from 'express';
import { createAbleronMiddleware } from '@ableron/express';

const app = express();
app.use(createAbleronMiddleware({}, console));
```

## Configuration Options

```ts
import { createAbleronMiddleware } from '@ableron/express';
createAbleronMiddleware({
  // apply your configuration here
});
```

- `enabled`: Whether UI composition is enabled. Defaults to `true`
- `fragmentRequestTimeout`: Timeout for requesting fragments. Defaults to `3 seconds`
- `fragmentRequestHeadersToPass`: Request headers that are passed to fragment requests if present. Defaults to:
  - `Accept-Language`
  - `Correlation-ID`
  - `Forwarded`
  - `Referer`
  - `User-Agent`
  - `X-Correlation-ID`
  - `X-Forwarded-For`
  - `X-Forwarded-Proto`
  - `X-Forwarded-Host`
  - `X-Real-IP`
  - `X-Request-ID`
- `primaryFragmentResponseHeadersToPass`: Response headers of primary fragments to pass to the page response if present. Defaults to:
  - `Content-Language`
  - `Location`
  - `Refresh`
- `statsAppendToContent`: Whether to append UI composition stats as HTML comment to the content. Defaults to `false`
