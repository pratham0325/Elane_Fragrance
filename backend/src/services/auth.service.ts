import bcrypt from 'bcryptjs';
import { User } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/token';
import { z } from 'zod';
import { registerSchema, loginSchema } from '../validators/auth.validator';

type RegisterInput = z.infer<typeof registerSchema>;
type LoginInput = z.infer<typeof loginSchema>;

const BCRYPT_ROUNDS = 12;

function buildTokenPair(userId: string, role: string, email: string) {
  const payload = { userId, role: role as 'CUSTOMER' | 'ADMIN', email };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload)
  };
}

export async function register(input: RegisterInput) {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash,
    phone: input.phone
  });

  const { accessToken, refreshToken } = buildTokenPair(
    user._id.toString(),
    user.role,
    user.email
  );

  // Store refresh token hash
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 8);
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  };
}

export async function login(input: LoginInput) {
  const user = await User.findOne({ email: input.email.toLowerCase() }).select('+passwordHash +refreshTokenHash');
  if (!user) throw ApiError.unauthorized('Invalid email or password');
  if (!user.isActive) throw ApiError.unauthorized('Account is inactive');

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized('Invalid email or password');

  const { accessToken, refreshToken } = buildTokenPair(
    user._id.toString(),
    user.role,
    user.email
  );
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 8);
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
  };
}

export async function refresh(incomingRefreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(incomingRefreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const user = await User.findById(payload.userId).select('+refreshTokenHash');
  if (!user || !user.refreshTokenHash) throw ApiError.unauthorized('Session expired');

  const valid = await bcrypt.compare(incomingRefreshToken, user.refreshTokenHash);
  if (!valid) throw ApiError.unauthorized('Refresh token mismatch');

  const { accessToken, refreshToken: newRefresh } = buildTokenPair(
    user._id.toString(),
    user.role,
    user.email
  );
  user.refreshTokenHash = await bcrypt.hash(newRefresh, 8);
  await user.save();

  return { accessToken, refreshToken: newRefresh };
}

export async function logout(userId: string) {
  await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
}

export async function getMe(userId: string) {
  const user = await User.findById(userId).populate('wishlist', 'name slug thumbnail price');
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw ApiError.notFound('User not found');

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw ApiError.badRequest('Current password is incorrect');

  user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await user.save();
}

export async function updateProfile(userId: string, data: { name?: string; phone?: string; avatar?: string }) {
  const user = await User.findByIdAndUpdate(userId, data, { new: true });
  if (!user) throw ApiError.notFound('User not found');
  return user;
}
