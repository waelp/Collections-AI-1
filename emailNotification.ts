/**
 * Email Notification Service
 * Sends email notifications when user credentials are changed
 */

const NOTIFICATION_EMAIL = 'waelpg@gmail.com';

export interface CredentialChangeNotification {
  oldEmail?: string;
  newEmail: string;
  newPassword: string;
  changedBy: string;
  timestamp: Date;
}

/**
 * Send credential change notification email
 * Note: This is a client-side placeholder. In production, this should be handled server-side.
 * For now, it logs the notification details and shows instructions to the admin.
 */
export async function sendCredentialChangeNotification(
  notification: CredentialChangeNotification
): Promise<boolean> {
  try {
    // In a production environment, this would call a backend API endpoint
    // that uses the Gmail MCP server to send the email
    
    const emailContent = `
تنبيه: تم تغيير بيانات تسجيل الدخول
Security Alert: Login Credentials Changed

تفاصيل التغيير / Change Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${notification.oldEmail ? `البريد الإلكتروني السابق / Previous Email: ${notification.oldEmail}` : ''}
البريد الإلكتروني الجديد / New Email: ${notification.newEmail}
كلمة المرور الجديدة / New Password: ${notification.newPassword}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

تم التغيير بواسطة / Changed by: ${notification.changedBy}
التاريخ والوقت / Timestamp: ${notification.timestamp.toLocaleString('ar-SA')}

إذا لم تقم بهذا التغيير، يرجى التواصل مع مسؤول النظام فوراً.
If you did not make this change, please contact the system administrator immediately.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Collections AI Dashboard
Designed & Developed by Wael Allam
© 2025 All Rights Reserved
    `.trim();

    console.log('='.repeat(80));
    console.log('📧 CREDENTIAL CHANGE NOTIFICATION');
    console.log('='.repeat(80));
    console.log(`To: ${NOTIFICATION_EMAIL}`);
    console.log(`Subject: تنبيه أمني: تغيير بيانات الدخول | Security Alert: Credentials Changed`);
    console.log('-'.repeat(80));
    console.log(emailContent);
    console.log('='.repeat(80));
    
    // Store notification in localStorage for admin review
    const notifications = JSON.parse(localStorage.getItem('credentialChangeNotifications') || '[]');
    notifications.push({
      ...notification,
      timestamp: notification.timestamp.toISOString(),
      sent: false,
      emailContent
    });
    localStorage.setItem('credentialChangeNotifications', JSON.stringify(notifications));
    
    // In production, uncomment this and implement the backend endpoint:
    /*
    const response = await fetch('/api/send-credential-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: NOTIFICATION_EMAIL,
        subject: 'تنبيه أمني: تغيير بيانات الدخول | Security Alert: Credentials Changed',
        content: emailContent
      })
    });
    
    return response.ok;
    */
    
    return true;
  } catch (error) {
    console.error('Failed to send credential change notification:', error);
    return false;
  }
}

/**
 * Get pending credential change notifications
 */
export function getPendingNotifications(): CredentialChangeNotification[] {
  try {
    const notifications = JSON.parse(localStorage.getItem('credentialChangeNotifications') || '[]');
    return notifications.filter((n: any) => !n.sent);
  } catch (error) {
    console.error('Failed to load notifications:', error);
    return [];
  }
}

/**
 * Mark notification as sent
 */
export function markNotificationAsSent(timestamp: string): void {
  try {
    const notifications = JSON.parse(localStorage.getItem('credentialChangeNotifications') || '[]');
    const updated = notifications.map((n: any) => 
      n.timestamp === timestamp ? { ...n, sent: true } : n
    );
    localStorage.setItem('credentialChangeNotifications', JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to mark notification as sent:', error);
  }
}
