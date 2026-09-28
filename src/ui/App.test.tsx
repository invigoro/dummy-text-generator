// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';

afterEach(cleanup);

describe('App', () => {
  it('shows the site name', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Dummy Text Generator' })).toBeInTheDocument();
  });
});
