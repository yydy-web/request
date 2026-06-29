import * as path from 'node:path'
import { defineConfig } from 'rspress/config'

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  // Deployed as a GitHub Pages project site at https://yydy-web.github.io/request/
  base: '/request/',
  lang: 'en',
  title: '@yy-web/request',
  description: 'A flexible, plugin-based, chainable request wrapper',
  logoText: '@yy-web/request',
  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/yydy-web/request',
      },
    ],
    locales: [
      {
        lang: 'en',
        label: 'English',
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
      {
        lang: 'zh',
        label: '简体中文',
        nav: [
          { text: '指南', link: '/zh/guide/getting-started' },
          { text: '使用', link: '/zh/guide/usage' },
          { text: 'Fetch', link: '/zh/guide/fetch' },
          { text: '工具', link: '/zh/guide/tools' },
          { text: 'API', link: '/zh/api/' },
        ],
        sidebar: {
          '/zh/guide/': [
            {
              text: '指南',
              items: [
                { text: '快速开始', link: '/zh/guide/getting-started' },
                { text: '使用', link: '/zh/guide/usage' },
                { text: '原生 fetch 客户端', link: '/zh/guide/fetch' },
                { text: '请求工具', link: '/zh/guide/tools' },
              ],
            },
          ],
          '/zh/api/': [
            {
              text: 'API 参考',
              items: [
                { text: 'IRequest', link: '/zh/api/' },
              ],
            },
          ],
        },
        footer: {
          message: '基于 MIT 许可证发布。',
        },
      },
    ],
  },
})
