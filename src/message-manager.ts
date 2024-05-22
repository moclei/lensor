import browser, { Runtime } from 'webextension-polyfill';

type MessageCallback = (payload: any) => void;

const MessageActions = {
    START: 'start',
    STOP: 'stop',
    MOVE: 'move',
    ZOOM: 'zoom'
} as const;

type MessagePayloads = {
    [MessageActions.START]: null;
    [MessageActions.STOP]: () => void;
    [MessageActions.MOVE]: (coords: { x: number, y: number }) => void;
    [MessageActions.ZOOM]: (change: number) => void;
}

type MessageActionTypes = typeof MessageActions;
type MessageActionKeyTypes = keyof typeof MessageActions;
type MessageActionValueTypes = MessageActionTypes[MessageActionKeyTypes];
type Actions = MessageActionValueTypes;

type Message<T extends Actions> = {
    action: T;
    payload: MessagePayloads[T];
}

type MessageHandler<K extends Actions> = (
    message: Message<K>,
    sender: Runtime.MessageSender,
    sendResponse: MessageCallback
) => any;

type MessageHandlers = { [K in Actions]: MessageHandler<K> };

class MessageManager {
    private static instance: MessageManager | null = null;
    private handlers: Map<string, any> = new Map();
    private context: string;
    private history: any[];
    private relayActions: Set<string> = new Set();

    private constructor(id: string) {
        this.context = id;
        this.history = [];
    }

    private static getInstance(id?: string): MessageManager {
        if (!MessageManager.instance) {
            if (!id) {
                throw new Error('MessageManager must be initialized with an id');
            }
            MessageManager.instance = new MessageManager(id);
        }
        return MessageManager.instance;
    }

    public start() {
        browser.runtime.onMessage.addListener((
            message: Message<any>,
            sender: Runtime.MessageSender,
            sendResponse: MessageCallback
        ) => {
            const handler = this.handlers.get(message.action);
            if (handler) {
                this.logMessage(message, sender);
                handler(message, sender, sendResponse);
            }
            return true;
        });
    }

    public sendMessage<A extends MessageActionValueTypes>(
        action: A,
        options?: {
            payload?: MessagePayloads[A],
            tabId?: number
        }
    ): Promise<any> {
        this.logMessage({ action, payload: options?.payload });
        if (options?.tabId) {
            return browser.tabs.sendMessage(options.tabId, { action, payload: options.payload });
        } else {
            return browser.runtime.sendMessage({ action, payload: options?.payload });
        }
    }

    public registerListener<A extends MessageActionValueTypes>(
        action: A,
        handler?: MessageHandler<A>
    ) {
        if (!handler) {
            this.handlers.set(action, this.handleRelay);
            this.relayActions.add(action)
        }
        this.handlers.set(action, handler);
    }

    private handleRelay: MessageHandler<any> = ({ action, payload }, sender) => {
        if (!sender.tab?.id) {
            console.log('Relay action received from non-tab sender');
            return;
        }
        this.sendMessage(action, { payload, tabId: sender.tab.id });
    };

    private logMessage(message: Message<any>, sender?: Runtime.MessageSender) {
        console.log(`message from ${sender} with action: ${message.action} with payload ${message.payload} received in context: ${this.context}`);
        console.log(`Previous history was: ${this.history}`);
        this.history.push({ message, sender });
    }
}