# Product Requirements Document (PRD)
## AbsurderSQL PWA - Progressive Web Application

**Version:** 1.0  
**Last Updated:** October 29, 2025  
**Status:** Planning Phase  
**Target Framework:** Next.js 15 + React 19

---

## Project Overview

Build a Progressive Web Application (PWA) using Next.js that leverages the existing AbsurderSQL WASM package (`@npiesco/absurder-sql`) to provide SQLite + IndexedDB functionality across desktop and mobile browsers.

### Project Goals

1. **Cross-Platform Browser Support** - Single codebase works on desktop and mobile browsers
2. **Offline-First Architecture** - Full functionality without network connection
3. **Data Portability** - Export/import `.db` files to/from React Native and CLI
4. **Production Ready** - Built-in monitoring, error handling, and performance optimization
5. **Developer Experience** - TypeScript types, clear API, comprehensive docs

---

## User Stories

### Primary Users: Web Application Users

**Story 1: Offline Database Access**
- **As a** web application user
- **I want to** create and query SQLite databases in my browser
- **So that** I can work offline without a backend server

**Story 2: Data Export**
- **As a** user with data in the browser
- **I want to** export my database as a standard SQLite file
- **So that** I can query it with CLI tools or import to mobile app

**Story 3: Data Import**
- **As a** user with a `.db` file from mobile or CLI
- **I want to** import it into the browser
- **So that** I can access my data from any platform

**Story 4: Multi-Tab Coordination**
- **As a** user with multiple browser tabs open
- **I want** automatic coordination between tabs
- **So that** I don't corrupt my database with concurrent writes

**Story 5: Mobile Browser Experience**
- **As a** mobile browser user
- **I want** a responsive, app-like interface
- **So that** I can install as PWA and use like a native app

### Secondary Users: Developers

**Story 6: Easy Integration**
- **As a** developer building a web app
- **I want** simple TypeScript APIs
- **So that** I can integrate SQLite quickly without learning complex APIs

**Story 7: Performance Monitoring**
- **As a** developer in production
- **I want** built-in telemetry and monitoring
- **So that** I can identify performance issues

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

**FR2: Export/Import**
- ✅ Export database to downloadable `.db` file
- ✅ Import `.db` file from filesystem
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

## Out of Scope (Phase 1)

- ❌ Server-side synchronization (future: Phase 2)
- ❌ Collaborative editing (future: Phase 3)
- ❌ Advanced encryption (SQLCipher in browser)
- ❌ WebRTC peer-to-peer sync
- ❌ Cloud backup integration

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

### Phase 1 Completion
- ✅ PWA installable on desktop and mobile
- ✅ All FR1-FR5 requirements met
- ✅ All NFR1-NFR5 requirements met
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
