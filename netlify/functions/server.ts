import 'ts-node/register';
import serverless from 'serverless-http';
import app from '../../server.ts';

// export a Netlify-compatible handler that wraps the Express app
export const handler = serverless(app);
