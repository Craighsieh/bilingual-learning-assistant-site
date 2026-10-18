import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PracticePage } from '../src/toeic/practice';
import { StudyData } from '../src/toeic/data';
import { openStudyStore } from '../src/toeic/store';
import type { StudyForm, ReviewFile } from '../src/toeic/types';

let page: PracticePage | undefined;
beforeEach(() => {
  document.body.innerHTML = '<main id="toeic-root"></main>';
  history.replaceState(null, '', '/toeic/practice/?form=prac01');
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
});
afterEach(() => { page?.dispose(); page = undefined; vi.restoreAllMocks(); });

describe('practice page recovery', () => {
  it('keeps a new answer visible when persistence fails and saves it on explicit retry', async () => {
    const form: StudyForm = { schemaVersion:1,id:'prac01',title:'練習 1',role:'practice',contentVersion:'v1',questions:[
      { id:'q',number:101,part:5,groupId:'g',text:'Choose a word.',choices:[{key:'A',text:'first'},{key:'B',text:'second'}],audio:null,image:null,passage:null,documents:[],graphic:null,sourceHash:'hash' },
    ] };
    const review: ReviewFile = {schemaVersion:1,formId:'prac01',contentVersion:'v1',answers:{q:{answer:'B',explanation:'Reason',transcript:'',skill:'word_form'}}};
    const data = { catalog:async()=>({contentVersion:'v1'}),form:async()=>form,review:async()=>review,asset:()=>'' } as unknown as StudyData;
    const store = await openStudyStore(new IDBFactory());
    const save = store.save.bind(store); let fail = false;
    vi.spyOn(store,'save').mockImplementation((...args) => { if(fail){fail=false;return Promise.reject(new Error('本機空間不足'));} return save(...args); });
    const root = document.getElementById('toeic-root')!;
    page = new PracticePage(root,data,store,new URL('/toeic/',location.href),new URLSearchParams('form=prac01'));
    await page.start(); fail=true;
    (root.querySelector('#answer-101-B') as HTMLInputElement).click();
    await vi.waitFor(() => expect(root.querySelector('[role=alert]')?.textContent).toContain('空間不足'));
    expect((root.querySelector('#answer-101-B') as HTMLInputElement).checked).toBe(true);
    expect(root.textContent).toContain('尚未保存');
    expect((await store.list())[0]?.answers).toEqual({});
    [...root.querySelectorAll('button')].find((b)=>b.textContent==='重試保存')!.click();
    await vi.waitFor(async () => expect((await store.list())[0]?.answers).toEqual({q:'B'}));
    expect((root.querySelector('#answer-101-B') as HTMLInputElement).checked).toBe(true);
  });
});
