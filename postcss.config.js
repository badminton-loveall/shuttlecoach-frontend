import tailwindcss from '@tailwindcss/postcss'
import themeMedia from './postcss-theme-media.js'

export default {
  plugins: [
    tailwindcss(),
    // Make prefers-color-scheme blocks honour the in-app Light/Dark/System choice
    themeMedia(),
  ],
}
