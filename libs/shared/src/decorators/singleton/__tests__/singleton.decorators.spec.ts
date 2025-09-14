import { 
  Singleton, 
  clearSingletonInstances, 
  hasSingletonInstance, 
  getSingletonInstance 
} from '../singleton.decorators';

@Singleton
class TestSingletonClass {
  constructor(public name: string, public value: number = 0) {}

  public increment(): void {
    this.value++;
  }
}

@Singleton
class TestAnotherSingletonClass {
  constructor(public id: string) {}
}

class TestRegularClass {
  constructor(public name: string) {}
}

describe('Singleton Decorator', () => {
  beforeEach(() => {
    // Clear singleton instances before each test
    clearSingletonInstances();
  });

  describe('Basic Singleton Behavior', () => {
    it('should return the same instance when creating multiple objects', () => {
      const first = new TestSingletonClass('first', 1);
      const second = new TestSingletonClass('second', 2);
      
      expect(first).toBe(second);
      expect(first.name).toBe('first');
      expect(first.value).toBe(1);
      expect(second.name).toBe('first');
      expect(second.value).toBe(1);
    });

    it('should maintain state across different instantiations', () => {
      const first = new TestSingletonClass('test', 0);
      first.increment();
      
      const second = new TestSingletonClass('another', 100);
      
      expect(first).toBe(second);
      expect(second.value).toBe(1); // Should be 1, not 100
      expect(second.name).toBe('test'); // Should be 'test', not 'another'
    });

    it('should work with different singleton classes independently', () => {
      const singletonA1 = new TestSingletonClass('classA', 10);
      const singletonB1 = new TestAnotherSingletonClass('classB');
      
      const singletonA2 = new TestSingletonClass('ignored', 999);
      const singletonB2 = new TestAnotherSingletonClass('ignored');
      
      expect(singletonA1).toBe(singletonA2);
      expect(singletonB1).toBe(singletonB2);
      expect(singletonA1).not.toBe(singletonB1);
      
      expect(singletonA2.name).toBe('classA');
      expect(singletonB2.id).toBe('classB');
    });

    it('should preserve class name and prototype', () => {
      const instance = new TestSingletonClass('test');
      
      expect(instance.constructor.name).toBe('TestSingletonClass');
      expect(instance instanceof TestSingletonClass).toBe(true);
      expect(typeof instance.increment).toBe('function');
    });
  });

  describe('Utility Functions', () => {
    it('should correctly detect singleton instances', () => {
      expect(hasSingletonInstance(TestSingletonClass)).toBe(false);
      
      new TestSingletonClass('test');
      
      expect(hasSingletonInstance(TestSingletonClass)).toBe(true);
      expect(hasSingletonInstance(TestAnotherSingletonClass)).toBe(false);
    });

    it('should return singleton instance without creating new one', () => {
      expect(getSingletonInstance(TestSingletonClass)).toBeUndefined();
      
      const created = new TestSingletonClass('test', 42);
      const retrieved = getSingletonInstance(TestSingletonClass);
      
      expect(retrieved).toBe(created);
      expect(retrieved?.name).toBe('test');
      expect(retrieved?.value).toBe(42);
    });

    it('should clear singleton instances', () => {
      new TestSingletonClass('test');
      new TestAnotherSingletonClass('test');
      
      expect(hasSingletonInstance(TestSingletonClass)).toBe(true);
      expect(hasSingletonInstance(TestAnotherSingletonClass)).toBe(true);
      
      clearSingletonInstances();
      
      expect(hasSingletonInstance(TestSingletonClass)).toBe(false);
      expect(hasSingletonInstance(TestAnotherSingletonClass)).toBe(false);
    });
  });

  describe('Comparison with Regular Classes', () => {
    it('should behave differently from regular classes', () => {
      const regular1 = new TestRegularClass('first');
      const regular2 = new TestRegularClass('second');
      
      expect(regular1).not.toBe(regular2);
      expect(regular1.name).toBe('first');
      expect(regular2.name).toBe('second');
    });
  });

  describe('Edge Cases', () => {
    it('should handle classes with no parameters', () => {
      @Singleton
      class NoParamsClass {
        public value = Math.random();
      }
      
      const first = new NoParamsClass();
      const second = new NoParamsClass();
      
      expect(first).toBe(second);
      expect(first.value).toBe(second.value);
    });

    it('should handle classes with complex parameters', () => {
      @Singleton
      class ComplexClass {
        constructor(
          public config: { name: string; options: string[] },
          public callback: () => void
        ) {}
      }
      
      const mockCallback = jest.fn();
      const config = { name: 'test', options: ['a', 'b'] };
      
      const first = new ComplexClass(config, mockCallback);
      const second = new ComplexClass({ name: 'ignored', options: [] }, jest.fn());
      
      expect(first).toBe(second);
      expect(second.config).toBe(config);
      expect(second.callback).toBe(mockCallback);
    });
  });
});
