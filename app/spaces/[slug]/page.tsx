import { redirect } from 'next/navigation'

import { PRODUCT_ENTRY_PATH } from '@/lib/routes/product-entry'

export default function LegacyFilesystemSpaceRedirect() {
  redirect(PRODUCT_ENTRY_PATH)
}
