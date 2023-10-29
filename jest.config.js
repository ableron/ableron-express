module.exports = {
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
