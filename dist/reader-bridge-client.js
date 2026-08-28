import { DUALCUE_READER_PORT_NAME, DUALCUE_READER_PROTOCOL_VERSION, } from './reader-protocol.generated.js';
export function createReaderBridgeClient(options) {
    let port = null;
    let connected = false;
    let reconnectAttempts = 0;
    let reconnectTimer = 0;
    const scheduleReconnect = () => {
        if (reconnectTimer)
            return;
        const delay = Math.min(10_000, 1_000 * 2 ** Math.min(reconnectAttempts, 3));
        reconnectAttempts += 1;
        reconnectTimer = window.setTimeout(() => {
            reconnectTimer = 0;
            connect();
        }, delay);
    };
    const markDisconnected = () => {
        connected = false;
        port = null;
        options.onConnectionChange(false);
        scheduleReconnect();
    };
    const connect = () => {
        const runtime = globalThis.chrome?.runtime;
        if (!runtime?.connect) {
            markDisconnected();
            return;
        }
        try {
            const nextPort = runtime.connect(options.extensionId, { name: DUALCUE_READER_PORT_NAME });
            port = nextPort;
            connected = true;
            reconnectAttempts = 0;
            nextPort.onMessage.addListener(options.onEvent);
            nextPort.onDisconnect.addListener(() => {
                if (port === nextPort)
                    markDisconnected();
            });
            nextPort.postMessage({
                protocolVersion: DUALCUE_READER_PROTOCOL_VERSION,
                type: 'hello',
                requestId: crypto.randomUUID(),
            });
            window.setTimeout(() => {
                if (port === nextPort && connected)
                    options.onConnectionChange(true);
            }, 1_200);
        }
        catch {
            markDisconnected();
        }
    };
    return {
        connect,
        isConnected: () => connected,
        post(request) {
            if (!port || !connected)
                throw new Error('DualCue extension connection is unavailable.');
            port.postMessage(request);
        },
    };
}
