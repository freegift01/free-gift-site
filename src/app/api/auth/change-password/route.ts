import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthFromCookie, validateAdminCredentials } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return Response.json({ error: 'Current and new passwords are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return Response.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
    }

    // Verify current password
    const adminRecord = await prisma.adminAuth.findUnique({
      where: { username: auth.username }
    });

    let isValid = false;
    if (adminRecord) {
      isValid = await bcrypt.compare(currentPassword, adminRecord.passwordHash);
    } else {
      isValid = validateAdminCredentials(auth.username, currentPassword);
    }

    if (!isValid) {
      return Response.json({ error: 'Incorrect current password' }, { status: 400 });
    }

    // Hash new password and save
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.adminAuth.upsert({
      where: { username: auth.username },
      update: { passwordHash },
      create: { username: auth.username, passwordHash }
    });

    return Response.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
