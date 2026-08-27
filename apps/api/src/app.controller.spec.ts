import { describe, expect, it } from 'vitest';
import { AppController } from './app.controller';

describe('AppController', () => {
  it('reports API health', () => {
    expect(new AppController().health()).toEqual({
      status: 'ok',
      service: 'api',
    });
  });
});
