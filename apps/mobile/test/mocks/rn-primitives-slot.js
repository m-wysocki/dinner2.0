import * as React from 'react';

// Metro-only dist workaround: @rn-primitives/* publish untranspiled JSX in
// every dist file (index.js and index.mjs), which Node/vitest cannot parse.
// Metro transpiles node_modules, so the app runtime is unaffected - only the
// test environment needs this importable stand-in.
//
// Current design-system usage renders Slot only through `asChild`, which the
// reusables components never enable on the covered screens, so a thin
// cloneElement shim is sufficient. If a future test exercises asChild
// behaviour, keep this shim honest: it must merge its props onto the child.

function Slot(props) {
  const { children, ...rest } = props;
  if (!React.isValidElement(children)) {
    return null;
  }
  return React.cloneElement(children, rest);
}
Slot.displayName = 'Slot';

export const Pressable = Slot;
export const View = Slot;
export const Text = Slot;
export const Image = Slot;

export function isTextChildren(children) {
  return typeof children === 'string' || typeof children === 'number';
}

export { Slot };
