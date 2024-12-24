const roles = require('../config/roles.json');

const getRoleByName = (name) => {
  return roles.roles.find((role) => role.name === name);
};

const getAllRoles = () => {
  return roles.roles;
};

module.exports = {
  getRoleByName,
  getAllRoles,
};
