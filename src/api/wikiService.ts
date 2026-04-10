import { getServiceClient } from './client';
import type { WikiLandingResponse, ArticlePreview } from '../types';

const apiClient = getServiceClient('CONTENT');

export const wikiService = {
    /**
     * Загружает данные для главной страницы Вики.
     * @param roomIds - Если передан, фильтрует данные по указанным комнатам (локальный режим направления).
     *                  Если не передан, возвращает глобальные данные.
     */
    getLanding: async (roomIds?: number[]): Promise<WikiLandingResponse> => {
        const params = new URLSearchParams();
        if (roomIds && roomIds.length > 0) {
            params.append('roomIds', roomIds.join(','));
        }
        const query = params.toString() ? `?${params.toString()}` : '';
        const response = await apiClient.get<WikiLandingResponse>(`/wiki/landing${query}`);
        return response.data;
    },

    /**
     * Поиск по базе знаний.
     * @param q - Поисковый запрос (обязательный).
     * @param roomIds - Если передан, ограничивает поиск указанными комнатами.
     */
    search: async (q: string, roomIds?: number[]): Promise<ArticlePreview[]> => {
        const params = new URLSearchParams({ q });
        if (roomIds && roomIds.length > 0) {
            params.append('roomIds', roomIds.join(','));
        }
        const response = await apiClient.get<ArticlePreview[]>(`/wiki/search?${params.toString()}`);
        return response.data;
    },

    /**
     * Регистрирует просмотр статьи для обновления счётчика "Популярное за неделю".
     * Вызывать после того, как пользователь провёл на статье 2+ секунды.
     * @param articleId - ID статьи.
     * @param userId - (опционально) ID пользователя для будущих персональных рекомендаций.
     */
    trackView: async (articleId: number, userId?: number): Promise<void> => {
        const params = userId ? `?userId=${userId}` : '';
        await apiClient.post(`/wiki/interactions/${articleId}/view${params}`);
    },
};
