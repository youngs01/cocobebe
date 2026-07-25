import express from 'express';
import path from 'path';
import { MongoClient, Db } from 'mongodb';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_STAFF,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_POLICY,
  INITIAL_NOTIFICATIONS,
} from './src/data/initialData';
import {
  Staff,
  LeaveRequest,
  AnnualLeavePolicy,
  Notification,
  DbStatus,
} from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// Memory/Local fallback state
let localStore = {
  staff: [...INITIAL_STAFF] as Staff[],
  leaveRequests: [...INITIAL_LEAVE_REQUESTS] as LeaveRequest[],
  policy: { ...INITIAL_POLICY } as AnnualLeavePolicy,
  notifications: [...INITIAL_NOTIFICATIONS] as Notification[],
};

// MongoDB Connection State
let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let currentDbUri = process.env.MONGODB_URI || 'mongodb+srv://sinhan2023_db_user:Cocobebekinder1980@cluster0.auyca0i.mongodb.net/?appName=Cluster0';
let isMongoConnected = false;
let mongoErrorString = '';

async function tryConnectMongo(uri: string): Promise<boolean> {
  if (!uri) {
    isMongoConnected = false;
    mongoErrorString = 'MongoDB 연결 URI가 설정되지 않았습니다.';
    return false;
  }

  try {
    if (mongoClient) {
      await mongoClient.close().catch(() => {});
      mongoClient = null;
      mongoDb = null;
    }

    const client = new MongoClient(uri, {
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
      tlsAllowInvalidCertificates: true,
    });

    await client.connect();
    const db = client.db('cocobebe_nursery');

    // Test ping
    await db.command({ ping: 1 });

    mongoClient = client;
    mongoDb = db;
    isMongoConnected = true;
    mongoErrorString = '';
    currentDbUri = uri;

    // Seed initial collections if empty or remove dummy test records if they exist
    const staffCol = db.collection('staff');
    const staffCount = await staffCol.countDocuments();
    if (staffCount === 0) {
      if (INITIAL_STAFF.length > 0) {
        await staffCol.insertMany(INITIAL_STAFF);
      }
      if (INITIAL_LEAVE_REQUESTS.length > 0) {
        await db.collection('leave_requests').insertMany(INITIAL_LEAVE_REQUESTS);
      }
      await db.collection('policy').insertOne(INITIAL_POLICY);
      if (INITIAL_NOTIFICATIONS.length > 0) {
        await db.collection('notifications').insertMany(INITIAL_NOTIFICATIONS);
      }
    } else {
      // Remove legacy dummy test accounts (including staff-1)
      await staffCol.deleteMany({ id: { $in: ['staff-1', 'staff-2', 'staff-3', 'staff-4', 'staff-5', 'staff-6'] } });
      await db.collection('leave_requests').deleteMany({ id: { $in: ['req-101', 'req-102'] } });
      await db.collection('notifications').deleteMany({ id: 'notif-1' });
    }

    console.log('✅ Connected to MongoDB successfully!');
    return true;
  } catch (err: any) {
    console.warn('⚠️ MongoDB Connection Failed, using Local Fallback:', err.message);
    isMongoConnected = false;
    mongoErrorString = err.message || 'MongoDB 연결 실패';
    mongoClient = null;
    mongoDb = null;
    return false;
  }
}

// Helper for serverless/Vercel environment
async function ensureMongoConnected() {
  if (isMongoConnected && mongoDb) return;
  await tryConnectMongo(currentDbUri);
}

app.use('/api', async (req, res, next) => {
  if (!isMongoConnected) {
    await ensureMongoConnected();
  }
  next();
});

// --- API ROUTES ---

// DB Status & Config
app.get('/api/db/status', (req, res) => {
  const maskedUri = currentDbUri.replace(/:([^@]+)@/, ':****@');
  res.json({
    connected: isMongoConnected,
    type: isMongoConnected ? 'mongodb' : 'local',
    connectionString: maskedUri,
    error: mongoErrorString,
  } as DbStatus);
});

app.post('/api/db/config', async (req, res) => {
  const { connectionString } = req.body;
  if (!connectionString) {
    return res.status(400).json({ error: '연동할 MongoDB 연결 문자열을 입력해주세요.' });
  }

  const success = await tryConnectMongo(connectionString);
  const maskedUri = connectionString.replace(/:([^@]+)@/, ':****@');

  if (success) {
    return res.json({
      success: true,
      message: 'MongoDB 데이터베이스에 성공적으로 연결되었습니다!',
      status: {
        connected: true,
        type: 'mongodb',
        connectionString: maskedUri,
      },
    });
  } else {
    return res.status(400).json({
      success: false,
      message: `MongoDB 연결 실패: ${mongoErrorString}`,
      status: {
        connected: false,
        type: 'local',
        connectionString: maskedUri,
        error: mongoErrorString,
      },
    });
  }
});

// Staff Management (직원 목록, 추가, 수정, 삭제)
app.get('/api/staff', async (req, res) => {
  try {
    if (isMongoConnected && mongoDb) {
      const docs = await mongoDb.collection('staff').find({}).toArray();
      const staffList = docs.map((doc) => {
        const { _id, ...rest } = doc;
        return rest as Staff;
      });
      return res.json(staffList);
    }
    res.json(localStore.staff);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/staff', async (req, res) => {
  try {
    const newStaff: Staff = {
      id: `staff-${Date.now()}`,
      name: req.body.name,
      employeeNumber: req.body.employeeNumber || `CB-${new Date().getFullYear()}${Math.floor(100 + Math.random() * 900)}`,
      role: req.body.role || 'teacher',
      positionTitle: req.body.positionTitle || '교사',
      className: req.body.className || '새싹반',
      joinDate: req.body.joinDate || new Date().toISOString().split('T')[0],
      email: req.body.email || `${req.body.name.toLowerCase()}@cocobebe.child.kr`,
      phone: req.body.phone || '010-0000-0000',
      manualAdjustment: Number(req.body.manualAdjustment) || 0,
      status: 'active',
    };

    if (isMongoConnected && mongoDb) {
      await mongoDb.collection('staff').insertOne(newStaff);
    } else {
      localStore.staff.push(newStaff);
    }

    res.json(newStaff);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (isMongoConnected && mongoDb) {
      await mongoDb.collection('staff').updateOne({ id }, { $set: updateData });
    } else {
      localStore.staff = localStore.staff.map((s) => (s.id === id ? { ...s, ...updateData } : s));
    }

    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected && mongoDb) {
      await mongoDb.collection('staff').deleteOne({ id });
    } else {
      localStore.staff = localStore.staff.filter((s) => s.id !== id);
    }
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Leave Requests Management (휴가 신청, 목록, 승인/거부)
app.get('/api/leave-requests', async (req, res) => {
  try {
    if (isMongoConnected && mongoDb) {
      const docs = await mongoDb.collection('leave_requests').find({}).sort({ createdAt: -1 }).toArray();
      const list = docs.map((doc) => {
        const { _id, ...rest } = doc;
        return rest as LeaveRequest;
      });
      return res.json(list);
    }
    res.json(localStore.leaveRequests);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/leave-requests', async (req, res) => {
  try {
    const newReq: LeaveRequest = {
      id: `req-${Date.now()}`,
      staffId: req.body.staffId,
      staffName: req.body.staffName,
      staffRole: req.body.staffRole,
      className: req.body.className,
      type: req.body.type,
      daysCount: Number(req.body.daysCount) || (req.body.type.startsWith('half') ? 0.5 : 1.0),
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      reason: req.body.reason,
      substituteTeacherId: req.body.substituteTeacherId,
      substituteTeacherName: req.body.substituteTeacherName,
      status: 'pending',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    if (isMongoConnected && mongoDb) {
      await mongoDb.collection('leave_requests').insertOne(newReq);
    } else {
      localStore.leaveRequests.unshift(newReq);
    }

    res.json(newReq);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/leave-requests/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approvedBy, rejectReason } = req.body; // 'approved' | 'rejected'

    const approvedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const updateObj: Partial<LeaveRequest> = {
      status,
      approvedBy: approvedBy || '김은영 (원장)',
      approvedAt,
      rejectReason: rejectReason || '',
    };

    let targetReq: LeaveRequest | undefined;

    if (isMongoConnected && mongoDb) {
      await mongoDb.collection('leave_requests').updateOne({ id }, { $set: updateObj });
      const doc = await mongoDb.collection('leave_requests').findOne({ id });
      if (doc) {
        const { _id, ...rest } = doc;
        targetReq = rest as LeaveRequest;
      }
    } else {
      localStore.leaveRequests = localStore.leaveRequests.map((r) => {
        if (r.id === id) {
          targetReq = { ...r, ...updateObj };
          return targetReq;
        }
        return r;
      });
    }

    if (targetReq) {
      // Create notification for employee
      const notification: Notification = {
        id: `notif-${Date.now()}`,
        staffId: targetReq.staffId,
        title: status === 'approved' ? '휴가 결재 승인 안내' : '휴가 결재 반려 안내',
        message: status === 'approved'
          ? `${targetReq.startDate} ${targetReq.type === 'annual' ? '연차' : '휴가'} 신청이 승인되었습니다.`
          : `${targetReq.startDate} 휴가 신청이 사유(${rejectReason || '사정상 불가'})로 반려되었습니다.`,
        type: status === 'approved' ? 'leave_approved' : 'leave_rejected',
        read: false,
        createdAt: approvedAt,
      };

      if (isMongoConnected && mongoDb) {
        await mongoDb.collection('notifications').insertOne(notification);
      } else {
        localStore.notifications.unshift(notification);
      }
    }

    res.json({ success: true, id, status });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Policy Management (연차 정책 설정)
app.get('/api/policy', async (req, res) => {
  try {
    if (isMongoConnected && mongoDb) {
      const doc = await mongoDb.collection('policy').findOne({});
      if (doc) {
        const { _id, ...rest } = doc;
        return res.json(rest as AnnualLeavePolicy);
      }
    }
    res.json(localStore.policy);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/policy', async (req, res) => {
  try {
    const newPolicy: AnnualLeavePolicy = req.body;
    if (isMongoConnected && mongoDb) {
      await mongoDb.collection('policy').updateOne({}, { $set: newPolicy }, { upsert: true });
    } else {
      localStore.policy = { ...localStore.policy, ...newPolicy };
    }
    res.json(newPolicy);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const { staffId } = req.query;
    if (isMongoConnected && mongoDb) {
      const filter = staffId ? { staffId: String(staffId) } : {};
      const docs = await mongoDb.collection('notifications').find(filter).sort({ createdAt: -1 }).toArray();
      const list = docs.map((doc) => {
        const { _id, ...rest } = doc;
        return rest as Notification;
      });
      return res.json(list);
    }

    let result = localStore.notifications;
    if (staffId) {
      result = result.filter((n) => n.staffId === staffId);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected && mongoDb) {
      await mongoDb.collection('notifications').updateOne({ id }, { $set: { read: true } });
    } else {
      const item = localStore.notifications.find((n) => n.id === id);
      if (item) item.read = true;
    }
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Express & Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CocoBebe Nursery Server running on http://0.0.0.0:${PORT}`);
  });
}

if (process.env.VERCEL !== '1') {
  startServer();
}

export default app;
