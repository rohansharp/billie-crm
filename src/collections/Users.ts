import type { CollectionConfig, Access } from 'payload/types'
import type { User } from '../payload-types'

const canReadUsers: Access<any, User> = ({ req, id }) => {
  if (req.user?.role === 'admin') {
    return true
  }
  return req.user?.id === id
}

const canUpdateUsers: Access<any, User> = ({ req, id }) => {
  if (req.user?.role === 'admin') {
    return true
  }
  return req.user?.id === id
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
      options: ['admin', 'supervisor'],
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
