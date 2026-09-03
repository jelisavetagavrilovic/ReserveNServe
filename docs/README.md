# ReserveNServe Documentation

This directory contains the project-level documentation for ReserveNServe.

## Documentation map

| Document | Audience | Contents |
| --- | --- | --- |
| [User guide](user-guide.md) | End users, reviewers | Registration, restaurant discovery, booking, pre-ordering, payment, cancellation, refunds, account management and owner requests |
| [Setup and run guide](setup-and-run.md) | Developers, assessors | Prerequisites, environment variables, certificates, Docker Compose, local development, tests, Stripe and troubleshooting |
| [Architecture](architecture.md) | Developers, architects | Mermaid system diagram, service responsibilities, communication, events, data ownership, security and runtime flows |
| [API reference](api-reference.md) | Frontend and backend developers | REST endpoint inventory, authorization requirements and gRPC operations |
| [Class diagrams](class-diagrams.md) | Developers, assessors | A class diagram for every backend subsystem and the frontend |

## Subsystem documentation

- [Identity service](../backend/ReserveNServeBackend/Services/Identity/README.md)
- [Restaurants service](../backend/ReserveNServeBackend/Services/Restaurants/README.md)
- [Reservations service](../backend/ReserveNServeBackend/Services/Reservations/README.md)
- [Payment service](../backend/ReserveNServeBackend/Services/Payment/README.md)
- [Notifications service](../backend/ReserveNServeBackend/Services/Notifications/README.md)
- [Frontend](../frontend/README.md)
