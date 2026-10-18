import { render, screen } from '@testing-library/react'
import RegisterPage from './page'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))
jest.mock('../../../lib/supabase/client', () => ({
  createClient: () => ({ auth: { signUp: jest.fn(), getUser: jest.fn() } }),
}))
jest.mock('../../../components/GoogleSignIn/GoogleSignIn', () => ({ __esModule: true, default: () => null }))

describe('register', () => {
  it('labels every field so it can be found by its label', () => {
    render(<RegisterPage />)
    expect(screen.getByLabelText('Full name')).toHaveAttribute('autocomplete', 'name')
    expect(screen.getByLabelText('Email address')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'new-password')
  })
})
