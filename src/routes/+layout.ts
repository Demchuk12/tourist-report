// All data lives in IndexedDB on the client, so server rendering has nothing to
// render — this keeps every route a plain client-side render after hydration.
export const ssr = false;
