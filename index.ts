import 'reflect-metadata'; // Must be the very first import for Inversify
import { configure } from 'mobx';
import { registerRootComponent } from 'expo';
import App from './src/core/App';

// Configure MobX for React Native compatibility
configure({
  useProxies: 'never', // Required for Hermes/React Native
  enforceActions: 'never',
});

registerRootComponent(App);
