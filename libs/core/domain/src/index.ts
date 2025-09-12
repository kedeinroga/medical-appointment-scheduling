// Core domain layer exports
// This file serves as the main entry point for the domain layer

// Constants
export * from './constants/appointment.constants';

// Entities
export * from './entities/appointment.entity';
export * from './entities/insured.entity';
export * from './entities/schedule.entity';

// Value Objects
export * from './value-objects/appointment-id.vo';
export * from './value-objects/appointment-status.vo';
export * from './value-objects/country-iso.vo';
export * from './value-objects/insured-id.vo';

// Events
export * from './events/appointment-completed.event';
export * from './events/appointment-created.event';
export * from './events/appointment-processed.event';
export * from './events/domain.event';

// Services
export * from './services/appointment-domain.service';

// Repository Interfaces
export * from './repositories/appointment.repository';
export * from './repositories/schedule.repository';

// Ports
export * from './ports/event-bus.port';

// Errors
export * from './errors/appointment.errors';

export const DOMAIN_LAYER_VERSION = '1.0.0';
