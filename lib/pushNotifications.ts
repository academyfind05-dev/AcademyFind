import { prisma } from '@/lib/prisma';

// Expo Push Notification Helper
export async function sendExpoPushNotification({
  pushToken,
  title,
  body,
  data = {},
  channelId = 'default',
}: {
  pushToken: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  channelId?: string;
}) {
  if (!pushToken || !pushToken.startsWith('ExponentPushToken[')) {
    console.warn('⚠️ Invalid Expo push token:', pushToken);
    return false;
  }

  try {
    const message = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
      channelId,
      _displayInForeground: true,
    };

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await res.json();
    console.log('🚀 [EXPO PUSH SENT]', result);
    return true;
  } catch (error) {
    console.error('❌ Push Notification Error:', error);
    return false;
  }
}

/**
 * Send live push notification directly to all Admin users on their mobile app
 */
export async function notifyAdminsPush({
  title,
  body,
  data = {},
}: {
  title: string;
  body: string;
  data?: Record<string, any>;
}) {
  try {
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN', pushToken: { not: null } },
      select: { pushToken: true }
    });

    for (const admin of adminUsers) {
      if (admin.pushToken) {
        sendExpoPushNotification({
          pushToken: admin.pushToken,
          title,
          body,
          data
        }).catch(err => console.error("Admin Push send error:", err));
      }
    }
  } catch (error) {
    console.error("notifyAdminsPush error:", error);
  }
}

/**
 * Send live push notification directly to a specific user/sales manager on their mobile app
 */
export async function notifyUserPush({
  userId,
  title,
  body,
  data = {},
}: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushToken: true }
    });

    if (user?.pushToken) {
      await sendExpoPushNotification({
        pushToken: user.pushToken,
        title,
        body,
        data,
      });
    }
  } catch (error) {
    console.error("notifyUserPush error:", error);
  }
}
