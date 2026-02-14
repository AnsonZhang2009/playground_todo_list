// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	modules: [
		'@nuxt/eslint',
		'@nuxt/ui'
	],

	devtools: {
		enabled: true
	},

	css: ['~/assets/css/main.css'],

	compatibilityDate: '2026-02-01',

	eslint: {
		config: {
			stylistic: {
				commaDangle: 'never',
				braceStyle: '1tbs'
			}
		}
	},

	nitro: {
		experimental: {
			database: true
		}
	}
})
