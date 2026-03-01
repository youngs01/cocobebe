import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB Setup
const mongoUrl = process.env.MONGODB_URI || 'mongodb+srv://sinhan2023_db_user:<db_password>@cluster0.auyca0i.mongodb.net/?appName=Cluster0';

let client: MongoClient | null = null;
let db: Db | null = null;
let teachersCollection: Collection | null = null;
let leaveRequestsCollection: Collection | null = null;
let notificationsCollection: Collection | null = null;

async function connectMongoDB() {
  try {
    client = new MongoClient(mongoUrl);
    await client.connect();
    db = client.db('cocobebe');
    
    // Get or create collections
    teachersCollection = db.collection('teachers');
    leaveRequestsCollection = db.collection('leave_requests');
    notificationsCollection = db.collection('notifications');
    
    // Ensure indexes
    await teachersCollection.createIndex({ name: 1 });
    await leaveRequestsCollection.createIndex({ teacher_id: 1 });
    await notificationsCollection.createIndex({ user_id: 1 });
    
    console.log('Using MongoDB database');
    
    // Seed admin if not exists
    const adminExists = await teachersCollection.findOne({ role: 'admin' });
    if (!adminExists) {
      const adminName = process.env.ADMIN_NAME || 'admin';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234';
      await teachersCollection.insertOne({
        name: adminName,
        join_date: '2020-01-01',
        role: 'admin',
        password: adminPassword,
        class_name: null,
        leave_adjustment: 0,
        created_at: new Date().toISOString()
      });
      console.log('Admin user seeded');
    } else {
      // Update admin password if env vars changed
      const adminName = process.env.ADMIN_NAME || 'admin';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234';
      await teachersCollection.updateOne(
        { role: 'admin' },
        {
          $set: {
            name: adminName,
            password: adminPassword
          }
        }
      );
    }
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
}

// Initialize MongoDB connection
await connectMongoDB();

// create the Express app and configure it; we export it for both serverless and local use
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// API Routes

// simple database connectivity check
app.get('/api/db-test', async (req, res) => {
  try {
    if (db) {
      const result = await db.admin().ping();
      return res.json({ ok: true, ping: result });
    }
    res.status(500).json({ ok: false, error: 'no database configured' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err });
  }
});

// convenience endpoint: reset or update admin account
app.post('/api/admin', async (req, res) => {
  const { name = 'admin', password = 'admin1234' } = req.body || {};
  try {
    if (teachersCollection) {
      await teachersCollection.updateOne(
        { role: 'admin' },
        {
          $set: {
            name,
            password
          }
        }
      );
      return res.json({ ok: true });
    }
    res.status(500).json({ ok: false, error: 'database not configured' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err });
  }
});

// Get all teachers
app.get('/api/teachers', async (req, res) => {
  try {
    if (teachersCollection) {
      const teachers = await teachersCollection.find({}).sort({ _id: 1 }).toArray();
      return res.json(teachers);
    }
    res.status(500).json({ error: 'database not configured' });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Create new teacher (admin only)
app.post('/api/teachers', async (req, res) => {
  try {
    const actorRoleHeader = req.headers['x-user-role'];
    const actorRole = Array.isArray(actorRoleHeader) ? actorRoleHeader[0] : (actorRoleHeader || '');
    
    if (actorRole !== 'admin') {
      return res.status(403).json({ error: '권한이 없습니다. 관리자만 교직원을 등록할 수 있습니다.' });
    }

    const { name, join_date, role, password, class_name } = req.body;
    
    if (teachersCollection) {
      const result = await teachersCollection.insertOne({
        name,
        join_date,
        role: role || 'teacher',
        password: password || '1234',
        class_name: class_name || null,
        leave_adjustment: 0,
        created_at: new Date().toISOString()
      });
      return res.json({ id: result.insertedId });
    }
    res.status(500).json({ error: 'database not configured' });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Update teacher
app.patch('/api/teachers/:id', async (req, res) => {
  try {
    const { name, join_date, role, password, class_name, leave_adjustment } = req.body;
    
    if (teachersCollection) {
      await teachersCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        {
          $set: {
            ...(name && { name }),
            ...(join_date && { join_date }),
            ...(role && { role }),
            ...(password && { password }),
            ...(class_name !== undefined && { class_name }),
            ...(leave_adjustment !== undefined && { leave_adjustment }),
            updated_at: new Date().toISOString()
          }
        }
      );
      return res.json({ ok: true });
    }
    res.status(500).json({ error: 'database not configured' });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Delete teacher
app.delete('/api/teachers/:id', async (req, res) => {
  try {
    if (teachersCollection && leaveRequestsCollection && notificationsCollection) {
      const teacherId = new ObjectId(req.params.id);
      // Delete related data first
      await leaveRequestsCollection.deleteMany({ teacher_id: teacherId });
      await notificationsCollection.deleteMany({ user_id: teacherId });
      await teachersCollection.deleteOne({ _id: teacherId });
      return res.json({ ok: true });
    }
    res.status(500).json({ error: 'database not configured' });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Reset teacher password
app.post('/api/teachers/:id/reset-password', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (teachersCollection) {
      await teachersCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { password: password || '1234' } }
      );
      return res.json({ ok: true });
    }
    res.status(500).json({ error: 'database not configured' });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Get all leave requests
app.get('/api/leave-requests', async (req, res) => {
  try {
    if (leaveRequestsCollection && teachersCollection) {
      const requests = await leaveRequestsCollection.aggregate([
        {
          $lookup: {
            from: 'teachers',
            localField: 'teacher_id',
            foreignField: '_id',
            as: 'teacher'
          }
        },
        { $sort: { start_date: -1 } }
      ]).toArray();
      
      const formatted = requests.map((r: any) => ({
        ...r,
        teacher_name: r.teacher?.[0]?.name || 'Unknown'
      }));
      
      return res.json(formatted);
    }
    res.status(500).json({ error: 'database not configured' });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Create leave request
app.post('/api/leave-requests', async (req, res) => {
  try {
    const { teacher_id, type, start_date, end_date, reason } = req.body;
    
    if (leaveRequestsCollection && notificationsCollection && teachersCollection) {
      const result = await leaveRequestsCollection.insertOne({
        teacher_id: new ObjectId(teacher_id),
        type,
        start_date,
        end_date,
        reason,
        status: 'pending',
        processed_by: null,
        processed_at: null,
        created_at: new Date().toISOString()
      });
      
      // Notify admins
      const admins = await teachersCollection.find({ role: { $in: ['admin', 'director'] } }).toArray();
      const teacher = await teachersCollection.findOne({ _id: new ObjectId(teacher_id) });
      const now = new Date().toISOString();
      
      if (admins.length > 0 && teacher) {
        const notifications = admins.map(admin => ({
          user_id: admin._id,
          message: `${teacher.name} 선생님이 연차를 신청했습니다.`,
          is_read: false,
          created_at: now
        }));
        await notificationsCollection.insertMany(notifications);
      }
      
      return res.json({ id: result.insertedId });
    }
    res.status(500).json({ error: 'database not configured' });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Update leave request status
app.patch('/api/leave-requests/:id', async (req, res) => {
  try {
    const { status, processed_by } = req.body;
    
    if (leaveRequestsCollection && notificationsCollection) {
      const requestId = new ObjectId(req.params.id);
      const processed_at = new Date().toISOString();
      
      await leaveRequestsCollection.updateOne(
        { _id: requestId },
        {
          $set: {
            status,
            processed_by,
            processed_at
          }
        }
      );
      
      // Notify teacher if approved
      if (status === 'approved') {
        const request = await leaveRequestsCollection.findOne({ _id: requestId });
        if (request) {
          await notificationsCollection.insertOne({
            user_id: request.teacher_id,
            message: '신청하신 연차가 승인되었습니다.',
            is_read: false,
            created_at: processed_at
          });
        }
      }
      
      return res.json({ ok: true });
    }
    res.status(500).json({ error: 'database not configured' });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Delete leave request
app.delete('/api/leave-requests/:id', async (req, res) => {
  try {
    if (leaveRequestsCollection) {
      await leaveRequestsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
      return res.json({ ok: true });
    }
    res.status(500).json({ error: 'database not configured' });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Get notifications
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    if (notificationsCollection) {
      const notifications = await notificationsCollection
        .find({ user_id: new ObjectId(req.params.userId) })
        .sort({ created_at: -1 })
        .limit(20)
        .toArray();
      return res.json(notifications);
    }
    res.status(500).json({ error: 'database not configured' });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Create notification
app.post('/api/notifications', async (req, res) => {
  try {
    const { user_id, message } = req.body;
    
    if (notificationsCollection) {
      const result = await notificationsCollection.insertOne({
        user_id: new ObjectId(user_id),
        message,
        is_read: false,
        created_at: new Date().toISOString()
      });
      return res.json({ id: result.insertedId });
    }
    res.status(500).json({ error: 'database not configured' });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Mark notification as read
app.patch('/api/notifications/:id', async (req, res) => {
  try {
    if (notificationsCollection) {
      await notificationsCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { is_read: true } }
      );
      return res.json({ ok: true });
    }
    res.status(500).json({ error: 'database not configured' });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Delete notifications for user
app.delete('/api/notifications/:userId', async (req, res) => {
  try {
    if (notificationsCollection) {
      await notificationsCollection.deleteMany({ user_id: new ObjectId(req.params.userId) });
      return res.json({ ok: true });
    }
    res.status(500).json({ error: 'database not configured' });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// NOTE: serving static files / Vite middleware is only needed when
// running as a standalone server (local development or a traditional
// deployment). For serverless functions we leave those concerns to the
// platform.

// start server if running directly (not imported by Netlify function)
// Skip this in serverless environments (Netlify, etc.)
const isServerless = process.env.NETLIFY_FUNCTION_PATH || process.env.AWS_REGION || process.env.VERCEL;
const isDirect = typeof import.meta !== 'undefined' && 
                 import.meta.url && 
                 import.meta.url === `file://${process.argv[1]}`;

if (!isServerless && isDirect) {
  (async () => {
    if (process.env.NODE_ENV !== 'production') {
      // Lazy import Vite only when needed for local dev
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      app.use(express.static(path.join(__dirname, 'dist')));
    }

    const port = parseInt(process.env.PORT || '3000', 10);
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server listening on port ${port}`);
    });
  })();
}

export default app;
