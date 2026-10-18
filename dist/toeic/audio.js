/** Keeps one real audio element mounted while answer controls re-render. */
export class StudyAudio {
    host;
    source = null;
    audio = document.createElement('audio');
    status = document.createElement('p');
    nextAudio = document.createElement('audio');
    heading = document.createElement('strong');
    nextSource = null;
    constructor(host) {
        this.host = host;
        this.audio.controls = true;
        this.audio.preload = 'metadata';
        this.audio.setAttribute('aria-label', '題組聽力播放器');
        this.status.className = 'audio-status';
        this.status.setAttribute('role', 'status');
        const replay = document.createElement('button');
        replay.type = 'button';
        replay.textContent = '重播本題組';
        replay.addEventListener('click', () => { this.audio.currentTime = 0; void this.play(); });
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.textContent = '重新載入音訊';
        retry.addEventListener('click', () => { this.audio.load(); void this.play(); });
        this.audio.addEventListener('error', () => { this.status.textContent = '音訊無法播放。請檢查網路後重新載入，答案已保留。'; });
        this.audio.addEventListener('waiting', () => { this.status.textContent = '正在載入音訊…'; });
        this.audio.addEventListener('canplay', () => { this.status.textContent = '可暫停、重播；請按播放開始聆聽。'; });
        this.audio.addEventListener('playing', () => { this.status.textContent = '聽力播放中'; });
        this.audio.addEventListener('pause', () => { if (!this.audio.ended)
            this.status.textContent = '已暫停，可繼續播放或重播。'; });
        this.audio.addEventListener('ended', () => { this.status.textContent = '本題組播放完畢，可重播。'; });
        const actions = document.createElement('div');
        actions.className = 'audio-actions';
        actions.append(replay, retry);
        host.append(this.heading, this.audio, actions, this.status);
    }
    async play() {
        try {
            await this.audio.play();
        }
        catch {
            this.status.textContent = '播放未能開始，請按播放器的播放按鈕再試一次。答案已保留。';
        }
    }
    setSource(source, label) {
        this.host.hidden = !source;
        this.heading.textContent = label;
        if (source === this.source)
            return;
        this.audio.pause();
        this.source = source;
        if (source) {
            this.audio.src = source;
            this.status.textContent = '請按播放開始聆聽。';
        }
        else
            this.audio.removeAttribute('src');
        this.audio.load();
    }
    prefetchNext(source) {
        if (source === this.nextSource)
            return;
        this.nextAudio.pause();
        this.nextAudio.removeAttribute('src');
        this.nextSource = source;
        if (source) {
            this.nextAudio.preload = 'metadata';
            this.nextAudio.src = source;
        }
        this.nextAudio.load();
    }
    pause() { this.audio.pause(); }
    dispose() { this.setSource(null, ''); this.prefetchNext(null); }
}
