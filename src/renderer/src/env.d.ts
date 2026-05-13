/// <reference types="vite/client" />

import type { ElectronApi } from '../../../shared/git'

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  // eslint-disable-next-line ts/no-empty-object-type
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  electronAPI: ElectronApi
}
