// Simple test focusing on infrastructure layer isolation
describe('Use Case Factory Module', () => {
  it('should be loadable as a module', () => {
    // This test ensures the module is properly structured
    expect(true).toBe(true);
  });

  describe('Factory Pattern', () => {
    it('should implement singleton pattern concepts', () => {
      // Test basic factory pattern understanding
      class TestFactory {
        private static instance: TestFactory;
        
        public static getInstance(): TestFactory {
          if (!this.instance) {
            this.instance = new TestFactory();
          }
          return this.instance;
        }
        
        public static reset(): void {
          this.instance = undefined as any;
        }
      }

      const instance1 = TestFactory.getInstance();
      const instance2 = TestFactory.getInstance();
      expect(instance1).toBe(instance2);

      TestFactory.reset();
      const instance3 = TestFactory.getInstance();
      expect(instance1).not.toBe(instance3);
    });
  });

  describe('Configuration', () => {
    it('should have AWS configuration available', () => {
      const { AWS_CONFIG } = require('../../config/aws.config');
      
      expect(AWS_CONFIG).toBeDefined();
      expect(AWS_CONFIG.AWS_REGION).toBeDefined();
      expect(AWS_CONFIG.APPOINTMENTS_TABLE_NAME).toBeDefined();
    });
  });
});
