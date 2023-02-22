const stamps = require('../stamps');

exports.up = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.createTable('form_invitation',table=>{
      table.uuid('id').primary();
      table.uuid('formId').references('id').inTable('form').notNullable().index();
      table.string('identityProvider').references('code').inTable('identity_provider').notNullable();
      stamps(knex, table);
    }))
    .then(() => knex.schema.createTable('form_invitation_role',table=>{
      table.uuid('id').primary();
      table.uuid('invitationId').references('id').inTable('form_invitation').notNullable().index();
      table.string('role').references('code').inTable('role').notNullable().index();
      stamps(knex, table);
    }));
};


exports.down = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.dropTableIfExists('form_invitation_role'))
    .then(() => knex.schema.dropTableIfExists('form_invitation'));
};
