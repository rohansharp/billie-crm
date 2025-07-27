import type { CollectionConfig, Access } from 'payload'

const supervisorOrAdmin: Access = ({ req: { user } }) => {
  if (user?.role === 'admin') {
    return true
  }
  return user?.role === 'supervisor'
}

export const Applications: CollectionConfig = {
  slug: 'applications',
  admin: {
    useAsTitle: 'applicationNumber',
    defaultColumns: ['applicationNumber', 'customerId', 'loanAmount', 'applicationOutcome', 'updatedAt'],
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
      name: 'loanPurpose',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'loanAmount',
      type: 'number',
      admin: {
        readOnly: true,
        step: 0.01,
      },
    },
    {
      name: 'loanFee',
      type: 'number',
      admin: {
        readOnly: true,
        step: 0.01,
        description: 'Calculated at 5% of loan amount',
      },
    },
    {
      name: 'loanTotalPayable',
      type: 'number',
      admin: {
        readOnly: true,
        step: 0.01,
        description: 'Loan amount + fee',
      },
    },
    {
      name: 'loanTerm',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Loan term in days/months',
      },
    },
    {
      name: 'customerAttestationAcceptance',
      type: 'checkbox',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'statementCaptureConsentProvided',
      type: 'checkbox',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'statementCaptureCompleted',
      type: 'checkbox',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'productOfferAcceptance',
      type: 'checkbox',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'applicationOutcome',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Declined', value: 'declined' },
        { label: 'Withdrawn', value: 'withdrawn' },
      ],
      admin: {
        readOnly: true,
      },
      index: true,
    },
    {
      name: 'applicationProcess',
      type: 'group',
      admin: {
        readOnly: true,
      },
      fields: [
        {
          name: 'currentProcessStage',
          type: 'text',
          admin: {
            description: 'Current stage in the application process',
          },
        },
        {
          name: 'currentProcessStep',
          type: 'text',
          admin: {
            description: 'Current step within the stage',
          },
        },
        {
          name: 'startedAt',
          type: 'date',
        },
        {
          name: 'updatedAt',
          type: 'date',
        },
        {
          name: 'applicationProcessState',
          type: 'array',
          label: 'Process Stages',
          fields: [
            {
              name: 'stageName',
              type: 'text',
              required: true,
            },
            {
              name: 'complete',
              type: 'checkbox',
              defaultValue: false,
            },
            {
              name: 'prompt',
              type: 'textarea',
            },
            {
              name: 'steps',
              type: 'array',
              fields: [
                {
                  name: 'stepName',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'description',
                  type: 'textarea',
                },
                {
                  name: 'complete',
                  type: 'checkbox',
                  defaultValue: false,
                },
                {
                  name: 'type',
                  type: 'select',
                  options: [
                    { label: 'LLM', value: 'llm' },
                    { label: 'Business Logic', value: 'business_logic' },
                    { label: 'User Input', value: 'user_input' },
                  ],
                  defaultValue: 'llm',
                },
                {
                  name: 'completionEventName',
                  type: 'text',
                },
                {
                  name: 'answerInputType',
                  type: 'text',
                  admin: {
                    description: 'Frontend input type hint',
                  },
                },
                {
                  name: 'prompts',
                  type: 'group',
                  fields: [
                    {
                      name: 'main',
                      type: 'textarea',
                    },
                    {
                      name: 'completenessCheck',
                      type: 'textarea',
                    },
                    {
                      name: 'confirmation',
                      type: 'textarea',
                    },
                    {
                      name: 'outputJson',
                      type: 'textarea',
                    },
                    {
                      name: 'mappingOut',
                      type: 'json',
                    },
                  ],
                },
                {
                  name: 'businessLogic',
                  type: 'group',
                  fields: [
                    {
                      name: 'moduleName',
                      type: 'text',
                    },
                    {
                      name: 'methodName',
                      type: 'text',
                    },
                    {
                      name: 'mappingIn',
                      type: 'json',
                    },
                    {
                      name: 'mappingOut',
                      type: 'json',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: 'conversation',
          type: 'array',
          label: 'Process Conversation Log',
          fields: [
            {
              name: 'role',
              type: 'select',
              options: [
                { label: 'User', value: 'user' },
                { label: 'Assistant', value: 'assistant' },
                { label: 'System', value: 'system' },
              ],
            },
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
      name: 'assessments',
      type: 'group',
      admin: {
        readOnly: true,
        description: 'Risk and serviceability assessments',
      },
      fields: [
        {
          name: 'identityRisk',
          type: 'json',
          admin: {
            description: 'Identity risk assessment results',
          },
        },
        {
          name: 'serviceability',
          type: 'json',
          admin: {
            description: 'Serviceability assessment results',
          },
        },
        {
          name: 'fraudCheck',
          type: 'json',
          admin: {
            description: 'Fraud check results',
          },
        },
      ],
    },
    {
      name: 'noticeboard',
      type: 'array',
      admin: {
        readOnly: true,
        description: 'Agent notes and updates',
      },
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
      name: 'conversations',
      type: 'relationship',
      relationTo: 'conversations',
      hasMany: true,
      admin: {
        readOnly: true,
      },
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