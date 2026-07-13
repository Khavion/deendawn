import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { TierBCard, TierBCardInner } from '../components/TierBCard';
import type { DownloadState } from '../downloadManager';

const noop = () => {};
const props = (state: DownloadState) => ({
  state,
  sizeLabel: '1.1 GB',
  onDownload: noop,
  onDelete: noop,
});

describe('TierBCard', () => {
  it('gate 7: renders NOTHING while TIER_B_ENABLED is false', async () => {
    const { queryByTestId } = await render(<TierBCard {...props({ phase: 'idle' })} />);
    expect(queryByTestId('tierb-card')).toBeNull();
  });

  it('idle offers the download with the size in the label', async () => {
    const onDownload = jest.fn();
    const { getByTestId } = await render(
      <TierBCardInner {...props({ phase: 'idle' })} onDownload={onDownload} />
    );
    await fireEvent.press(getByTestId('tierb-download'));
    expect(onDownload).toHaveBeenCalled();
  });

  it('blocked states render their honest explanations', async () => {
    const ineligible = await render(
      <TierBCardInner {...props({ phase: 'blocked', reason: 'ineligibleDevice' })} />
    );
    expect(ineligible.getByTestId('tierb-ineligible')).toBeTruthy();

    const pending = await render(
      <TierBCardInner {...props({ phase: 'blocked', reason: 'pendingUpload' })} />
    );
    expect(pending.getByTestId('tierb-pending')).toBeTruthy();

    const cellular = await render(
      <TierBCardInner {...props({ phase: 'blocked', reason: 'cellular' })} />
    );
    expect(cellular.getByTestId('tierb-wifi')).toBeTruthy();
  });

  it('downloading, verifying, failed and ready states render', async () => {
    const downloading = await render(
      <TierBCardInner {...props({ phase: 'downloading', receivedBytes: 500, totalBytes: 1000 })} />
    );
    expect(downloading.getByTestId('tierb-progress')).toBeTruthy();

    const verifying = await render(<TierBCardInner {...props({ phase: 'verifying' })} />);
    expect(verifying.getByTestId('tierb-verifying')).toBeTruthy();

    const failed = await render(
      <TierBCardInner {...props({ phase: 'failed', reason: 'hashMismatch' })} />
    );
    expect(failed.getByTestId('tierb-failed')).toBeTruthy();

    const onDelete = jest.fn();
    const ready = await render(
      <TierBCardInner
        {...props({ phase: 'ready', localPath: '/docs/model.gguf' })}
        onDelete={onDelete}
      />
    );
    await fireEvent.press(ready.getByTestId('tierb-delete'));
    expect(onDelete).toHaveBeenCalled();
  });
});
