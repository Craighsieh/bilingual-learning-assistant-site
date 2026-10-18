/** Web Locks release automatically on reload/discard; IDB owner fencing rejects late old-document writes. */
export async function acquireEditor(id, store, locks = navigator.locks) {
    const owner = crypto.randomUUID();
    if (!locks)
        return { acquired: await store.acquire(id, owner), owner, release: () => store.release(id, owner) };
    let unlock = () => { };
    let lifetime;
    return new Promise((resolve, reject) => {
        lifetime = locks.request(`dualcue-toeic:${id}`, { mode: 'exclusive', ifAvailable: true }, async (lock) => {
            if (!lock) {
                resolve({ acquired: false, owner, release: async () => { } });
                return;
            }
            const held = new Promise((release) => { unlock = release; });
            try {
                await store.acquire(id, owner, Date.now(), true);
                resolve({ acquired: true, owner, release: async () => { try {
                        await store.release(id, owner);
                    }
                    finally {
                        unlock();
                        await lifetime;
                    } } });
                await held;
            }
            catch (error) {
                reject(error);
            }
        });
        lifetime.catch(reject);
    });
}
