/**
 * @format
 */

import { AppRegistry } from 'react-native';
import TrackPlayer, { Event } from 'react-native-track-player';
import App from '@/App';
import { name as appName } from '../app.json';
import { checkExpiry } from '@/services/SleepTimer';

TrackPlayer.registerPlaybackService(() => async () => {
  TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, () => {
    checkExpiry();
  });
});

AppRegistry.registerComponent(appName, () => App);
