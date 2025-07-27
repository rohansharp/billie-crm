import type { CollectionConfig, Access, CollectionAfterChangeHook } from 'payload'
import { User, Conversation } from '../payload-types'

const supervisorOrAdmin: Access = ({ req: { user } }) => {
  if (user?.role === 'admin') {
    return true
  }
  return user?.role === 'supervisor'
}

const triggerRealTimeUpdateHook: CollectionAfterChangeHook = async ({
  doc,
  operation,
}) => {
  // Trigger real-time updates to connected clients
  // await triggerRealTimeUpdate('conversation', doc);
}

export const Conversations: CollectionConfig = {
  slug: 'conversations',
  admin: {
    useAsTitle: 'applicationNumber',
    defaultColumns: ['applicationNumber', 'conversationId', 'status', 'startTime'],
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
      name: 'applicationNumber',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'conversationId',
      type: 'text',
      required: false,
      unique: true,
      admin: {
        description: 'Unique identifier from the chat system',
      },
    },
    {
      name: 'customerId',
      type: 'relationship',
      relationTo: 'customers',
      required: false, // Allow null initially, will be populated when customer data is available
    },
    {
      name: 'status',
      type: 'select',
      options: ['active', 'paused', 'soft_end', 'hard_end', 'approved', 'declined'],
      defaultValue: 'active',
    },
    {
      name: 'startTime',
      type: 'date',
      required: false, // Allow null initially, will be set when conversation starts
    },
    {
      name: 'lastUtteranceTime',
      type: 'date',
    },
    {
      name: 'messages',
      type: 'array',
      fields: [
        {
          name: 'sender',
          type: 'select',
          options: ['customer', 'assistant'],
          required: true,
        },
        {
          name: 'utterance',
          type: 'textarea',
          required: true,
        },
        {
          name: 'timestamp',
          type: 'date',
          required: true,
        },
      ],
    },
    {
      name: 'assessments',
      type: 'group',
      fields: [
        {
          name: 'identityRisk',
          type: 'json',
        },
        {
          name: 'serviceability',
          type: 'json',
        },
        {
          name: 'fraudCheck',
          type: 'json',
        },
      ],
    },
    {
      name: 'noticeboard',
      type: 'array',
      fields: [
        {
          name: 'agentName',
          type: 'text',
          required: true,
        },
        {
          name: 'content',
          type: 'textarea',
          required: true,
        },
        {
          name: 'timestamp',
          type: 'date',
          required: true,
        },
        {
          name: 'versions',
          type: 'array',
          fields: [
            {
              name: 'content',
              type: 'textarea',
            },
            {
              name: 'timestamp',
              type: 'date',
            },
          ],
        },
      ],
    },
    {
      name: 'finalDecision',
      type: 'select',
      options: ['APPROVED', 'DECLINED'],
    },
    {
      name: 'version',
      type: 'number',
      defaultValue: 1,
    },
  ],
  hooks: {
    afterChange: [triggerRealTimeUpdateHook],
  },
} 