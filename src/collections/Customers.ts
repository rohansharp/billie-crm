import type { CollectionConfig, Access } from 'payload'
import type { User, Customer } from '../payload-types'

const supervisorOrAdmin: Access = ({ req: { user } }) => {
  if (user?.role === 'admin') {
    return true
  }
  return user?.role === 'supervisor'
}

export const Customers: CollectionConfig = {
  slug: 'customers',
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'email', 'customerId'],
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
      name: 'customerId',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'Mr, Mrs, Ms, Dr, etc.',
        readOnly: true,
      },
    },
    {
      name: 'preferredName',
      type: 'text',
      admin: {
        description: 'Name customer prefers to be called',
        readOnly: true,
      },
    },
    {
      name: 'firstName',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'middleName',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'lastName',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'fullName',
      type: 'text',
      hooks: {
        beforeChange: [
          ({ data }) => {
            if (!data) return '';
            // Construct full name from parts
            const parts = [data.firstName, data.middleName, data.lastName].filter(Boolean);
            return parts.join(' ') || data.preferredName || '';
          },
        ],
      },
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'emailAddress',
      type: 'email',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'mobilePhoneNumber',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'dateOfBirth',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'd MMM yyyy',
        },
        readOnly: true,
      },
    },
    {
      name: 'residentialAddress',
      type: 'group',
      admin: {
        readOnly: true,
      },
      fields: [
        {
          name: 'street',
          type: 'text',
        },
        {
          name: 'city',
          type: 'text',
        },
        {
          name: 'state',
          type: 'text',
        },
        {
          name: 'postcode',
          type: 'text',
        },
        {
          name: 'country',
          type: 'text',
          defaultValue: 'Australia',
        },
      ],
    },
    {
      name: 'mailingAddress',
      type: 'group',
      admin: {
        readOnly: true,
        description: 'Address for mail delivery (e.g., cards)',
      },
      fields: [
        {
          name: 'street',
          type: 'text',
        },
        {
          name: 'city',
          type: 'text',
        },
        {
          name: 'state',
          type: 'text',
        },
        {
          name: 'postcode',
          type: 'text',
        },
        {
          name: 'country',
          type: 'text',
          defaultValue: 'Australia',
        },
      ],
    },
    {
      name: 'staffFlag',
      type: 'checkbox',
      admin: {
        description: 'Indicates if customer is a staff member',
        readOnly: true,
      },
    },
    {
      name: 'investorFlag',
      type: 'checkbox',
      admin: {
        description: 'Indicates if customer is an investor',
        readOnly: true,
      },
    },
    {
      name: 'founderFlag',
      type: 'checkbox',
      admin: {
        description: 'Indicates if customer is a founder',
        readOnly: true,
      },
    },
    {
      name: 'ekycEntityId',
      type: 'text',
      admin: {
        description: 'eKYC identifier from Frankie',
        readOnly: true,
      },
    },
    {
      name: 'ekycStatus',
      type: 'select',
      options: [
        { label: 'Successful', value: 'successful' },
        { label: 'Failed', value: 'failed' },
        { label: 'Pending', value: 'pending' },
      ],
      admin: {
        description: 'Status of eKYC attempt',
        readOnly: true,
      },
    },
    {
      name: 'individualStatus',
      type: 'select',
      options: [
        { label: 'Living', value: 'LIVING' },
        { label: 'Deceased', value: 'DECEASED' },
        { label: 'Missing', value: 'MISSING' },
      ],
      admin: {
        description: 'Lifecycle status of the individual',
        readOnly: true,
      },
    },
    {
      name: 'identityDocuments',
      type: 'array',
      admin: {
        readOnly: true,
      },
      fields: [
        {
          name: 'documentType',
          type: 'select',
          options: [
            { label: 'Drivers Licence', value: 'DRIVERS_LICENCE' },
            { label: 'Passport', value: 'PASSPORT' },
            { label: 'Medicare', value: 'MEDICARE' },
          ],
          required: true,
        },
        {
          name: 'documentSubtype',
          type: 'text',
          admin: {
            description: 'e.g., Medicare Card Colour',
          },
        },
        {
          name: 'documentNumber',
          type: 'text',
          required: true,
        },
        {
          name: 'expiryDate',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayOnly',
            },
          },
        },
        {
          name: 'stateOfIssue',
          type: 'text',
        },
        {
          name: 'countryOfIssue',
          type: 'text',
          defaultValue: 'Australia',
        },
        {
          name: 'additionalInfo',
          type: 'json',
          admin: {
            description: 'Additional document information as key-value pairs',
          },
        },
      ],
    },
    {
      name: 'applications',
      type: 'relationship',
      relationTo: 'applications',
      hasMany: true,
      admin: {
        readOnly: true,
      },
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
  ],
} 