import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Playwright specs run with `npm run qa:a11y`, not with Jest.
  testPathIgnorePatterns: ['<rootDir>/e2e/'],
}

export default createJestConfig(config)
