import { MovementTypePipe } from './transaction-type.pipe';

describe('MovementTypePipe', () => {
  it('create an instance', () => {
    const pipe = new MovementTypePipe();
    expect(pipe).toBeTruthy();
  });
});
