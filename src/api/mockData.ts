import type { Article } from '../types';

export interface MockReport {
    id: number;
    reporter_id: number;
    target_id: number;
    target_author_id: number;
    target_type: 'post' | 'article' | 'comment' | 'moderator_application';
    reason: string;
    status: 'OPEN' | 'REJECTED' | 'RESOLVED' | 'ESCALATED';
    created_at: string;
}

export const MOCK_REPORTS: MockReport[] = [
    {
        id: 101,
        reporter_id: 5,
        target_id: 1,
        target_author_id: 12,
        target_type: 'article',
        reason: 'Статья содержит некорректные инструкции по настройке Kubernetes кластера, что может привести к потере данных.',
        status: 'OPEN',
        created_at: new Date().toISOString()
    },
    {
        id: 102,
        reporter_id: 8,
        target_id: 2,
        target_author_id: 15,
        target_type: 'article',
        reason: 'Код в примерах написан с использованием уязвимых функций, провоцирующих SQL Injection.',
        status: 'OPEN',
        created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
        id: 103,
        reporter_id: 9,
        target_id: 50,
        target_author_id: 20,
        target_type: 'moderator_application',
        reason: JSON.stringify({
            roomName: 'Java Enterprise',
            evaluation: {
                verdict: 'APPROVED',
                reason: 'Кандидат показал глубокое знание Spring Framework и Hibernate. Тест пройден на высокий балл.',
                note: 'Рекомендуется к назначению.'
            },
            testSummary: { score: 94 }
        }),
        status: 'OPEN',
        created_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
        id: 104,
        reporter_id: 2,
        target_id: 3,
        target_author_id: 30,
        target_type: 'post',
        reason: 'Токсичное поведение в комментариях и переход на личности в обсуждении архитектуры системы.',
        status: 'OPEN',
        created_at: new Date(Date.now() - 86400000).toISOString()
    }
];

export const MOCK_ARTICLES: Partial<Article>[] = [
    {
        id: 1,
        title: 'Архитектура микросервисов: паттерн API Gateway',
        content: 'Паттерн API Gateway является единой точкой входа для всех клиентов. В этой статье мы подробно разберем, как реализовать его на Go с использованием библиотеки Gin и gRPC для общения с внутренними микросервисами.',
    },
    {
        id: 2,
        title: 'Безопасность в Node.js: защита от SQL Injection',
        content: 'SQL инъекции остаются одной из самых опасных угроз для веб-приложений. Мы рассмотрим, как использовать параметризованные запросы в библиотеке pg и почему никогда не стоит доверять пользовательскому вводу.',
    },
    {
        id: 3,
        title: 'Оптимизация React приложений через Memoization',
        content: 'Ререндеринг — это одна из главных проблем производительности в больших React приложениях. Мы изучим, как хуки useMemo и useCallback помогают избежать лишних вычислений.',
    }
];
