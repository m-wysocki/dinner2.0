import Module from 'node:module';
import path from 'node:path';

// @testing-library/react-native loads as a CommonJS module that natively
// requires 'react-native'. Node's resolution bypasses Vite's alias, so redirect
// the bare 'react-native' specifier to the test mock (the real package is
// Flow-typed and cannot run in Node). Subpath imports like
// 'react-native/package.json' are left untouched.
const reactNativeMockPath = path.resolve(__dirname, 'mocks/react-native.js');

type ResolveFilename = (
  request: string,
  parent: NodeModule | undefined,
  isMain: boolean,
  options?: { paths?: string[] },
) => string;

const ModuleInternal = Module as unknown as {
  _resolveFilename: ResolveFilename;
};

const originalResolveFilename = ModuleInternal._resolveFilename;

ModuleInternal._resolveFilename = function (
  this: unknown,
  request: string,
  parent: NodeModule | undefined,
  isMain: boolean,
  options?: { paths?: string[] },
) {
  if (request === 'react-native') {
    return originalResolveFilename.call(
      this,
      reactNativeMockPath,
      parent,
      isMain,
      options,
    );
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};
