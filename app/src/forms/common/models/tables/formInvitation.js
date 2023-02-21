const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormInvitation extends Timestamps(Model) {
  static get tableName() {
    return 'form_invitation';
  }

  static get relationMappings() {
    const Form = require('./form');
    const Role = require('./role');
    const IdentityProvider = require('./identityProvider');

    return {
      form: {
        relation: Model.HasOneRelation,
        modelClass: Form,
        join: {
          from: 'form_invitation.formId',
          to: 'form.id'
        }
      },
      userRole: {
        relation: Model.HasOneRelation,
        modelClass: Role,
        join: {
          from: 'form_invitation.role',
          to: 'role.code'
        }
      },
      identityProviders: {
        relation: Model.HasOneRelation,
        modelClass: IdentityProvider,
        join: {
          from: 'form_invitation.id',
          to: 'identity_provider.code'
        }
      },
    };
  }

  static get modifiers() {
    return {
      filterCreatedBy(query, value) {
        if (value) {
          query.where('createdBy', 'ilike', `%${value}%`);
        }
      },
      filterFormVersionId(query, value) {
        if (value !== undefined) {
          query.where('formVersionId', value);
        }
      },
      orderDescending(builder) {
        builder.orderBy('createdAt', 'desc');
      }
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['formVersionId', 'confirmationId', 'submission'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        code: { type: 'string', pattern: Regex.CONFIRMATION_ID },
        formId: { type: 'string', pattern: Regex.UUID },
        role: { type: 'string', minLength: 1, maxLength: 255 },
        identityProvider: { type: 'string', maxLength: 255 },
        ...stamps
      },
      additionalProperties: false
    };
  }

}

module.exports = FormInvitation;
