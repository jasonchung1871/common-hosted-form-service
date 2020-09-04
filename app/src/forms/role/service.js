const { Role } = require('../common/models');

const {transaction} = require('objection');
const {v4: uuidv4} = require('uuid');

const service = {

  list: async () => {
    return Role.query()
      .allowGraph('[permissions]')
      .withGraphFetched('permissions(orderDefault)')
      .modify('orderDefault');
  },

  create: async (data, currentUser) => {
    let trx;
    try {
      trx = await transaction.start(Role.knex());

      // TODO: validate role code is unique
      data.createdBy = currentUser.username;

      await Role.query(trx).insert(data);
      await trx.commit();
      const result = await service.read(data.code);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  read: async (code) => {
    return Role.query()
      .findById(code)
      .allowGraph('[permissions]')
      .withGraphFetched('permissions(orderNameAscending)')
      .throwIfNotFound();
  },

  update: async (code, data, currentUser) => {
    let trx;
    try {
      const obj = await service.read(code);
      await transaction(Role.knex(), async (trx) => {
        if (obj.display !== data.display || obj.description != data.description || obj.active != data.active) {
          // update name/description...
          await Role.query().patchAndFetchById(obj.code, {display: data.display, description: data.description, active: data.active, updatedBy: currentUser.username});
        }
        // clean out existing permissions...
        await trx.raw(`delete from role_permission where "role" = '${obj.code}'`);
        // set to specified permissions...
        for (const p of data.permissions) {
          await trx.raw(`insert into role_permission (id, "role", "permission", "createdBy") values ('${uuidv4()}', '${obj.code}', '${p.code}', '${currentUser.username}');`);
        }
      });
      const result = await service.read(obj.code);
      return result;
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  }

};

module.exports = service;
