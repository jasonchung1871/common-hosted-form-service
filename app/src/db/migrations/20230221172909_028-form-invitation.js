const stamps = require('../stamps');

exports.up = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.createTable('form_invitation',table=>{
      table.uuid('id').primary();
      table.string('code').notNullable().unique().index();
      table.uuid('formId').references('id').inTable('form').notNullable().index();
      table.string('role').references('code').inTable('role').notNullable().index();
      table.string('identityProvider').references('code').inTable('identity_provider').notNullable();
      stamps(knex, table);
    }));
};


exports.down = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.dropTableIfExists('form_invitation'));
};
