import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { SurahAudioBar } from '../components/SurahAudioBar';
import { getResumePosition, saveResumePosition } from '../resumeStore';
import { createMemoryKVStore, KVStore } from '@/src/lib/kvStore';

const mockPlayer = {
  play: jest.fn(),
  pause: jest.fn(),
  seekTo: jest.fn(),
  setActiveForLockScreen: jest.fn(),
  clearLockScreenControls: jest.fn(),
};

let mockStatus = {
  currentTime: 0,
  duration: 300,
  playing: false,
  isLoaded: true,
  isBuffering: false,
  didJustFinish: false,
};

jest.mock('expo-audio', () => ({
  useAudioPlayer: jest.fn(() => mockPlayer),
  useAudioPlayerStatus: jest.fn(() => mockStatus),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
}));

let mockSource: {
  baseUrl: string;
  reciterId: string;
  fileExt?: string;
  placeholder: boolean;
} | null = {
  baseUrl: 'https://audio.example.com',
  reciterId: 'dev',
  placeholder: true,
};

jest.mock('../config', () => ({
  getAudioSource: jest.fn(() => mockSource),
}));

let mockStore: KVStore = createMemoryKVStore();
jest.mock('@/src/features/settings/SettingsContext', () => ({
  useSettings: () => ({ store: mockStore }),
}));

describe('SurahAudioBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore = createMemoryKVStore();
    mockSource = { baseUrl: 'https://audio.example.com', reciterId: 'dev', placeholder: true };
    mockStatus = {
      currentTime: 0,
      duration: 300,
      playing: false,
      isLoaded: true,
      isBuffering: false,
      didJustFinish: false,
    };
  });

  it('renders nothing when no audio source is configured', async () => {
    mockSource = null;
    const { queryByTestId } = await render(<SurahAudioBar surah={2} title="Al-Baqarah" />);
    expect(queryByTestId('surah-audio-bar')).toBeNull();
  });

  it('shows the placeholder dev badge so tones are never mistaken for recitation', async () => {
    const { getByTestId } = await render(<SurahAudioBar surah={2} title="Al-Baqarah" />);
    expect(getByTestId('audio-dev-badge')).toBeTruthy();
  });

  it('starts playback with background audio mode and lock-screen metadata', async () => {
    const { getByTestId } = await render(<SurahAudioBar surah={2} title="Al-Baqarah" />);
    await fireEvent.press(getByTestId('surah-audio-toggle'));
    const audio = jest.requireMock('expo-audio');
    expect(audio.setAudioModeAsync).toHaveBeenCalledWith(
      expect.objectContaining({ playsInSilentMode: true, shouldPlayInBackground: true })
    );
    expect(mockPlayer.setActiveForLockScreen).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ title: 'Al-Baqarah' })
    );
    expect(mockPlayer.play).toHaveBeenCalled();
  });

  it('seeks to the saved resume position on first play', async () => {
    saveResumePosition(mockStore, 'dev', 2, 120);
    const { getByTestId } = await render(<SurahAudioBar surah={2} title="Al-Baqarah" />);
    await fireEvent.press(getByTestId('surah-audio-toggle'));
    expect(mockPlayer.seekTo).toHaveBeenCalledWith(120);
  });

  it('does not seek when the saved position is trivially small', async () => {
    saveResumePosition(mockStore, 'dev', 2, 3);
    const { getByTestId } = await render(<SurahAudioBar surah={2} title="Al-Baqarah" />);
    await fireEvent.press(getByTestId('surah-audio-toggle'));
    expect(mockPlayer.seekTo).not.toHaveBeenCalled();
  });

  it('pausing saves the resume position', async () => {
    mockStatus = { ...mockStatus, playing: true, currentTime: 87.3 };
    const { getByTestId } = await render(<SurahAudioBar surah={2} title="Al-Baqarah" />);
    await fireEvent.press(getByTestId('surah-audio-toggle'));
    expect(mockPlayer.pause).toHaveBeenCalled();
    expect(getResumePosition(mockStore, 'dev', 2)).toBeCloseTo(87.3);
  });

  it('finishing the surah clears the resume position', async () => {
    saveResumePosition(mockStore, 'dev', 2, 250);
    mockStatus = { ...mockStatus, didJustFinish: true };
    await render(<SurahAudioBar surah={2} title="Al-Baqarah" />);
    expect(getResumePosition(mockStore, 'dev', 2)).toBe(0);
  });
});
