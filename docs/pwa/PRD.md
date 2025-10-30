# Product Requirements Document (PRD)
## AbsurderSQL PWA - Browser-Based SQLite Admin Tool (Adminer Replacement)

**Version:** 2.0  
**Last Updated:** October 29, 2025  
**Status:** Active Development  
**Target Framework:** Next.js 15 + React 19

---

## Project Overview

Build a browser-based SQLite database administration tool that eliminates the need for server setup, PHP, or Docker. This is a modern replacement for Adminer/phpMyAdmin that runs entirely in the browser using WASM.

### Product Vision

**Problem:** DevOps, database admins, and technical teams need lightweight database UI without Docker/PHP/server setup. Adminer is stuck serving the 2000s tech stack.

**Solution:** Browser-based SQLite admin tool - upload .db file → query instantly → no server needed.

### Project Goals

1. **Zero Server Setup** - No PHP, Docker, or backend required - just open browser
2. **Instant Database Access** - Drag-and-drop .db files for immediate querying
3. **Full Admin Capabilities** - Schema inspection, query execution, data export
4. **Data Portability** - Import/export .db files, export results to CSV/JSON/Parquet
5. **Production Ready** - Built-in error handling, performance optimization, offline-first

---

## User Stories

### Primary Users: Database Admins, DevOps, Data Analysts

**Story 1: Quick Database Inspection**
- **As a** database admin or data analyst
- **I want to** drag-and-drop a .db file into my browser
- **So that** I can instantly query and inspect data without server setup

**Story 2: Ad-Hoc Queries**
- **As a** DevOps engineer troubleshooting production data
- **I want to** execute SQL queries with autocomplete and syntax highlighting
- **So that** I can quickly investigate issues

**Story 3: Schema Exploration**
- **As a** data analyst exploring a new database
- **I want to** browse tables, columns, indexes, and constraints
- **So that** I understand the data structure without documentation

**Story 4: Data Export**
- **As a** researcher working with SQLite data
- **I want to** export query results to CSV, JSON, or Parquet
- **So that** I can analyze data in Excel, Python, or other tools

**Story 5: Lightweight Alternative**
- **As a** developer who finds DBeaver too heavy and Adminer requires server setup
- **I want** a browser-based tool that just works
- **So that** I can work with SQLite files without installing software

**Story 6: Offline Work**
- **As a** field engineer with intermittent connectivity
- **I want** full database admin capabilities offline
- **So that** I can work anywhere without network dependency

---

## Key Requirements

### Functional Requirements

**FR1: Database Operations**
- ✅ Create/open SQLite databases in IndexedDB
- ✅ Execute SQL queries (SELECT, INSERT, UPDATE, DELETE)
- ✅ Parameterized queries for SQL injection prevention
- ✅ Transaction support (BEGIN, COMMIT, ROLLBACK)
- ✅ Prepared statements for performance
- ✅ BLOB support for binary data
- [ ] SQL autocomplete in query editor
- [ ] Syntax highlighting
- ✅ Query history
- ✅ Schema inspection (tables, columns, indexes)

**FR2: Export/Import**
- ✅ Export database to downloadable `.db` file
- ✅ Import `.db` file from filesystem
- [ ] Drag-and-drop file import
- [ ] Export query results to CSV
- [ ] Export query results to JSON
- [ ] Export query results to Parquet
- ✅ Standard SQLite format compatible with CLI and React Native

**FR3: Multi-Tab Coordination**
- ✅ Automatic leader election
- ✅ BroadcastChannel for tab communication
- ✅ Write queue management
- ✅ Lock acquisition/release

**FR4: PWA Features**
- ✅ Service worker for offline support
- ✅ App manifest for "Add to Home Screen"
- ✅ Responsive design (mobile + desktop)
- ✅ Push notification capability (optional)

**FR5: Data Persistence**
- ✅ IndexedDB storage (4KB block-level I/O)
- ✅ LRU cache (128 blocks default)
- ✅ Crash consistency with write-ahead logging
- ✅ Automatic cleanup of orphaned data

### Non-Functional Requirements

**NFR1: Performance**
- Simple SELECT (1 row): < 5ms
- Bulk INSERT (1000 rows): < 500ms
- Database open: < 100ms
- Export 10MB database: < 2s

**NFR2: Browser Compatibility**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari 14+, Android Chrome 90+)

**NFR3: Security**
- Content Security Policy (CSP) compliant
- No eval() or unsafe inline scripts
- HTTPS-only in production
- Secure storage (IndexedDB with same-origin policy)

**NFR4: Observability**
- Optional telemetry with Prometheus metrics
- Error tracking (console.error + optional Sentry)
- Performance marks for key operations
- DevTools extension support

**NFR5: Accessibility**
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- High contrast mode

---

## Technical Stack

### Frontend Framework
- **Next.js 15** - React framework with App Router
- **React 19** - UI library with concurrent features
- **TypeScript 5+** - Type safety

### Database
- **AbsurderSQL WASM** (`@npiesco/absurder-sql`)
  - Rust compiled to WebAssembly
  - SQLite + IndexedDB custom VFS
  - 1.3MB WASM binary

### PWA Infrastructure
- **next-pwa** - Service worker generation
- **workbox** - Offline caching strategies
- **web-vitals** - Performance monitoring

### UI/UX
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library
- **Lucide Icons** - Icon system
- **Radix UI** - Accessible primitives

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Unit testing
- **Playwright** - E2E testing

---

## Success Metrics

### User Adoption
- **Goal:** 1,000 active users in first 3 months
- **Measure:** Monthly active users (MAU)

### Performance
- **Goal:** P95 query time < 10ms
- **Measure:** Performance marks via telemetry

### Reliability
- **Goal:** < 0.1% error rate
- **Measure:** Error tracking via console/Sentry

### Engagement
- **Goal:** 50% of users install as PWA
- **Measure:** App manifest install events

### Cross-Platform Usage
- **Goal:** 30% of users export/import databases
- **Measure:** Export/import API calls

---

## Advanced Features (Required)

**FR6: Server Synchronization**
- WebSocket-based real-time sync
- Conflict resolution (automatic and manual)
- PostgreSQL mirror database
- Delta sync for efficiency
- Offline queue management

**FR7: Collaborative Features**
- Multi-user editing with OT/CRDTs
- Real-time cursor positions
- User presence indicators
- Collaborative transactions
- Shared query editing

**FR8: Advanced Database Capabilities**
- Full-text search (FTS5)
- Spatial queries (SpatiaLite)
- Graph queries (recursive CTEs)
- Vector search with embeddings
- Advanced indexing strategies

**FR9: Enterprise Security**
- Role-based access control (RBAC)
- Row-level security
- Audit logging (tamper-proof)
- Data encryption at rest (AES-256)
- Key management (HSM/KMS support)

**FR10: Compliance**
- SOC 2 Type II certification
- GDPR compliance features
- HIPAA compliance (if applicable)
- Security audit documentation
- Data retention policies

---

## Dependencies

### External Services
- **npm** - Package hosting for `@npiesco/absurder-sql`
- **Vercel** (optional) - Deployment platform
- **Cloudflare** (optional) - CDN + edge caching

### Internal Dependencies
- AbsurderSQL WASM package must be published to npm
- WASM binary must be < 2MB for mobile performance
- TypeScript types must be complete and accurate

---

## Constraints & Assumptions

### Constraints
- Browser must support WASM (no IE11)
- IndexedDB must be available (no private browsing in some browsers)
- WASM binary size impacts initial load time
- Mobile browsers have memory limits

### Assumptions
- Users have modern browsers (< 2 years old)
- Users accept "Add to Home Screen" for PWA benefits
- IndexedDB quota is sufficient (typically 50MB+)
- Desktop users prefer browser over native apps

---

## Risks & Mitigations

### Risk 1: Browser Compatibility
- **Impact:** High
- **Probability:** Medium
- **Mitigation:** Comprehensive browser testing, polyfills where needed

### Risk 2: IndexedDB Quota Exceeded
- **Impact:** High
- **Probability:** Low
- **Mitigation:** Quota monitoring, user warnings, export prompts

### Risk 3: WASM Load Performance
- **Impact:** Medium
- **Probability:** Medium
- **Mitigation:** Lazy loading, code splitting, CDN caching

### Risk 4: Multi-Tab Race Conditions
- **Impact:** High
- **Probability:** Low
- **Mitigation:** Existing multi-tab coordination from AbsurderSQL core

### Risk 5: Safari Private Browsing
- **Impact:** Low
- **Probability:** High
- **Mitigation:** Detect private mode, show fallback message

---

## Acceptance Criteria

### Complete Product
- ✅ PWA installable on desktop and mobile
- ✅ All FR1-FR10 requirements met
- ✅ All NFR1-NFR5 requirements met
- [ ] Server sync operational (< 1s latency)
- [ ] Collaborative editing functional
- [ ] FTS5, SpatiaLite, vector search enabled
- [ ] RBAC and audit logging active
- [ ] SOC 2 and GDPR compliant
- ✅ Example app demonstrating all features
- ✅ Documentation complete
- ✅ Test coverage > 80%
- ✅ Deployed to production

---

## Stakeholder Sign-off

**Product Owner:** Nicholas Piesco  
**Technical Lead:** Nicholas Piesco  
**Designer:** TBD  
**QA Lead:** TBD

**Approved:** Pending  
**Date:** 2025-10-29
