import { useState, useEffect, useCallback, useRef } from 'react';
import { connect, MessageConfig, PorterContext } from 'porter-source';

interface PorterMessage {
    action: string;
    payload: any;
}

interface UsePorterResult {
    post: (message: PorterMessage) => void;
    setMessage: (handlers: MessageConfig) => void;
    isConnected: boolean;
    error: Error | null;
}

export function usePorter(): UsePorterResult {
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const postRef = useRef<((message: PorterMessage) => void) | null>(null);
    const setMessageRef = useRef<((handlers: MessageConfig) => void) | null>(null);

    useEffect(() => {
        let isMounted = true;

        const initializePorter = async () => {
            try {
                console.log('initializePorter');
                const [post, setMessage] = connect({ agentContext: PorterContext.React });

                if (isMounted) {
                    console.log('initializePorter, isMounted');
                    postRef.current = post;
                    setMessageRef.current = setMessage;
                    setIsConnected(true);
                    setError(null);
                }
            } catch (err) {
                console.log('Error initializing Porter');
                if (isMounted) {
                    setError(err instanceof Error ? err : new Error('Failed to connect to Porter'));
                    setIsConnected(false);
                }
            }
        };

        initializePorter();

        return () => {
            isMounted = false;
            // Clean up the connection if necessary
            // This depends on whether porter-source provides a cleanup method
        };
    }, []);

    const post = useCallback((message: PorterMessage) => {
        console.log('post', message);
        if (postRef.current) {
            console.log('postRef.current existed');
            try {
                console.log('Sending');
                postRef.current(message);
            } catch (err) {
                console.log('failed to postRef.current');
                setError(err instanceof Error ? err : new Error('Failed to send message'));
            }
        } else {
            console.log('Porter is not connected');
            setError(new Error('Porter is not connected'));
        }
    }, []);

    const setMessage = useCallback((handlers: MessageConfig) => {
        if (setMessageRef.current) {
            try {
                setMessageRef.current(handlers);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to set message handlers'));
            }
        } else {
            setError(new Error('Porter is not connected'));
        }
    }, []);

    return { post, setMessage, isConnected, error };
}