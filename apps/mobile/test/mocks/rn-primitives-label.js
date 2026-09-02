import * as React from 'react';

// Metro-only dist workaround: @rn-primitives/* publish untranspiled JSX in
// every dist file (index.js and index.mjs), which Node/vitest cannot parse.
// Metro transpiles node_modules, so the app runtime is unaffected - only the
// test environment needs this importable stand-in (see rn-primitives-slot.js).
//
// The label primitive composes Root (a pressable wrapper) around Text; the
// screens under test label inputs through accessibilityLabel/placeholder, so
// plain DOM stand-ins are sufficient and keep getByText working on the text.

function Root({ children, ...rest }) {
  return React.createElement('div', rest, children);
}

function Text({ children, ...rest }) {
  return React.createElement('div', rest, children);
}

export { Root, Text };
