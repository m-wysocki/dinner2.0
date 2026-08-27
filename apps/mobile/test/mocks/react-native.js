'use strict';

const { createElement, forwardRef } = require('react');

function host(name) {
  const Host = forwardRef(function Host(props, ref) {
    return createElement(name, { ...props, ref });
  });
  Host.displayName = name;
  return Host;
}

const ActivityIndicator = host('ActivityIndicator');
const Image = host('Image');
const KeyboardAvoidingView = host('KeyboardAvoidingView');
const Pressable = host('Pressable');
const SafeAreaView = host('SafeAreaView');
const ScrollView = host('ScrollView');
const Text = host('Text');
const TextInput = host('TextInput');
const View = host('View');

const StyleSheet = {
  create(styles) {
    return styles;
  },
  flatten(style) {
    if (Array.isArray(style)) {
      return Object.assign({}, ...style.filter(Boolean));
    }
    return style ?? {};
  },
};

const Platform = {
  OS: 'ios',
  select(values) {
    return values.ios ?? values.default;
  },
};

module.exports = {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
};

module.exports.default = module.exports;
