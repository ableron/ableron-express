# Ableron Express Middleware

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

Configuration options see [ableron-js](https://github.com/ableron/ableron-js#configuration-options)
