import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * useDebounce Hook
 * Debounces a value with a specified delay
 * 
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds (default: 500)
 * @returns Debounced value
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 * 
 * useEffect(() => {
 *   // API call with debounced value
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * useLocalStorage Hook
 * Syncs state with localStorage with type safety
 * 
 * @param key - localStorage key
 * @param initialValue - Initial value if key doesn't exist
 * @returns [storedValue, setValue] tuple
 * 
 * @example
 * const [theme, setTheme] = useLocalStorage('theme', 'dark');
 */
export function useLocalStorage<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
    // State to store our value
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }

        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error loading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // Return a wrapped version of useState's setter function that
    // persists the new value to localStorage
    const setValue = useCallback(
        (value: T | ((val: T) => T)) => {
            try {
                // Allow value to be a function so we have same API as useState
                const valueToStore = value instanceof Function ? value(storedValue) : value;

                setStoredValue(valueToStore);

                if (typeof window !== 'undefined') {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore));
                }
            } catch (error) {
                console.error(`Error setting localStorage key "${key}":`, error);
            }
        },
        [key, storedValue]
    );

    return [storedValue, setValue];
}

/**
 * useIntersection Hook
 * Detects when an element intersects with the viewport
 * Perfect for scroll-driven animations
 * 
 * @param options - IntersectionObserver options
 * @returns [ref, isIntersecting] tuple
 * 
 * @example
 * const [ref, isVisible] = useIntersection({ threshold: 0.5 });
 * 
 * <div ref={ref}>
 *   {isVisible && <AnimatedComponent />}
 * </div>
 */
export function useIntersection(
    options: IntersectionObserverInit = {}
): [React.RefObject<HTMLDivElement | null>, boolean] {
    const ref = useRef<HTMLDivElement>(null);
    const [isIntersecting, setIsIntersecting] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(([entry]) => {
            setIsIntersecting(entry.isIntersecting);
        }, options);

        observer.observe(element);

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, [options]);

    return [ref, isIntersecting] as const;
}

/**
 * useMediaQuery Hook
 * Tracks media query matches in real-time
 * 
 * @param query - Media query string
 * @returns boolean - Whether the query matches
 * 
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const media = window.matchMedia(query);

        // Set initial value
        setMatches(media.matches);

        // Listen for changes
        const listener = (e: MediaQueryListEvent) => setMatches(e.matches);

        // Modern browsers
        if (media.addEventListener) {
            media.addEventListener('change', listener);
            return () => media.removeEventListener('change', listener);
        }
        // Fallback for older browsers
        else {
            media.addListener(listener);
            return () => media.removeListener(listener);
        }
    }, [query]);

    return matches;
}

/**
 * useOnClickOutside Hook
 * Detects clicks outside of a referenced element
 * 
 * @param handler - Callback when click outside occurs
 * @returns ref - Ref to attach to the element
 * 
 * @example
 * const ref = useOnClickOutside(() => setIsOpen(false));
 * return <div ref={ref}>Dropdown Menu</div>
 */
export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
    handler: () => void
): React.RefObject<T | null> {
    const ref = useRef<T>(null);

    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            const el = ref.current;
            if (!el || el.contains(event.target as Node)) {
                return;
            }
            handler();
        };

        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);

        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [handler]);

    return ref;
}

/**
 * usePrevious Hook
 * Returns the previous value of a state/prop
 * 
 * @param value - Current value
 * @returns Previous value
 * 
 * @example
 * const [count, setCount] = useState(0);
 * const previousCount = usePrevious(count);
 */
export function usePrevious<T>(value: T): T | undefined {
    const ref = useRef<T | undefined>(undefined);

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref.current;
}

/**
 * useWindowSize Hook
 * Tracks window dimensions with debounce
 * 
 * @param debounceMs - Debounce delay (default: 150ms)
 * @returns { width, height }
 * 
 * @example
 * const { width, height } = useWindowSize();
 * const isMobile = width < 768;
 */
export function useWindowSize(debounceMs: number = 150) {
    const [size, setSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        let timeoutId: NodeJS.Timeout;

        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setSize({
                    width: window.innerWidth,
                    height: window.innerHeight,
                });
            }, debounceMs);
        };

        window.addEventListener('resize', handleResize);

        // Initial size
        handleResize();

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', handleResize);
        };
    }, [debounceMs]);

    return size;
}
