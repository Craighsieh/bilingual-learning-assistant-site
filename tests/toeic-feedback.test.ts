import { readFile } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateToeicPages } from '../scripts/generate-toeic-pages.mjs';
import { buildFeedbackPayload, feedbackHref, mountFeedbackForm } from '../src/toeic/feedback';
import { sendFeedback } from '../src/toeic/feedback-delivery';
import { renderQuestionGroup } from '../src/toeic/view';
import { createAttempt } from '../src/toeic/session';
import type { StudyForm } from '../src/toeic/types';

const draft = { formId:'mock01', questionNumber:101, category:'wording', description:'  A & B <svg onload=alert(1)> 不清楚  ', contentVersion:'core12_test' };
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); document.body.replaceChildren(); });
async function mounted(send = vi.fn().mockResolvedValue(undefined), query = 'form=mock04&question=101&attempt=PRIVATE&answer=SECRET') {
  await generateToeicPages(process.cwd());
  document.body.innerHTML = new DOMParser().parseFromString(await readFile('toeic/feedback/index.html','utf8'),'text/html').body.innerHTML;
  const form = document.getElementById('feedback-form') as HTMLFormElement;
  mountFeedbackForm(form,new URLSearchParams(query),send);
  return {form,send,category:document.getElementById('feedback-category') as HTMLSelectElement,description:document.getElementById('feedback-description') as HTMLTextAreaElement,
    submit:form.querySelector<HTMLButtonElement>('button[type=submit]')!,dispatch:()=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))};
}

describe('anonymous feedback payload and delivery',()=>{
  it('whitelists fields, fixes the public URL, preserves text and rejects invalid context',()=>{
    const payload=buildFeedbackPayload(draft,'DC-test');
    expect(Object.keys(payload).sort()).toEqual(['_subject','_url','_template','_honey','form','question','category','content_version','message','reference'].sort());
    expect(payload).toMatchObject({form:'模考 1（mock01）',question:'第 101 題',category:'題目表達或品質',message:draft.description.trim(),content_version:'core12_test',reference:'DC-test',_url:'https://craighsieh.github.io/bilingual-learning-assistant-site/toeic/feedback/',_honey:''});
    expect(buildFeedbackPayload({...draft,questionNumber:null},'DC-test').question).toContain('整份套卷');
    for(const invalid of [{formId:'old-mock12'},{questionNumber:201},{questionNumber:0},{questionNumber:1.5},{category:'constructor'},{description:'   '},{description:'x'.repeat(1001)}]) expect(()=>buildFeedbackPayload({...draft,...invalid},'DC-test')).toThrow();
  });
  it.each([true,'true'])('requires an explicit positive acknowledgement: %s',async success=>{
    const transport=vi.fn().mockResolvedValue({ok:true,json:async()=>({success})});const payload=buildFeedbackPayload(draft,'DC-test');
    await sendFeedback(payload,transport);expect(transport).toHaveBeenCalledOnce();
    const [url,options]=transport.mock.calls[0]!;
    expect(url).toBe('https://formsubmit.co/ajax/63c134c5aa56100f0b1a409cf8c25648');
    expect(options).toMatchObject({method:'POST',credentials:'omit',referrerPolicy:'origin',headers:{'Content-Type':'application/json',Accept:'application/json'}});expect(JSON.parse(options.body)).toEqual(payload);
  });
  it.each([
    {ok:false,json:async()=>({success:true})},{ok:true,json:async()=>({success:'false'})},{ok:true,json:async()=>({success:false})},
    {ok:true,json:async()=>({message:'thanks'})},{ok:true,json:async()=>null},{ok:true,json:async()=>{throw new SyntaxError('not JSON')}},
  ])('rejects HTTP errors, false/missing success and invalid JSON without retry',async response=>{
    const transport=vi.fn().mockResolvedValue(response);await expect(sendFeedback(buildFeedbackPayload(draft,'DC-test'),transport)).rejects.toThrow();expect(transport).toHaveBeenCalledOnce();
  });
  it('bounds stalled requests and response bodies to 20 seconds, aborting without retry',async()=>{
    vi.useFakeTimers();
    for(const response of [null,{ok:true,json:()=>new Promise(()=>{})}]){
      const transport=vi.fn().mockImplementation(()=>response?Promise.resolve(response):new Promise(()=>{}));
      const promise=sendFeedback(buildFeedbackPayload(draft,'DC-test'),transport);const rejected=expect(promise).rejects.toThrow();
      await vi.advanceTimersByTimeAsync(20000);await rejected;expect(transport).toHaveBeenCalledOnce();expect(transport.mock.calls[0]![1].signal.aborted).toBe(true);
    }
    await expect(sendFeedback(buildFeedbackPayload(draft,'DC-test'),vi.fn().mockRejectedValue(new TypeError('offline')))).rejects.toThrow();
  });
});

describe('on-page anonymous feedback and recovery',()=>{
  it('prefills only catalog form/question, never opens study storage and waits for valid explicit submit',async()=>{
    const open=vi.fn();vi.stubGlobal('indexedDB',{open});const x=await mounted();
    expect((document.getElementById('feedback-form-id') as HTMLSelectElement).value).toBe('mock04');expect((document.getElementById('feedback-question') as HTMLInputElement).value).toBe('101');
    expect(document.body.textContent).toContain('不需要註冊');expect(document.body.textContent).not.toContain('GitHub');
    x.dispatch();expect(x.send).not.toHaveBeenCalled();expect(document.getElementById('feedback-error')?.hidden).toBe(false);
    x.category.value='explanation';x.description.value=draft.description;x.dispatch();await vi.waitFor(()=>expect(x.send).toHaveBeenCalledOnce());
    expect(x.send.mock.calls[0]![0]).toMatchObject({form:'模考 4（mock04）',question:'第 101 題'});expect(JSON.stringify(x.send.mock.calls[0]![0])).not.toMatch(/PRIVATE|SECRET|attempt|127\.0\.0\.1/);
    expect(document.querySelector('svg')).toBeNull();expect(open).not.toHaveBeenCalled();
  });
  it('freezes pending fields and suppresses duplicates, then locks success until send another',async()=>{
    let resolve!:()=>void;const send=vi.fn().mockImplementation(()=>new Promise<void>(r=>{resolve=r}));const x=await mounted(send);
    x.category.value='audio';x.description.value='逐字稿可能缺字';x.dispatch();x.dispatch();expect(send).toHaveBeenCalledOnce();expect(x.submit.disabled).toBe(true);expect(x.description.disabled).toBe(true);
    expect(document.getElementById('feedback-status')?.textContent).toContain('送出中');resolve();await vi.waitFor(()=>expect(document.getElementById('feedback-status')?.textContent).toContain('回饋已送出'));
    x.dispatch();expect(send).toHaveBeenCalledOnce();const another=document.getElementById('feedback-another') as HTMLButtonElement;expect(another.hidden).toBe(false);expect(another.disabled).toBe(false);another.click();
    expect(x.description.value).toBe('');expect(x.description.disabled).toBe(false);expect(x.submit.hidden).toBe(false);expect((document.getElementById('feedback-question') as HTMLInputElement).value).toBe('101');
  });
  it('retains text on uncertain failure and preserves the reference for an unchanged manual retry',async()=>{
    const send=vi.fn().mockRejectedValueOnce(new Error('timeout')).mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);const x=await mounted(send);
    x.category.value='answer';x.description.value='答案有疑問';x.dispatch();await vi.waitFor(()=>expect(x.submit.disabled).toBe(false));
    expect(x.description.value).toBe('答案有疑問');expect(x.submit.textContent).toBe('重試送出');expect(document.getElementById('feedback-error')?.textContent).toContain('尚未確認送出');expect(document.getElementById('feedback-error')?.textContent).toContain('可能');
    x.dispatch();await vi.waitFor(()=>expect(x.submit.disabled).toBe(false));expect(send.mock.calls[1]![0].reference).toBe(send.mock.calls[0]![0].reference);
    x.description.value='答案與解析不一致';x.dispatch();await vi.waitFor(()=>expect(send).toHaveBeenCalledTimes(3));expect(send.mock.calls[2]![0].reference).not.toBe(send.mock.calls[0]![0].reference);
  });
  it('ignores malformed query values and does not silently drop an autofilled honeypot',async()=>{
    const x=await mounted(undefined,'form=old-mock12&question=201&description=%3Cimg%3E');expect((document.getElementById('feedback-form-id') as HTMLSelectElement).value).toBe('');expect((document.getElementById('feedback-question') as HTMLInputElement).value).toBe('');expect(x.description.value).toBe('');
    (document.getElementById('feedback-form-id') as HTMLSelectElement).value='prac01';x.category.value='other';x.description.value='整份建議';const honey=document.getElementById('feedback-website') as HTMLInputElement;
    expect(honey.autocomplete).toBe('off');expect(honey.tabIndex).toBe(-1);expect(honey.getAttribute('aria-hidden')).toBe('true');honey.value='autofilled';x.dispatch();expect(x.send).not.toHaveBeenCalled();expect(document.getElementById('feedback-error')?.hidden).toBe(false);
  });
  it('preserves correct per-question links using display numbers instead of legacy source IDs',()=>{
    const form:StudyForm={schemaVersion:1,id:'mock04',title:'模考 4',role:'mock',contentVersion:'v1',questions:[101,102].map(number=>({id:`old-mock12-source-${number}`,number,part:3,groupId:'group',text:'Question',choices:[{key:'A',text:'Choice'}],audio:null,image:null,passage:null,documents:[],graphic:null,sourceHash:'hash'}))};
    const rendered=renderQuestionGroup(form.questions,createAttempt(form,3),null,false,{answer:()=>{},flag:()=>{},confirm:()=>{},feedbackHref:q=>feedbackHref(new URL('https://example.test/site/toeic/'),form.id,q.number)});
    expect([...rendered.querySelectorAll<HTMLAnchorElement>('a')].map(link=>link.href)).toEqual(['https://example.test/site/toeic/feedback/?form=mock04&question=101','https://example.test/site/toeic/feedback/?form=mock04&question=102']);
  });
});
