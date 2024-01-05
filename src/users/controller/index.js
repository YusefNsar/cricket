const Bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const config = require('../../../config');
const schemes = require('../models/mongoose');

module.exports.signUp = async (res, parameters) => {
  const {
    password,
    passwordConfirmation,
    email,
    username,
    name,
    lastName,
  } = parameters;

  if (password === passwordConfirmation) {
    const newUser = schemes.User({
      password: Bcrypt.hashSync(password, 10),
      email,
      username,
      name,
      lastName,
    });

    try {
      const savedUser = await newUser.save();

      const token = jwt.sign(
        { email, id: savedUser._id, username },
        config.API_KEY_JWT,
        { expiresIn: config.TOKEN_EXPIRES_IN }
      );

      return res.status(201).json({ token, user: savedUser });
    } catch (error) {
      return res.status(400).json({
        status: 400,
        message: error,
      });
    }
  }

  return res.status(400).json({
    status: 400,
    message: 'Passwords are different, try again!!!',
  });
};

module.exports.login = async (res, parameters) => {
  const { password, username } = parameters;

  const user = await schemes.User.findOne({
    username,
  });

  if (!user || !Bcrypt.compareSync(password, user.password)) {
    return res.status(400).json({
      status: 400,
      message: 'Wrong Username or Password.',
    });
  }

  const token = jwt.sign(
    { email: user.email, id: user._id, username },
    config.API_KEY_JWT,
    { expiresIn: config.TOKEN_EXPIRES_IN }
  );

  return res.status(200).json({ token, user });
};

module.exports.tokenLogin = async (res, parameters) => {
  const { token } = parameters;

  if (!token) {
    return res.status(400).json({
      status: 400,
      message: 'No token.',
    });
  }

  const { id } = jwt.verify(token, config.API_KEY_JWT, {
    ignoreExpiration: true,
  });

  const user = await schemes.User.findOne({
    _id: id,
  });

  if (!user) {
    return res.status(400).json({
      status: 400,
      message: 'Invalid token.',
    });
  }

  const newToken = jwt.sign(
    { email: user.email, id: user.id, username: user.username },
    config.API_KEY_JWT,
    { expiresIn: config.TOKEN_EXPIRES_IN }
  );

  return res.status(200).json({ token: newToken, user });
};
