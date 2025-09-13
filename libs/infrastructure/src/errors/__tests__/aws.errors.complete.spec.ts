import { 
  DatabaseConnectionError, 
  SNSError, 
  SQSError, 
  EventBridgeError 
} from '../aws.errors';

describe('AWS Errors - Complete Coverage', () => {
  describe('DatabaseConnectionError', () => {
    it('should create error with operation and original error', () => {
      const originalError = new Error('Connection timeout');
      const error = new DatabaseConnectionError('save', originalError);

      expect(error.message).toBe('Database save operation failed: Connection timeout');
      expect(error.name).toBe('DatabaseConnectionError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should handle different operation types', () => {
      const originalError = new Error('Query failed');
      
      const saveError = new DatabaseConnectionError('save', originalError);
      expect(saveError.message).toBe('Database save operation failed: Query failed');
      
      const findError = new DatabaseConnectionError('find', originalError);
      expect(findError.message).toBe('Database find operation failed: Query failed');
      
      const updateError = new DatabaseConnectionError('update', originalError);
      expect(updateError.message).toBe('Database update operation failed: Query failed');
      
      const deleteError = new DatabaseConnectionError('delete', originalError);
      expect(deleteError.message).toBe('Database delete operation failed: Query failed');
    });

    it('should handle original error without message', () => {
      const originalError = new Error();
      originalError.message = '';
      const error = new DatabaseConnectionError('connect', originalError);

      expect(error.message).toBe('Database connect operation failed: ');
      expect(error.name).toBe('DatabaseConnectionError');
    });

    it('should handle original error with undefined message', () => {
      const originalError = new Error();
      originalError.message = undefined as any;
      const error = new DatabaseConnectionError('query', originalError);

      expect(error.message).toBe('Database query operation failed: undefined');
      expect(error.name).toBe('DatabaseConnectionError');
    });

    it('should maintain error prototype chain', () => {
      const originalError = new Error('Test error');
      const error = new DatabaseConnectionError('test', originalError);

      expect(error instanceof Error).toBe(true);
      expect(error instanceof DatabaseConnectionError).toBe(true);
    });
  });

  describe('SNSError', () => {
    it('should create error with operation and original error', () => {
      const originalError = new Error('Topic not found');
      const error = new SNSError('publish', originalError);

      expect(error.message).toBe('SNS publish operation failed: Topic not found');
      expect(error.name).toBe('SNSError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should handle different operation types', () => {
      const originalError = new Error('Permission denied');
      
      const publishError = new SNSError('publish', originalError);
      expect(publishError.message).toBe('SNS publish operation failed: Permission denied');
      
      const subscribeError = new SNSError('subscribe', originalError);
      expect(subscribeError.message).toBe('SNS subscribe operation failed: Permission denied');
    });

    it('should handle null original error', () => {
      expect(() => {
        new SNSError('publish', null as any);
      }).toThrow(TypeError);
    });

    it('should handle original error with special characters', () => {
      const originalError = new Error('Error with "quotes" and \'apostrophes\' and @#$%');
      const error = new SNSError('publish', originalError);

      expect(error.message).toBe('SNS publish operation failed: Error with "quotes" and \'apostrophes\' and @#$%');
    });
  });

  describe('SQSError', () => {
    it('should create error with operation and original error', () => {
      const originalError = new Error('Queue does not exist');
      const error = new SQSError('sendMessage', originalError);

      expect(error.message).toBe('SQS sendMessage operation failed: Queue does not exist');
      expect(error.name).toBe('SQSError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should handle different operation types', () => {
      const originalError = new Error('Access denied');
      
      const sendError = new SQSError('sendMessage', originalError);
      expect(sendError.message).toBe('SQS sendMessage operation failed: Access denied');
      
      const receiveError = new SQSError('receiveMessage', originalError);
      expect(receiveError.message).toBe('SQS receiveMessage operation failed: Access denied');
      
      const deleteError = new SQSError('deleteMessage', originalError);
      expect(deleteError.message).toBe('SQS deleteMessage operation failed: Access denied');
    });

    it('should handle empty operation string', () => {
      const originalError = new Error('Unknown error');
      const error = new SQSError('', originalError);

      expect(error.message).toBe('SQS  operation failed: Unknown error');
      expect(error.name).toBe('SQSError');
    });

    it('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(1000);
      const originalError = new Error(longMessage);
      const error = new SQSError('sendMessage', originalError);

      expect(error.message).toBe(`SQS sendMessage operation failed: ${longMessage}`);
      expect(error.message.length).toBe(1034); // 34 prefix chars + 1000 message chars
    });
  });

  describe('EventBridgeError', () => {
    it('should create error with operation and original error', () => {
      const originalError = new Error('Event bus not found');
      const error = new EventBridgeError('putEvents', originalError);

      expect(error.message).toBe('EventBridge putEvents operation failed: Event bus not found');
      expect(error.name).toBe('EventBridgeError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should handle different operation types', () => {
      const originalError = new Error('Rate limit exceeded');
      
      const putError = new EventBridgeError('putEvents', originalError);
      expect(putError.message).toBe('EventBridge putEvents operation failed: Rate limit exceeded');
      
      const createError = new EventBridgeError('createRule', originalError);
      expect(createError.message).toBe('EventBridge createRule operation failed: Rate limit exceeded');
    });

    it('should handle numeric error codes in original error', () => {
      const originalError = new Error('Error 404: Not found');
      const error = new EventBridgeError('putEvents', originalError);

      expect(error.message).toBe('EventBridge putEvents operation failed: Error 404: Not found');
    });

    it('should handle multiline error messages', () => {
      const originalError = new Error('Line 1\nLine 2\nLine 3');
      const error = new EventBridgeError('putEvents', originalError);

      expect(error.message).toBe('EventBridge putEvents operation failed: Line 1\nLine 2\nLine 3');
    });
  });

  describe('Error inheritance and polymorphism', () => {
    it('should work with instanceof checks for all error types', () => {
      const dbError = new DatabaseConnectionError('save', new Error('DB error'));
      const snsError = new SNSError('publish', new Error('SNS error'));
      const sqsError = new SQSError('send', new Error('SQS error'));
      const eventBridgeError = new EventBridgeError('put', new Error('EventBridge error'));

      const errors = [dbError, snsError, sqsError, eventBridgeError];

      errors.forEach(error => {
        expect(error instanceof Error).toBe(true);
        expect(error.name).toBeDefined();
        expect(error.message).toBeDefined();
        expect(error.stack).toBeDefined();
      });
    });

    it('should have unique names for each error type', () => {
      const dbError = new DatabaseConnectionError('save', new Error('test'));
      const snsError = new SNSError('publish', new Error('test'));
      const sqsError = new SQSError('send', new Error('test'));
      const eventBridgeError = new EventBridgeError('put', new Error('test'));

      const names = [dbError.name, snsError.name, sqsError.name, eventBridgeError.name];
      const uniqueNames = [...new Set(names)];

      expect(names).toHaveLength(4);
      expect(uniqueNames).toHaveLength(4);
    });

    it('should be catchable as Error', () => {
      const errors = [
        () => { throw new DatabaseConnectionError('save', new Error('test')); },
        () => { throw new SNSError('publish', new Error('test')); },
        () => { throw new SQSError('send', new Error('test')); },
        () => { throw new EventBridgeError('put', new Error('test')); }
      ];

      errors.forEach(errorFn => {
        expect(errorFn).toThrow(Error);
      });
    });

    it('should maintain proper error stacks', () => {
      const originalError = new Error('Original error');
      const dbError = new DatabaseConnectionError('save', originalError);

      expect(dbError.stack).toBeDefined();
      expect(typeof dbError.stack).toBe('string');
      expect(dbError.stack!.includes('DatabaseConnectionError')).toBe(true);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle Error objects with custom properties', () => {
      const originalError = new Error('Custom error') as any;
      originalError.code = 'CUSTOM_CODE';
      originalError.statusCode = 500;

      const error = new DatabaseConnectionError('save', originalError);

      expect(error.message).toBe('Database save operation failed: Custom error');
      expect(error.name).toBe('DatabaseConnectionError');
    });

    it('should handle circular reference in original error', () => {
      const originalError = new Error('Circular error') as any;
      originalError.self = originalError;

      const error = new SNSError('publish', originalError);

      expect(error.message).toBe('SNS publish operation failed: Circular error');
      expect(error.name).toBe('SNSError');
    });

    it('should handle frozen Error objects', () => {
      const originalError = new Error('Frozen error');
      Object.freeze(originalError);

      const error = new SQSError('send', originalError);

      expect(error.message).toBe('SQS send operation failed: Frozen error');
      expect(error.name).toBe('SQSError');
    });
  });
});
