import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import unocss from 'unocss/vite'
import components from "unplugin-vue-components/vite";
import iconsResolver from "unplugin-icons/resolver";
import vueDevTools from 'vite-plugin-vue-devtools'
import { NaiveUiResolver } from "unplugin-vue-components/resolvers";

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    server: {
      allowedHosts: ['.monkeycode-ai.online']
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "src/renderer/src"),
      },
    },
    plugins: [
      vue(),
      unocss(),
      components({
        dts: "./src/renderer/src/types/components.d.ts",
        resolvers: [
          NaiveUiResolver(),
          iconsResolver({
            prefix: "i",
            customCollections: ["local"],
          }),
        ],
      }),
      vueDevTools({
        launchEditor: 'webstorm',
      }),
    ],
  },
});
