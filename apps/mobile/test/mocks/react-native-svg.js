// react-native-svg resolves to React Native's Flow source outside Metro, which
// Node cannot parse; lucide-react-native only needs the shape components to be
// renderable elements, so map them to their tag names.
const shapes = [
  'Circle',
  'ClipPath',
  'Defs',
  'Ellipse',
  'ForeignObject',
  'G',
  'Image',
  'Line',
  'LinearGradient',
  'Marker',
  'Mask',
  'Path',
  'Pattern',
  'Polygon',
  'Polyline',
  'RadialGradient',
  'Rect',
  'Stop',
  'Svg',
  'Symbol',
  'Text',
  'TextPath',
  'TSpan',
  'Use',
];

const registry = Object.fromEntries(
  shapes.map((name) => [name, name.toLowerCase()]),
);

export const {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  ForeignObject,
  G,
  Image,
  Line,
  LinearGradient,
  Marker,
  Mask,
  Path,
  Pattern,
  Polygon,
  Polyline,
  RadialGradient,
  Rect,
  Stop,
  Svg,
  Symbol,
  Text,
  TextPath,
  TSpan,
  Use,
} = registry;

export default registry;
