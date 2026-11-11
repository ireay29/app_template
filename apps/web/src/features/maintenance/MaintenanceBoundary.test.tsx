import { cleanup, render, screen } from '@testing-library/react';
import { useContext } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MaintenanceModeContext } from './maintenance-context';
import { MaintenanceBoundary } from './MaintenanceBoundary';
import { type MaintenanceStatus, useMaintenanceQuery } from './queries';

vi.mock('./queries', () => ({ useMaintenanceQuery: vi.fn() }));

const maintenance: MaintenanceStatus = {
  mode: 'read-only',
  message: '設備更新のため一部の操作を停止しています。',
  endsAt: '2026-11-01T06:00:00Z',
  infoUrl: 'https://status.example.com/',
  retryAfterSeconds: 3600,
};

function setStatus(data?: MaintenanceStatus) {
  vi.mocked(useMaintenanceQuery).mockReturnValue({ data } as ReturnType<
    typeof useMaintenanceQuery
  >);
}

function Content() {
  const mode = useContext(MaintenanceModeContext);
  return <button disabled={mode !== 'off'}>更新操作</button>;
}

describe('MaintenanceBoundary', () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(cleanup);

  it('keeps public content accessible while status is loading or unavailable', () => {
    setStatus();
    render(
      <MaintenanceBoundary>
        <Content />
      </MaintenanceBoundary>,
    );
    expect(screen.getByRole('button', { name: '更新操作' })).toBeEnabled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows a notice and restricts actions while preserving content', () => {
    setStatus(maintenance);
    render(
      <MaintenanceBoundary>
        <Content />
      </MaintenanceBoundary>,
    );
    expect(screen.getByRole('status')).toHaveAttribute('data-nosnippet');
    expect(screen.getByText(maintenance.message)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '状況・お問い合わせ' })).toHaveAttribute(
      'href',
      maintenance.infoUrl,
    );
    expect(screen.getByRole('button', { name: '更新操作' })).toBeDisabled();
    expect(document.querySelector('time')).toHaveAttribute('datetime', maintenance.endsAt);
  });

  it('shows only the maintenance notice during a full stop', () => {
    setStatus({ ...maintenance, mode: 'full', endsAt: null, infoUrl: null });
    render(
      <MaintenanceBoundary>
        <Content />
      </MaintenanceBoundary>,
    );
    expect(screen.getByRole('heading', { name: 'メンテナンスのお知らせ' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText(/復旧予定は確認中/)).toBeInTheDocument();
  });

  it('restores normal content and actions after the mode switches off', () => {
    setStatus(maintenance);
    const view = render(
      <MaintenanceBoundary>
        <Content />
      </MaintenanceBoundary>,
    );
    setStatus({ ...maintenance, mode: 'off' });
    view.rerender(
      <MaintenanceBoundary>
        <Content />
      </MaintenanceBoundary>,
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).toBeEnabled();
  });
});
