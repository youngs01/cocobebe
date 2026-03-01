import serverless from 'serverless-http';
import app from '../../server';

// Netlify functions will compile/transform this using their bundler (nft)
// `app` is the Express instance exported from the root server.ts.
export const handler = serverless(app);

// database connection is handled inside `server.ts`; this wrapper merely bridges
// Express to Netlify.

