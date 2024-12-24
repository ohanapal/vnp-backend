const { getRoleByName } = require('./roleUtils');

const getPermissionsByRoleName = (roleName) => {
  const role = getRoleByName(roleName);
  return role ? role.permissions : [];
};

module.exports = {
  getPermissionsByRoleName,
};
