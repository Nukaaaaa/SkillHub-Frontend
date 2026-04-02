import { getServiceClient } from './client';

export type TargetType = 'post' | 'article' | 'comment';

export const interactionService = {
  async addLike(targetType: TargetType, targetId: number) {
    const client = getServiceClient('INTERACTION');
    const { data } = await client.post('/likes', { target_type: targetType, target_id: targetId });
    return data;
  },

  async removeLike(targetType: TargetType, targetId: number) {
    const client = getServiceClient('INTERACTION');
    // Using axios config data for DELETE payload
    const { data } = await client.delete('/likes', { 
        data: { target_type: targetType, target_id: targetId } 
    });
    return data;
  },

  async countLikes(targetType: TargetType, targetId: number) {
    const client = getServiceClient('INTERACTION');
    const { data } = await client.get('/likes/count', {
      params: { target_type: targetType, target_id: targetId }
    });
    return data.count;
  },

  async addBookmark(targetType: TargetType, targetId: number) {
    const client = getServiceClient('INTERACTION');
    const { data } = await client.post('/bookmarks', { target_type: targetType, target_id: targetId });
    return data;
  },

  async removeBookmark(targetType: TargetType, targetId: number) {
    const client = getServiceClient('INTERACTION');
    const { data } = await client.delete('/bookmarks', {
        data: { target_type: targetType, target_id: targetId }
    });
    return data;
  },

  async getMyBookmarks() {
    const client = getServiceClient('INTERACTION');
    const { data } = await client.get('/bookmarks/my');
    return data.bookmarks || [];
  }
};
