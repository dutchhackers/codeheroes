# @codeheroes/common

Core library for Code Heroes platform providing shared functionality across services.

## Overview

This library contains:
- Activity tracking system
- Event processing
- Gamification engine
- User management
- Core utilities

## Modules

### Activity (`/activity`)
Handles user activity tracking and processing:
- Activity creation and updates
- Activity type classification
- Metrics calculation

### Event (`/event`)
Manages webhook events from Git providers:
- Event validation
- Event type mapping
- Event processing pipeline

### Gamification (`/gamification`)
Core gamification engine:
- XP calculation
- Level progression
- Achievement tracking
- Activity rewards

### Core (`/core`)
Shared utilities and base implementations:
- Firebase configuration
- Database services
- Common interfaces
- Shared models

### User (`/user`)
User management and