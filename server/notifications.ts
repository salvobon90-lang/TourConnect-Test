import { storage } from './storage';

let webSocketServerInstance: any = null;

export function setWebSocketServer(wss: any) {
  webSocketServerInstance = wss;
}

export async function sendNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
}) {
  const notification = await storage.createNotification(params);

  if (webSocketServerInstance) {
    webSocketServerInstance.sendToUser(params.userId, {
      type: 'notification',
      notification
    });
  }

  return notification;
}
