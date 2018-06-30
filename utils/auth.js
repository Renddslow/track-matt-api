'use strict';

module.exports = async (req, res, next) => {
  const auth = req.get('Authorization');

  if (!auth) {
    res.statusCode = 404;
    res.json({ message: 'Not Found' });
  }

  const token = auth.replace('Bearer ', '');

  if (token !== process.env.TOKEN) {
    res.statusCode = 401;
    res.json({ message: 'Token is invalid or has expired' });
  }

  next();
};