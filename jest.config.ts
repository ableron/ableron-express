import type { Config } from 'jest';

const config: Config = {
  roots: ['<rootDir>/test'],
  transform: {
    '\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json'
      }
    ]
  }
};

export default config;
