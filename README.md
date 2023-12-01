# @ableron/express

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

// default middleware (default settings, no logging)
app.use(createAbleronMiddleware());

// customized middleware (custom settings, custom logger)
app.use(
  createAbleronMiddleware(
    // optional config
    {
      fragmentRequestTimeoutMillis: 5000,
      fragmentRequestHeadersToPass: ['X-ACME-Test-Groups', 'X-Correlation-ID'],
      cacheVaryByRequestHeaders: ['X-ACME-Test-Groups'],
      statsAppendToContent: true
      // ...
    },
    // optional logger
    yourLogger() || console
  )
);
```

## Configuration

Configuration options see [@ableron/ableron](https://github.com/ableron/ableron-js#configuration)
