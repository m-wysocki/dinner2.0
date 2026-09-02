import * as React from 'react';

// Metro-only dist workaround: @rn-primitives/* publish untranspiled JSX in
// every dist file (index.js and index.mjs), which Node/vitest cannot parse.
// Metro transpiles node_modules, so the app runtime is unaffected - only the
// test environment needs this importable stand-in.
//
// The reusables Separator renders a simple divider; Root maps to a plain div
// carrying the merged className (the CSS is processed by nativewind's test
// preset, not by this stub).

function Root(props) {
  const { className, style, ...rest } = props;
  return React.createElement('div', { className, style, ...rest });
}

Root.displayName = 'SeparatorRoot';

export { Root as Separator, Root };
