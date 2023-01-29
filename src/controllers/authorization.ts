import jwt from 'jsonwebtoken'
import config from '../config'
import userModel from '../models/user'

export default function(loginRequired: boolean) {
	if (typeof loginRequired === 'undefined') {loginRequired = false}
	return function(req, res, next) {
		const token = req.cookies.token || req.body.token || req.query.token || req.headers['x-access-token']

		if (token) {
			jwt.verify(token, config.secret, function(err, decoded) {
				if (err) {
					if (loginRequired) return res.render('./mod/login.pug', { user: {}, error: 'Sesja wygasła' })
					return next()
				}

				userModel.findById(decoded._id, { _id: 1, username: 1, flags: 1 }).then(user => {
					req.user = user
					return next()
				})
			})
		} else if (loginRequired) {
			return res.render('./mod/login.pug', { user: {} })
		}

		return next()
	}
}
