// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
    {
        rules: {
            'indent': ['error', 'tab'],
            'no-tabs': 'off',
            '@typescript-eslint/indent': ['error', 'tab'],
            '@stylistic/indent': ['error', 'tab'],
        },
    },
)
