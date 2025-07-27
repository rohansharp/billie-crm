import type { CollectionConfig, Access } from 'payload'

const supervisorOrAdmin: Access = ({ req: { user } }) => {
  if (user?.role === 'admin') {
    return true
  }
  return user?.role === 'supervisor'
}



export const Conversations: CollectionConfig = {
  slug: 'conversations',
  admin: {
    useAsTitle: 'applicationNumber',
    defaultColumns: ['applicationNumber', 'customerId', 'status', 'startedAt'],
    group: 'Supervisor Dashboard',
  },
  access: {
    read: supervisorOrAdmin,
    create: () => false, // Only created via events
    update: () => false, // Only updated via events
    delete: () => false,
  },
  fields: [
    {
      name: 'conversationId',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'applicationNumber',
      type: 'text',
      required: true,
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'customerId',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'applicationId',
      type: 'relationship',
      relationTo: 'applications',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
        { label: 'Soft End', value: 'soft_end' },
        { label: 'Hard End', value: 'hard_end' },
        { label: 'Approved', value: 'approved' },
        { label: 'Declined', value: 'declined' },
      ],
      defaultValue: 'active',
      index: true,
    },
    {
      name: 'startedAt',
      type: 'date',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'updatedAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'utterances',
      type: 'array',
      label: 'Conversation Messages',
      admin: {
        readOnly: true,
      },
      fields: [
        {
          name: 'username',
          type: 'text',
          admin: {
            description: 'Usually "customer" or "assistant"',
          },
        },
        {
          name: 'utterance',
          type: 'textarea',
          required: true,
        },
        {
          name: 'rationale',
          type: 'textarea',
          admin: {
            description: 'Internal reasoning for assistant responses',
          },
        },
        {
          name: 'createdAt',
          type: 'date',
          required: true,
        },
        {
          name: 'updatedAt',
          type: 'date',
        },
        {
          name: 'answerInputType',
          type: 'text',
          admin: {
            description: 'Frontend input type hint (e.g. address, email)',
          },
        },
        {
          name: 'prevSeq',
          type: 'number',
          admin: {
            description: 'Previous sequence number in conversation',
          },
        },
        {
          name: 'endConversation',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'additionalData',
          type: 'json',
          admin: {
            description: 'Additional data for frontend enrichment',
          },
        },
      ],
    },
    {
      name: 'purpose',
      type: 'text',
      admin: {
        description: 'Conversation purpose from summary',
        readOnly: true,
      },
    },
    {
      name: 'facts',
      type: 'array',
      admin: {
        description: 'Key facts from conversation summary',
        readOnly: true,
      },
      fields: [
        {
          name: 'fact',
          type: 'text',
        },
      ],
    },
    {
      name: 'version',
      type: 'number',
      defaultValue: 1,
      admin: {
        readOnly: true,
      },
    },
  ],

} 