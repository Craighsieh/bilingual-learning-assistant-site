import { afterEach, describe, expect, it, vi } from 'vitest';
import { StudyAudio } from '../src/toeic/audio';
afterEach(() => vi.restoreAllMocks());
describe('native audio feedback', () => {
  it('keeps the same audio element during answer rendering and reports pause/end truthfully', () => {
    vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});
    vi.spyOn(HTMLMediaElement.prototype,'load').mockImplementation(()=>{});
    const host=document.createElement('section'); const player=new StudyAudio(host);
    player.setSource('https://example.test/audio.mp3','Part 2');
    const audio=host.querySelector('audio')!;
    audio.dispatchEvent(new Event('playing')); expect(host.textContent).toContain('播放中');
    player.setSource('https://example.test/audio.mp3','Part 2'); expect(host.querySelector('audio')).toBe(audio);
    audio.dispatchEvent(new Event('pause')); expect(host.textContent).toContain('已暫停');
    audio.dispatchEvent(new Event('ended')); expect(host.textContent).toContain('播放完畢');
    player.dispose();
  });
});
