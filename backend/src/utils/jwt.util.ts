import jwt from 'jsonwebtoken';
import { IUser } from '../models/User.model';

export const generateToken = (user: IUser): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET is not defined');

  return jwt.sign(
    { id: user._id.toString() },
    jwtSecret,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
  );
};

export const sendTokenResponse = (user: IUser, statusCode: number, res: import('express').Response): void => {
  const token = generateToken(user);

  const userObj = user.toJSON();

  res.status(statusCode).json({
    success: true,
    token,
    user: userObj,
  });
};
