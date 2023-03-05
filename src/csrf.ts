import csrf from 'csurf'
import { ClientSyntaxError } from './exceptions/httpExceptions'

export const csrfProtection = csrf({ cookie: true })

export function csrfErrorHander(err, req, res, next) {
    if (err.code === 'EBADCSRFTOKEN') return next(new ClientSyntaxError('Invalid CSRF token'))

    return next(err)
}
