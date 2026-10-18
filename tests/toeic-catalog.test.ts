import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Attempt } from '../src/toeic/types';

const state=vi.hoisted(()=>({records:[] as Partial<Attempt>[],clear:vi.fn()}));
vi.mock('../src/toeic/store',()=>({openStudyStore:async()=>({persistent:true,list:async()=>state.records,clear:state.clear})}));
afterEach(()=>{vi.unstubAllGlobals();vi.resetModules();document.body.replaceChildren();delete document.body.dataset.toeicPage;delete document.body.dataset.toeicRoot;state.clear.mockClear();});
describe('catalog resume after public offering changes',()=>{
  it('shows three cards and resumes only an allowed draft, preserving withdrawn records',async()=>{
    history.replaceState(null,'','/toeic/');document.body.dataset.toeicPage='catalog';document.body.dataset.toeicRoot='./';
    document.body.innerHTML='<main id="toeic-root"></main>';
    state.records=[{id:'withdrawn',formId:'mock04',contentVersion:'v1',status:'draft',scopePart:null,answers:{},questionIds:['old'],partById:{}},{id:'retained',formId:'prac01',contentVersion:'v1',status:'draft',scopePart:5,answers:{q:'B'},questionIds:['q'],partById:{q:5}}];
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({schemaVersion:1,contentVersion:'v1',totalQuestions:600,forms:['prac01','mock01','mock02'].map(id=>({id,title:id==='prac01'?'練習 1':id==='mock01'?'模考 1':'模考 2',role:id.startsWith('prac')?'practice':'mock',description:'demo',total:200,parts:[1,2,3,4,5,6,7].map(part=>({part,total:1}))}))})}));
    await import('../src/toeic');
    await vi.waitFor(()=>expect(document.querySelectorAll('.form-card')).toHaveLength(3));
    expect(document.querySelector('.resume-card')?.textContent).toContain('練習 1');
    const links=[...document.querySelectorAll<HTMLAnchorElement>('a')].map(a=>a.href);
    expect(links.some(url=>url.includes('attempt=retained'))).toBe(true);
    expect(links.some(url=>url.includes('withdrawn')||url.includes('mock04'))).toBe(false);
    expect(state.records).toHaveLength(2);expect(state.clear).not.toHaveBeenCalled();
  });
});
