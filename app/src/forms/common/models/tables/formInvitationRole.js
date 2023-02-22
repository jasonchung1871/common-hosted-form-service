const { Model } = require('objection');
const { Timestamps } = require('../mixins');
const { Regex } = require('../../constants');
const stamps = require('../jsonSchema').stamps;

class FormInvitationRole extends Timestamps(Model) {
  static get tableName() {
    return 'form_invitation_role';
  }

  static get relationMappings() {
    const FormInvitation = require('./formInvitation');
    const Role = require('./role');

    return {
      form: {
        relation: Model.HasOneRelation,
        modelClass: FormInvitation,
        join: {
          from: 'form_invitation_role.invitationId',
          to: 'form_invitation.id'
        }
      },
      userRole: {
        relation: Model.HasOneRelation,
        modelClass: Role,
        join: {
          from: 'form_invitation_role.role',
          to: 'role.code'
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
      orderDescending(builder) {
        builder.orderBy('createdAt', 'desc');
      }
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['invitationId', 'role'],
      properties: {
        id: { type: 'string', pattern: Regex.UUID },
        invitationId: { type: 'string', pattern: Regex.UUID },
        role: { type: 'string', minLength: 1, maxLength: 255 },
        ...stamps
      },
      additionalProperties: false
    };
  }

}

module.exports = FormInvitationRole;
