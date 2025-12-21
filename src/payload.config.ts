// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Customers } from './collections/Customers'
import { Conversations } from './collections/Conversations'
import { Applications } from './collections/Applications'
import { LoanAccounts } from './collections/LoanAccounts'
import { WriteOffRequests } from './collections/WriteOffRequests'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      providers: ['@/providers'],
      // Custom navigation items (Story 6.1)
      beforeNavLinks: [
        '@/components/navigation/NavSearchTrigger#NavSearchTrigger',
        '@/components/navigation/NavDashboardLink#NavDashboardLink',
        '@/components/navigation/NavApprovalsLink#NavApprovalsLink',
      ],
      afterNavLinks: ['@/components/navigation/NavSystemStatus#NavSystemStatus'],
      // Settings menu additions (Story 6.6)
      settingsMenu: ['@/components/navigation/NavSettingsMenu#NavSettingsMenu'],
    },
  },
  collections: [Users, Media, Customers, Conversations, Applications, LoanAccounts, WriteOffRequests],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
  ],
})
