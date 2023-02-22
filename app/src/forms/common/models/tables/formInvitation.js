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
    const FormInvitationRole = require('./formInvitationRole');
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
      formInvitationRoles: {
        relation: Model.HasManyRelation,
        modelClass: FormInvitationRole,
        join: {
          from: 'form_invitation.id',
          to: 'form_invitation_role.invitationId'
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
      required: ['formId', 'identityProvider'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        formId: { type: 'string', pattern: Regex.UUID },
        identityProvider: { type: 'string', maxLength: 255 },
        ...stamps
      },
      additionalProperties: false
    };
  }

}

module.exports = FormInvitation;
