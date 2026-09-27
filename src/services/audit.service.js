const {
  getAuditLogsByUserId
} = require("../repositories/audit.repository");

const getUserAuditLogs = async (
  userId,
  limit,
  offset,
  action,
  entityType
) => {

  return await getAuditLogsByUserId(
    userId,
    limit,
    offset,
    action,
    entityType
  );
};

module.exports = {
  getUserAuditLogs
};