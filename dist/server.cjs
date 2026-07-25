var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_pg = __toESM(require("pg"), 1);

// src/data/initialData.ts
var INITIAL_STAFF = [];
var INITIAL_POLICY = {
  negativeDeductionEnabled: true,
  rolloverMode: "limited",
  maxRolloverDays: 5,
  rolloverExpiryMonths: 3,
  statutoryBaseDays: 15,
  maxStatutoryDays: 25
};
var INITIAL_LEAVE_REQUESTS = [];
var INITIAL_NOTIFICATIONS = [];

// server.ts
var { Pool } = import_pg.default;
var app = (0, import_express.default)();
var PORT = Number(process.env.PORT) || 3e3;
var isVercelRuntime = Boolean(process.env.VERCEL);
app.use(import_express.default.json());
var NEON_PG_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
var localStore = {
  staff: [...INITIAL_STAFF],
  leaveRequests: [...INITIAL_LEAVE_REQUESTS],
  policy: { ...INITIAL_POLICY },
  notifications: [...INITIAL_NOTIFICATIONS]
};
var pgPool = null;
var activeDbType = "local";
var currentDbUri = NEON_PG_URL;
var dbErrorString = "";
async function tryConnectPostgres(uri) {
  if (!uri) return false;
  try {
    if (pgPool) {
      await pgPool.end().catch(() => {
      });
      pgPool = null;
    }
    const pool = new Pool({
      connectionString: uri,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: isVercelRuntime ? 2e3 : 1e4,
      idleTimeoutMillis: isVercelRuntime ? 1e3 : 3e4
    });
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    pgPool = pool;
    activeDbType = "postgresql";
    dbErrorString = "";
    currentDbUri = uri;
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        "employeeNumber" VARCHAR(100),
        role VARCHAR(50),
        "positionTitle" VARCHAR(100),
        "className" VARCHAR(100),
        "joinDate" VARCHAR(50),
        email VARCHAR(200),
        phone VARCHAR(50),
        "manualAdjustment" NUMERIC DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        "loginId" VARCHAR(100),
        "loginPassword" VARCHAR(100)
      );

      ALTER TABLE staff ADD COLUMN IF NOT EXISTS "loginId" VARCHAR(100);
      ALTER TABLE staff ADD COLUMN IF NOT EXISTS "loginPassword" VARCHAR(100);

      CREATE TABLE IF NOT EXISTS leave_requests (
        id VARCHAR(100) PRIMARY KEY,
        "staffId" VARCHAR(100),
        "staffName" VARCHAR(100),
        "staffRole" VARCHAR(50),
        "className" VARCHAR(100),
        type VARCHAR(50),
        "daysCount" NUMERIC,
        "startDate" VARCHAR(50),
        "endDate" VARCHAR(50),
        reason TEXT,
        "substituteTeacherId" VARCHAR(100),
        "substituteTeacherName" VARCHAR(100),
        status VARCHAR(50),
        "approvedBy" VARCHAR(100),
        "approvedAt" VARCHAR(100),
        "rejectReason" TEXT,
        "createdAt" VARCHAR(100),
        "deductedFromNextYear" BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS policy (
        id VARCHAR(50) PRIMARY KEY,
        "negativeDeductionEnabled" BOOLEAN DEFAULT TRUE,
        "rolloverMode" VARCHAR(50) DEFAULT 'none',
        "maxRolloverDays" NUMERIC DEFAULT 0,
        "rolloverExpiryMonths" NUMERIC DEFAULT 12,
        "statutoryBaseDays" NUMERIC DEFAULT 15,
        "maxStatutoryDays" NUMERIC DEFAULT 25
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(100) PRIMARY KEY,
        "staffId" VARCHAR(100),
        title VARCHAR(200),
        message TEXT,
        type VARCHAR(50),
        read BOOLEAN DEFAULT FALSE,
        "createdAt" VARCHAR(100)
      );
    `);
    const staffCheck = await pool.query("SELECT COUNT(*) FROM staff");
    const staffCount = parseInt(staffCheck.rows[0].count, 10);
    if (staffCount === 0) {
      for (const s of INITIAL_STAFF) {
        await pool.query(
          `INSERT INTO staff (id, name, "employeeNumber", role, "positionTitle", "className", "joinDate", email, phone, "manualAdjustment", status, "loginId", "loginPassword")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (id) DO NOTHING`,
          [
            s.id,
            s.name,
            s.employeeNumber,
            s.role,
            s.positionTitle,
            s.className,
            s.joinDate,
            s.email,
            s.phone,
            s.manualAdjustment || 0,
            s.status || "active",
            s.loginId || null,
            s.loginPassword || null
          ]
        );
      }
      for (const l of INITIAL_LEAVE_REQUESTS) {
        await pool.query(
          `INSERT INTO leave_requests (id, "staffId", "staffName", "staffRole", "className", type, "daysCount", "startDate", "endDate", reason, "substituteTeacherId", "substituteTeacherName", status, "approvedBy", "approvedAt", "rejectReason", "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
           ON CONFLICT (id) DO NOTHING`,
          [
            l.id,
            l.staffId,
            l.staffName,
            l.staffRole,
            l.className,
            l.type,
            l.daysCount,
            l.startDate,
            l.endDate,
            l.reason,
            l.substituteTeacherId || null,
            l.substituteTeacherName || null,
            l.status,
            l.approvedBy || null,
            l.approvedAt || null,
            l.rejectReason || null,
            l.createdAt
          ]
        );
      }
      await pool.query(
        `INSERT INTO policy (id, "negativeDeductionEnabled", "rolloverMode", "maxRolloverDays", "rolloverExpiryMonths", "statutoryBaseDays", "maxStatutoryDays")
         VALUES ('default_policy', $1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [
          INITIAL_POLICY.negativeDeductionEnabled,
          INITIAL_POLICY.rolloverMode,
          INITIAL_POLICY.maxRolloverDays,
          INITIAL_POLICY.rolloverExpiryMonths,
          INITIAL_POLICY.statutoryBaseDays,
          INITIAL_POLICY.maxStatutoryDays
        ]
      );
      for (const n of INITIAL_NOTIFICATIONS) {
        await pool.query(
          `INSERT INTO notifications (id, "staffId", title, message, type, read, "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [n.id, n.staffId, n.title, n.message, n.type, n.read, n.createdAt]
        );
      }
    } else {
      await pool.query(`DELETE FROM staff WHERE id IN ('staff-1', 'staff-2', 'staff-3', 'staff-4', 'staff-5', 'staff-6')`);
      await pool.query(`DELETE FROM leave_requests WHERE id IN ('req-101', 'req-102')`);
      await pool.query(`DELETE FROM notifications WHERE id = 'notif-1'`);
    }
    console.log("\u2705 Connected to Neon PostgreSQL DB successfully!");
    return true;
  } catch (err) {
    console.warn("\u26A0\uFE0F PostgreSQL Connection Failed:", err.message);
    activeDbType = "local";
    dbErrorString = err.message || "PostgreSQL \uC5F0\uACB0 \uC2E4\uD328";
    pgPool = null;
    return false;
  }
}
async function ensureDbConnected() {
  if (activeDbType !== "local") return;
  if (isVercelRuntime) return;
  await tryConnectPostgres(currentDbUri);
}
app.use("/api", async (req, res, next) => {
  if (activeDbType === "local" && !isVercelRuntime) {
    await ensureDbConnected();
  }
  next();
});
app.post("/api/admin/login", (req, res) => {
  const { adminId, adminPassword } = req.body;
  const targetId = process.env.ADMIN_ID || "";
  const targetPass = process.env.ADMIN_PASSWORD || "";
  if (adminId === targetId && adminPassword === targetPass) {
    return res.json({ success: true, message: "\uB85C\uADF8\uC778 \uC131\uACF5" });
  } else {
    return res.status(401).json({ success: false, message: "\uC544\uC774\uB514 \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." });
  }
});
app.get("/api/db/status", (req, res) => {
  const maskedUri = currentDbUri.replace(/:([^@]+)@/, ":****@");
  res.json({
    connected: activeDbType !== "local",
    type: activeDbType,
    connectionString: maskedUri,
    error: dbErrorString
  });
});
app.post("/api/db/config", async (req, res) => {
  const { connectionString } = req.body;
  if (!connectionString) {
    return res.status(400).json({ error: "\uB370\uC774\uD130\uBCA0\uC774\uC2A4 \uC5F0\uACB0 \uBB38\uC790\uC5F4\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694." });
  }
  const success = await tryConnectPostgres(connectionString);
  const maskedUri = connectionString.replace(/:([^@]+)@/, ":****@");
  if (success) {
    return res.json({
      success: true,
      message: "Neon PostgreSQL \uB370\uC774\uD130\uBCA0\uC774\uC2A4\uC5D0 \uC131\uACF5\uC801\uC73C\uB85C \uC5F0\uACB0\uB418\uC5C8\uC2B5\uB2C8\uB2E4!",
      status: {
        connected: true,
        type: "postgresql",
        connectionString: maskedUri
      }
    });
  } else {
    return res.status(400).json({
      success: false,
      message: `\uB370\uC774\uD130\uBCA0\uC774\uC2A4 \uC5F0\uACB0 \uC2E4\uD328: ${dbErrorString}`,
      status: {
        connected: false,
        type: "local",
        connectionString: maskedUri,
        error: dbErrorString
      }
    });
  }
});
app.get("/api/staff", async (req, res) => {
  try {
    if (activeDbType === "postgresql" && pgPool) {
      const result = await pgPool.query("SELECT * FROM staff ORDER BY name ASC");
      const list = result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        employeeNumber: row.employeeNumber,
        role: row.role,
        positionTitle: row.positionTitle,
        className: row.className,
        joinDate: row.joinDate,
        email: row.email,
        phone: row.phone,
        manualAdjustment: Number(row.manualAdjustment) || 0,
        status: row.status || "active",
        loginId: row.loginId || "",
        loginPassword: row.loginPassword || ""
      }));
      return res.json(list);
    }
    res.json(localStore.staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/staff", async (req, res) => {
  try {
    const newStaff = {
      id: `staff-${Date.now()}`,
      name: req.body.name,
      employeeNumber: req.body.employeeNumber || `CB-${(/* @__PURE__ */ new Date()).getFullYear()}${Math.floor(100 + Math.random() * 900)}`,
      role: req.body.role || "teacher",
      positionTitle: req.body.positionTitle || "\uAD50\uC0AC",
      className: req.body.className || "\uC0C8\uC2F9\uBC18",
      joinDate: req.body.joinDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      email: req.body.email || "",
      phone: req.body.phone || "010-0000-0000",
      manualAdjustment: Number(req.body.manualAdjustment) || 0,
      status: "active",
      loginId: req.body.loginId || "",
      loginPassword: req.body.loginPassword || ""
    };
    if (activeDbType === "postgresql" && pgPool) {
      await pgPool.query(
        `INSERT INTO staff (id, name, "employeeNumber", role, "positionTitle", "className", "joinDate", email, phone, "manualAdjustment", status, "loginId", "loginPassword")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          newStaff.id,
          newStaff.name,
          newStaff.employeeNumber,
          newStaff.role,
          newStaff.positionTitle,
          newStaff.className,
          newStaff.joinDate,
          newStaff.email,
          newStaff.phone,
          newStaff.manualAdjustment,
          newStaff.status,
          newStaff.loginId,
          newStaff.loginPassword
        ]
      );
    } else {
      localStore.staff.push(newStaff);
    }
    res.json(newStaff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put("/api/staff/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    if (activeDbType === "postgresql" && pgPool) {
      await pgPool.query(
        `UPDATE staff 
         SET name = COALESCE($1, name),
             "employeeNumber" = COALESCE($2, "employeeNumber"),
             role = COALESCE($3, role),
             "positionTitle" = COALESCE($4, "positionTitle"),
             "className" = COALESCE($5, "className"),
             "joinDate" = COALESCE($6, "joinDate"),
             email = COALESCE($7, email),
             phone = COALESCE($8, phone),
             "manualAdjustment" = COALESCE($9, "manualAdjustment"),
             status = COALESCE($10, status),
             "loginId" = COALESCE($11, "loginId"),
             "loginPassword" = COALESCE($12, "loginPassword")
         WHERE id = $13`,
        [
          updateData.name,
          updateData.employeeNumber,
          updateData.role,
          updateData.positionTitle,
          updateData.className,
          updateData.joinDate,
          updateData.email,
          updateData.phone,
          updateData.manualAdjustment !== void 0 ? Number(updateData.manualAdjustment) : null,
          updateData.status,
          updateData.loginId !== void 0 ? updateData.loginId : null,
          updateData.loginPassword !== void 0 ? updateData.loginPassword : null,
          id
        ]
      );
    } else {
      localStore.staff = localStore.staff.map((s) => s.id === id ? { ...s, ...updateData } : s);
    }
    res.json({ success: true, message: "\uC9C1\uC6D0 \uC815\uBCF4\uAC00 \uC218\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/staff/login", async (req, res) => {
  try {
    const { loginId, loginPassword } = req.body;
    if (!loginId || !loginPassword) {
      return res.status(400).json({ success: false, message: "\uC544\uC774\uB514\uC640 \uBE44\uBC00\uBC88\uD638\uB97C \uBAA8\uB450 \uC785\uB825\uD574\uC8FC\uC138\uC694." });
    }
    const targetAdminId = process.env.ADMIN_ID || "";
    const targetAdminPass = process.env.ADMIN_PASSWORD || "";
    if (loginId === targetAdminId && loginPassword === targetAdminPass) {
      return res.json({
        success: true,
        isAdmin: true,
        message: "\uAD00\uB9AC\uC790\uB85C \uB85C\uADF8\uC778\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
        staff: {
          id: "admin-cocobebe",
          name: "\uAD00\uB9AC\uC790",
          employeeNumber: "ADMIN-001",
          role: "admin",
          positionTitle: "\uC6D0\uC7A5",
          className: "\uC6D0\uC7A5\uC2E4 / \uD589\uC815",
          joinDate: "2020-03-01",
          email: "cocobebe@cocobebe.child.kr",
          phone: "010-0000-0000",
          manualAdjustment: 0,
          status: "active",
          loginId: targetAdminId
        }
      });
    }
    let foundStaff;
    if (activeDbType === "postgresql" && pgPool) {
      const result = await pgPool.query(
        'SELECT * FROM staff WHERE "loginId" = $1 AND "loginPassword" = $2 LIMIT 1',
        [loginId, loginPassword]
      );
      if (result.rows.length > 0) {
        const row = result.rows[0];
        foundStaff = {
          id: row.id,
          name: row.name,
          employeeNumber: row.employeeNumber,
          role: row.role,
          positionTitle: row.positionTitle,
          className: row.className,
          joinDate: row.joinDate,
          email: row.email,
          phone: row.phone,
          manualAdjustment: Number(row.manualAdjustment) || 0,
          status: row.status || "active",
          loginId: row.loginId,
          loginPassword: row.loginPassword
        };
      }
    } else {
      foundStaff = localStore.staff.find((s) => s.loginId === loginId && s.loginPassword === loginPassword);
    }
    if (foundStaff) {
      const isDirectorOrAdmin = foundStaff.role === "admin" || foundStaff.positionTitle === "\uC6D0\uC7A5";
      return res.json({
        success: true,
        isAdmin: isDirectorOrAdmin,
        staff: foundStaff,
        message: `${foundStaff.name} ${foundStaff.positionTitle}\uB2D8 \uD658\uC601\uD569\uB2C8\uB2E4!`
      });
    }
    return res.status(401).json({
      success: false,
      message: "\uB4F1\uB85D\uB41C \uC544\uC774\uB514 \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
app.delete("/api/staff/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("[DELETE /api/staff/:id] Request to delete staff ID:", id);
    if (activeDbType === "postgresql" && pgPool) {
      await pgPool.query('UPDATE leave_requests SET "substituteTeacherId" = NULL WHERE "substituteTeacherId" = $1', [id]).catch(() => {
      });
      await pgPool.query("UPDATE leave_requests SET substituteteacherid = NULL WHERE substituteteacherid = $1", [id]).catch(() => {
      });
      await pgPool.query('DELETE FROM leave_requests WHERE "staffId" = $1', [id]).catch(() => {
      });
      await pgPool.query("DELETE FROM leave_requests WHERE staffid = $1", [id]).catch(() => {
      });
      await pgPool.query('DELETE FROM notifications WHERE "staffId" = $1', [id]).catch(() => {
      });
      await pgPool.query("DELETE FROM notifications WHERE staffid = $1", [id]).catch(() => {
      });
      const result = await pgPool.query("DELETE FROM staff WHERE id = $1", [id]);
      console.log(`[DELETE /api/staff/:id] Deleted ${result.rowCount} row(s) from staff table.`);
    }
    localStore.staff = localStore.staff.filter((s) => s.id !== id);
    localStore.leaveRequests = localStore.leaveRequests.filter((r) => r.staffId !== id);
    localStore.notifications = localStore.notifications.filter((n) => n.staffId !== id);
    return res.json({ success: true, message: "\uAD50\uC0AC \uACC4\uC815\uC774 \uC131\uACF5\uC801\uC73C\uB85C \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
  } catch (err) {
    console.error("Error deleting staff:", err);
    return res.status(500).json({ error: err.message || "\uAD50\uC0AC \uC0AD\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
  }
});
app.get("/api/leave-requests", async (req, res) => {
  try {
    if (activeDbType === "postgresql" && pgPool) {
      const result = await pgPool.query('SELECT * FROM leave_requests ORDER BY "createdAt" DESC');
      const list = result.rows.map((row) => ({
        id: row.id,
        staffId: row.staffId,
        staffName: row.staffName,
        staffRole: row.staffRole,
        className: row.className,
        type: row.type,
        daysCount: Number(row.daysCount) || 0,
        startDate: row.startDate,
        endDate: row.endDate,
        reason: row.reason,
        substituteTeacherId: row.substituteTeacherId,
        substituteTeacherName: row.substituteTeacherName,
        status: row.status,
        approvedBy: row.approvedBy,
        approvedAt: row.approvedAt,
        rejectReason: row.rejectReason,
        createdAt: row.createdAt,
        deductedFromNextYear: row.deductedFromNextYear || false
      }));
      return res.json(list);
    }
    res.json(localStore.leaveRequests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/leave-requests", async (req, res) => {
  try {
    const newReq = {
      id: `req-${Date.now()}`,
      staffId: req.body.staffId,
      staffName: req.body.staffName,
      staffRole: req.body.staffRole,
      className: req.body.className,
      type: req.body.type,
      daysCount: Number(req.body.daysCount) || 1,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      reason: req.body.reason,
      substituteTeacherId: req.body.substituteTeacherId || null,
      substituteTeacherName: req.body.substituteTeacherName || null,
      status: "pending",
      createdAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      deductedFromNextYear: false
    };
    if (activeDbType === "postgresql" && pgPool) {
      await pgPool.query(
        `INSERT INTO leave_requests (id, "staffId", "staffName", "staffRole", "className", type, "daysCount", "startDate", "endDate", reason, "substituteTeacherId", "substituteTeacherName", status, "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          newReq.id,
          newReq.staffId,
          newReq.staffName,
          newReq.staffRole,
          newReq.className,
          newReq.type,
          newReq.daysCount,
          newReq.startDate,
          newReq.endDate,
          newReq.reason,
          newReq.substituteTeacherId,
          newReq.substituteTeacherName,
          newReq.status,
          newReq.createdAt
        ]
      );
    } else {
      localStore.leaveRequests.unshift(newReq);
    }
    res.json(newReq);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put("/api/leave-requests/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy, deductedFromNextYear } = req.body;
    const approvedAt = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    if (activeDbType === "postgresql" && pgPool) {
      await pgPool.query(
        `UPDATE leave_requests 
         SET status = 'approved', "approvedBy" = $1, "approvedAt" = $2, "deductedFromNextYear" = COALESCE($3, "deductedFromNextYear")
         WHERE id = $4`,
        [approvedBy || "\uC6D0\uC7A5", approvedAt, deductedFromNextYear || false, id]
      );
    } else {
      localStore.leaveRequests = localStore.leaveRequests.map(
        (r) => r.id === id ? { ...r, status: "approved", approvedBy: approvedBy || "\uC6D0\uC7A5", approvedAt, deductedFromNextYear } : r
      );
    }
    res.json({ success: true, message: "\uC2B9\uC778 \uCC98\uB9AC\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put("/api/leave-requests/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectReason } = req.body;
    if (activeDbType === "postgresql" && pgPool) {
      await pgPool.query(
        `UPDATE leave_requests 
         SET status = 'rejected', "rejectReason" = $1
         WHERE id = $2`,
        [rejectReason || "\uC0AC\uC720 \uBBF8\uAE30\uC7AC", id]
      );
    } else {
      localStore.leaveRequests = localStore.leaveRequests.map(
        (r) => r.id === id ? { ...r, status: "rejected", rejectReason: rejectReason || "\uC0AC\uC720 \uBBF8\uAE30\uC7AC" } : r
      );
    }
    res.json({ success: true, message: "\uBC18\uB824 \uCC98\uB9AC\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/policy", async (req, res) => {
  try {
    if (activeDbType === "postgresql" && pgPool) {
      const result = await pgPool.query("SELECT * FROM policy WHERE id = 'default_policy' LIMIT 1");
      if (result.rows.length > 0) {
        const row = result.rows[0];
        const pol = {
          negativeDeductionEnabled: row.negativeDeductionEnabled,
          rolloverMode: row.rolloverMode,
          maxRolloverDays: Number(row.maxRolloverDays) || 0,
          rolloverExpiryMonths: Number(row.rolloverExpiryMonths) || 12,
          statutoryBaseDays: Number(row.statutoryBaseDays) || 15,
          maxStatutoryDays: Number(row.maxStatutoryDays) || 25
        };
        return res.json(pol);
      }
    }
    res.json(localStore.policy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put("/api/policy", async (req, res) => {
  try {
    const updated = req.body;
    if (activeDbType === "postgresql" && pgPool) {
      await pgPool.query(
        `UPDATE policy 
         SET "negativeDeductionEnabled" = $1, "rolloverMode" = $2, "maxRolloverDays" = $3, "rolloverExpiryMonths" = $4, "statutoryBaseDays" = $5, "maxStatutoryDays" = $6
         WHERE id = 'default_policy'`,
        [
          updated.negativeDeductionEnabled,
          updated.rolloverMode,
          updated.maxRolloverDays,
          updated.rolloverExpiryMonths,
          updated.statutoryBaseDays,
          updated.maxStatutoryDays
        ]
      );
    } else {
      localStore.policy = { ...updated };
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/notifications", async (req, res) => {
  try {
    if (activeDbType === "postgresql" && pgPool) {
      const result = await pgPool.query('SELECT * FROM notifications ORDER BY "createdAt" DESC');
      const list = result.rows.map((row) => ({
        id: row.id,
        staffId: row.staffId,
        title: row.title,
        message: row.message,
        type: row.type,
        read: row.read,
        createdAt: row.createdAt
      }));
      return res.json(list);
    }
    res.json(localStore.notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put("/api/notifications/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    if (activeDbType === "postgresql" && pgPool) {
      await pgPool.query("UPDATE notifications SET read = TRUE WHERE id = $1", [id]);
    } else {
      localStore.notifications = localStore.notifications.map((n) => n.id === id ? { ...n, read: true } : n);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
async function startServer() {
  await ensureDbConnected();
  if (!isVercelRuntime && process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F680} Nursery Attendance Server running on http://0.0.0.0:${PORT}`);
  });
}
if (!process.env.VERCEL) {
  startServer();
}
var server_default = app;
//# sourceMappingURL=server.cjs.map
