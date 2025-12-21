import type { CollectionConfig } from 'payload'
import { hideFromNonAdmins } from '@/lib/access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    // Hide from sidebar for non-admins (Story 6.7)
    hidden: hideFromNonAdmins,
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: true,
}
