import * as path from 'node:path'
import { defineConfig } from 'rspress/config'

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  base: '/',
  title: '@yy-web/request',
  description: 'A flexible, plugin-based, chainable axios request wrapper',
  logoText: '@yy-web/request',
  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/yydy-web/request',
      },
    ],
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Usage', link: '/guide/usage' },
      { text: 'Fetch', link: '/guide/fetch' },
      { text: 'Tools', link: '/guide/tools' },
      { text: 'API', link: '/api/' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Usage', link: '/guide/usage' },
            { text: 'Native fetch client', link: '/guide/fetch' },
            { text: 'Request tools', link: '/guide/tools' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'IRequest', link: '/api/' },
          ],
        },
      ],
    },
    footer: {
      message: 'Released under the MIT License.',
    },
  },
})
