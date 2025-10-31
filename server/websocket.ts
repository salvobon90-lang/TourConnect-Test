import { WebSocket, WebSocketServer as WSServer } from 'ws';
import { Server, IncomingMessage } from 'http';
import { storage } from './storage';
import type { SelectMessage, SelectConversation } from '@shared/schema';
import cookie from 'cookie';

interface Client {
  ws: WebSocket;
  userId: string;
  isAlive: boolean;
}

type WSMessage = 
  | { type: 'new_message'; message: SelectMessage }
  | { type: 'user_online'; userId: string }
  | { type: 'user_offline'; userId: string }
  | { type: 'typing'; userId: string; conversationId: string }
  | { type: 'stop_typing'; userId: string; conversationId: string }
  | { type: 'message_read'; messageId: string; conversationId: string }
  | { type: 'smart_group_message'; groupId: string; message: any }
  | { type: 'room_joined'; roomId: string }
  | { type: 'room_left'; roomId: string }
  | { type: 'tour_participant_joined'; tourId: string; tourTitle: string; currentParticipants: number; newPrice: number; discount: number }
  | { type: 'tour_status_changed'; tourId: string; status: string }
  | { type: 'error'; message: string };

export class WebSocketServer {
  private wss: WSServer;
  private clients: Map<string, Client>;
  private typingStatus: Map<string, Set<string>>; // conversationId -> Set of userIds typing
  private userRooms: Map<string, Set<string>>; // userId -> Set of roomIds they're in
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private sessionStore: any;

  constructor(server: Server, sessionStore: any) {
    this.sessionStore = sessionStore;
    this.wss = new WSServer({ 
      server, 
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });
    this.clients = new Map();
    this.typingStatus = new Map();
    this.userRooms = new Map();
    
    this.setupWebSocket();
    this.startHeartbeat();
    
    console.log('[WebSocket] Server initialized on path /ws with authentication');
  }

  private async verifyClient(
    info: { origin: string; secure: boolean; req: IncomingMessage },
    callback: (res: boolean, code?: number, message?: string) => void
  ) {
    try {
      const cookies = cookie.parse(info.req.headers.cookie || '');
      const sessionId = cookies['connect.sid'];
      
      if (!sessionId) {
        console.warn('[WebSocket] Connection rejected: No session cookie');
        callback(false, 401, 'Unauthorized: No session');
        return;
      }
      
      const sid = sessionId.startsWith('s:') 
        ? sessionId.slice(2).split('.')[0]
        : sessionId.split('.')[0];
      
      const session = await this.getSession(sid);
      
      if (!session || !session.passport?.user?.claims?.sub) {
        console.warn('[WebSocket] Connection rejected: Invalid or expired session');
        callback(false, 401, 'Unauthorized: Invalid session');
        return;
      }
      
      (info.req as any).userId = session.passport.user.claims.sub;
      console.log(`[WebSocket] Authentication successful for user: ${session.passport.user.claims.sub}`);
      callback(true);
    } catch (error) {
      console.error('[WebSocket] Authentication error:', error);
      callback(false, 500, 'Internal error');
    }
  }

  private getSession(sid: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.sessionStore.get(sid, (err: any, session: any) => {
        if (err) reject(err);
        else resolve(session);
      });
    });
  }

  private setupWebSocket() {
    this.wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
      try {
        const userId = (req as any).userId;

        if (!userId) {
          console.warn('[WebSocket] Connection rejected: userId not found in authenticated request');
          ws.close(1008, 'Unauthorized');
          return;
        }

        const client: Client = {
          ws,
          userId,
          isAlive: true,
        };

        this.clients.set(userId, client);
        
        await storage.setUserOnlineStatus(userId, true);
        
        this.broadcast({
          type: 'user_online',
          userId,
        });

        console.log(`[WebSocket] User ${userId} connected (authenticated). Total clients: ${this.clients.size}`);

        ws.on('pong', () => {
          client.isAlive = true;
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleClientMessage(userId, message);
          } catch (error) {
            console.error('[WebSocket] Invalid message format:', error);
          }
        });

        ws.on('close', async () => {
          this.handleDisconnect(userId);
        });

        ws.on('error', (error) => {
          console.error(`[WebSocket] Error for user ${userId}:`, error);
        });

      } catch (error) {
        console.error('[WebSocket] Connection error:', error);
        ws.close(1011, 'Internal server error');
      }
    });
  }

  private handleClientMessage(userId: string, message: any) {
    switch (message.type) {
      case 'typing':
        if (message.conversationId) {
          this.handleTyping(userId, message.conversationId, true);
        }
        break;
      
      case 'stop_typing':
        if (message.conversationId) {
          this.handleTyping(userId, message.conversationId, false);
        }
        break;
      
      case 'join_room':
        if (message.groupId) {
          this.joinSmartGroupRoom(userId, message.groupId);
        }
        break;
      
      case 'leave_room':
        if (message.groupId) {
          this.leaveSmartGroupRoom(userId, message.groupId);
        }
        break;
      
      default:
        console.warn(`[WebSocket] Unknown message type: ${message.type}`);
    }
  }

  private handleTyping(userId: string, conversationId: string, isTyping: boolean) {
    if (isTyping) {
      if (!this.typingStatus.has(conversationId)) {
        this.typingStatus.set(conversationId, new Set());
      }
      this.typingStatus.get(conversationId)!.add(userId);
    } else {
      const typingUsers = this.typingStatus.get(conversationId);
      if (typingUsers) {
        typingUsers.delete(userId);
        if (typingUsers.size === 0) {
          this.typingStatus.delete(conversationId);
        }
      }
    }

    this.broadcastToConversation(conversationId, {
      type: isTyping ? 'typing' : 'stop_typing',
      userId,
      conversationId,
    });
  }

  private async handleDisconnect(userId: string) {
    this.clients.delete(userId);
    
    this.typingStatus.forEach((typingUsers, conversationId) => {
      if (typingUsers.has(userId)) {
        typingUsers.delete(userId);
        if (typingUsers.size === 0) {
          this.typingStatus.delete(conversationId);
        }
      }
    });

    // Clean up room memberships
    this.userRooms.delete(userId);

    try {
      await storage.setUserOnlineStatus(userId, false);
      await storage.updateLastOnline(userId);
    } catch (error) {
      console.error('[WebSocket] Error updating user status on disconnect:', error);
    }

    this.broadcast({
      type: 'user_offline',
      userId,
    });

    console.log(`[WebSocket] User ${userId} disconnected. Total clients: ${this.clients.size}`);
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const deadClients: string[] = [];

      this.clients.forEach((client, userId) => {
        if (!client.isAlive) {
          deadClients.push(userId);
          client.ws.terminate();
          return;
        }
        
        client.isAlive = false;
        client.ws.ping();
      });

      deadClients.forEach(userId => {
        this.handleDisconnect(userId);
      });
    }, 30000); // 30 seconds
  }

  public sendToUser(userId: string, message: WSMessage) {
    const client = this.clients.get(userId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error(`[WebSocket] Error sending to user ${userId}:`, error);
      }
    }
  }

  public broadcast(message: WSMessage) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(messageStr);
        } catch (error) {
          console.error(`[WebSocket] Error broadcasting to user ${client.userId}:`, error);
        }
      }
    });
  }

  public async broadcastToConversation(conversationId: string, message: WSMessage) {
    try {
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        console.warn(`[WebSocket] Conversation ${conversationId} not found`);
        return;
      }

      const participants = [conversation.participant1Id, conversation.participant2Id];
      const messageStr = JSON.stringify(message);

      participants.forEach((userId) => {
        const client = this.clients.get(userId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
          try {
            client.ws.send(messageStr);
          } catch (error) {
            console.error(`[WebSocket] Error sending to user ${userId}:`, error);
          }
        }
      });
    } catch (error) {
      console.error('[WebSocket] Error broadcasting to conversation:', error);
    }
  }

  public async joinSmartGroupRoom(userId: string, groupId: string) {
    try {
      // Validate user is member of group
      const isMember = await storage.isUserInSmartGroup(groupId, userId);
      if (!isMember) {
        console.warn(`[WebSocket] User ${userId} is not a member of group ${groupId}`);
        const client = this.clients.get(userId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify({
            type: 'error',
            message: 'You are not a member of this group'
          }));
        }
        return;
      }

      const roomName = `smart_group_chat:${groupId}`;
      
      // Add room to user's room set
      if (!this.userRooms.has(userId)) {
        this.userRooms.set(userId, new Set());
      }
      this.userRooms.get(userId)!.add(roomName);

      // Notify user they joined
      const client = this.clients.get(userId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({
          type: 'room_joined',
          roomId: roomName
        }));
      }

      console.log(`[WebSocket] User ${userId} joined room ${roomName}`);
    } catch (error) {
      console.error(`[WebSocket] Error joining room:`, error);
      const client = this.clients.get(userId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to join room'
        }));
      }
    }
  }

  public async leaveSmartGroupRoom(userId: string, groupId: string) {
    try {
      const roomName = `smart_group_chat:${groupId}`;
      
      // Remove room from user's room set
      const userRoomSet = this.userRooms.get(userId);
      if (userRoomSet) {
        userRoomSet.delete(roomName);
        if (userRoomSet.size === 0) {
          this.userRooms.delete(userId);
        }
      }

      // Notify user they left
      const client = this.clients.get(userId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({
          type: 'room_left',
          roomId: roomName
        }));
      }

      console.log(`[WebSocket] User ${userId} left room ${roomName}`);
    } catch (error) {
      console.error(`[WebSocket] Error leaving room:`, error);
    }
  }

  public async broadcastToRoom(roomId: string, message: any) {
    try {
      // Handle smart group chat rooms
      if (roomId.startsWith('smart_group_chat:')) {
        const groupId = roomId.replace('smart_group_chat:', '');
        const group = await storage.getSmartGroup(groupId);
        
        if (!group) {
          console.warn(`[WebSocket] Smart group ${groupId} not found`);
          return;
        }

        // Get all group members
        const memberUserIds = group.members?.map(m => m.userId) || [];
        const messageStr = JSON.stringify(message);

        memberUserIds.forEach((userId) => {
          const client = this.clients.get(userId);
          if (client && client.ws.readyState === WebSocket.OPEN) {
            try {
              client.ws.send(messageStr);
            } catch (error) {
              console.error(`[WebSocket] Error sending to user ${userId} in room ${roomId}:`, error);
            }
          }
        });

        console.log(`[WebSocket] Broadcast to smart group ${groupId}: ${memberUserIds.length} members notified`);
      }
    } catch (error) {
      console.error(`[WebSocket] Error broadcasting to room ${roomId}:`, error);
    }
  }

  public close() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.clients.forEach((client) => {
      client.ws.close();
    });
    
    this.wss.close(() => {
      console.log('[WebSocket] Server closed');
    });
  }
}

let wsServerInstance: WebSocketServer | null = null;

export function setupWebSocketServer(server: Server, sessionStore: any): WebSocketServer {
  if (!wsServerInstance) {
    wsServerInstance = new WebSocketServer(server, sessionStore);
  }
  return wsServerInstance;
}

export function getWebSocketServer(): WebSocketServer | null {
  return wsServerInstance;
}

// Helper functions for broadcasting from routes
export function broadcastToUser(userId: string, message: any) {
  if (wsServerInstance) {
    wsServerInstance.sendToUser(userId, message);
  }
}

export function broadcastToAll(message: any) {
  if (wsServerInstance) {
    wsServerInstance.broadcast(message);
  }
}

export function broadcastToRoom(roomId: string, message: any) {
  if (wsServerInstance) {
    wsServerInstance.broadcastToRoom(roomId, message);
  }
}
