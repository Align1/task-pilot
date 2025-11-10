import { useState, useEffect, useCallback, useRef } from 'react';

export interface PaginationState {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

export interface UseInfiniteScrollOptions<T> {
  fetchFunction: (page: number, limit: number) => Promise<{
    items: T[];
    pagination: PaginationState;
  }>;
  limit?: number;
  enabled?: boolean;
  onError?: (error: any) => void;
}

export interface UseInfiniteScrollReturn<T> {
  items: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  page: number;
  totalCount: number;
  loadMore: () => void;
  refresh: () => void;
  observerRef: (node: HTMLElement | null) => void;
  addItem: (item: T) => void;
  updateItem: (id: string, updates: Partial<T>) => void;
  removeItem: (id: string) => void;
}

/**
 * Custom hook for infinite scroll with pagination
 */
export function useInfiniteScroll<T extends { id: string }>({
  fetchFunction,
  limit = 20,
  enabled = true,
  onError
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const isInitialMount = useRef(true);
  const isFetching = useRef(false);

  /**
   * Fetch data for a specific page
   */
  const fetchData = useCallback(async (pageNum: number, append: boolean = false) => {
    if (isFetching.current || !enabled) return;

    isFetching.current = true;
    
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      
      setError(null);

      const result = await fetchFunction(pageNum, limit);

      setItems(prev => append ? [...prev, ...result.items] : result.items);
      setHasMore(result.pagination.hasMore);
      setTotalCount(result.pagination.totalCount);
      setPage(pageNum);

    } catch (err: any) {
      setError(err);
      if (onError) {
        onError(err);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      isFetching.current = false;
    }
  }, [fetchFunction, limit, enabled, onError]);

  /**
   * Load more items (next page)
   */
  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || !enabled) return;
    fetchData(page + 1, true);
  }, [hasMore, isLoadingMore, page, fetchData, enabled]);

  /**
   * Refresh data (reset to page 1)
   */
  const refresh = useCallback(() => {
    setPage(1);
    setHasMore(true);
    fetchData(1, false);
  }, [fetchData]);

  /**
   * Intersection observer callback
   */
  const lastItemRef = useCallback((node: HTMLElement | null) => {
    if (isLoadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    }, {
      rootMargin: '100px' // Start loading before reaching the end
    });

    if (node) observerRef.current.observe(node);
  }, [isLoadingMore, hasMore, loadMore]);

  /**
   * Add item to the list (optimistic update)
   */
  const addItem = useCallback((item: T) => {
    setItems(prev => [item, ...prev]);
    setTotalCount(prev => prev + 1);
  }, []);

  /**
   * Update item in the list
   */
  const updateItem = useCallback((id: string, updates: Partial<T>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  /**
   * Remove item from the list
   */
  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    setTotalCount(prev => Math.max(0, prev - 1));
  }, []);

  /**
   * Initial data fetch
   */
  useEffect(() => {
    if (isInitialMount.current && enabled) {
      isInitialMount.current = false;
      fetchData(1, false);
    }
  }, [enabled, fetchData]);

  /**
   * Cleanup observer on unmount
   */
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    items,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    page,
    totalCount,
    loadMore,
    refresh,
    observerRef: lastItemRef,
    addItem,
    updateItem,
    removeItem
  };
}

/**
 * Helper hook for scroll restoration
 */
export function useScrollRestoration(key: string) {
  const scrollPositionRef = useRef<number>(0);

  useEffect(() => {
    // Restore scroll position
    const savedPosition = sessionStorage.getItem(`scroll-${key}`);
    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition));
    }

    // Save scroll position on unmount
    return () => {
      sessionStorage.setItem(`scroll-${key}`, window.scrollY.toString());
    };
  }, [key]);

  return scrollPositionRef;
}

