import type { CollectionConfig, Access } from 'payload'

const canReadUsers: Access = ({ req, id }) => {
  if ((req.user as any)?.role === 'admin') {
    return true
  }
  return (req.user as any)?.id === id
}

const canUpdateUsers: Access = ({ req, id }) => {
  if ((req.user as any)?.role === 'admin') {
    return true
  }
  return (req.user as any)?.id === id
}

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    group: 'Administration',
  },
  auth: true,
  access: {
    read: canReadUsers,
    create: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
    update: canUpdateUsers,
    delete: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Supervisor', value: 'supervisor' },
        { label: 'Operations', value: 'operations' },
        { label: 'Read Only', value: 'readonly' },
      ],
      defaultValue: 'supervisor',
      required: true,
    },
    {
      name: 'firstName',
      type: 'text',
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
