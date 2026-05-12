import { ElectronAPI } from '@electron-toolkit/preload'
import type { ElectronApi } from '../shared/git'

declare global {
  interface Window {
    electron: ElectronAPI
    api: ElectronApi
  }
}
