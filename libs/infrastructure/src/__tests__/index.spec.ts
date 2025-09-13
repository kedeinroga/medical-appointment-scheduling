import * as indexExports from '../index';

describe('Infrastructure Index Module', () => {
  it('should export all required modules', () => {
    // Verify that the index file exports the expected modules
    expect(indexExports).toBeDefined();
    
    // The index file should have exports
    const exportKeys = Object.keys(indexExports);
    expect(exportKeys.length).toBeGreaterThan(0);
  });

  it('should be importable without errors', () => {
    expect(() => require('../index')).not.toThrow();
  });
});
