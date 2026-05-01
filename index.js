/**
 * @format
 */

import { AppRegistry } from 'react-native';
import TrackPlayer from 'react-native-track-player';
import App from './App';
import { name as appName } from './app.json';

TrackPlayer.registerPlaybackService(() => async () => {
  // Playback service - handles remote controls and background events
});

AppRegistry.registerComponent(appName, () => App);
