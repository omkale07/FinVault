const {
  getUserAuditLogs
} = require("../services/audit.service");

const getAuditLogsController = async (req, res) => {

  try {

    const userId = Number(req.user.sub);

    const limit = Math.min(
      Number(req.query.limit) || 20,
      100
    );

    const page = Math.max(
      Number(req.query.page) || 1,
      1
    );

    const offset = (page - 1) * limit;

    const action = req.query.action || null;
    const entityType = req.query.entity_type || null;

    const logs = await getUserAuditLogs(
      userId,
      limit,
      offset,
      action,
      entityType
    );

    return res.status(200).json({
      success: true,
      page,
      limit,
      count: logs.length,
      auditLogs: logs
    });

  } catch (error) {

    console.error("Get audit logs error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs"
    });
  }
};


module.exports = {
  getAuditLogsController
};