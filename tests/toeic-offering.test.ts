import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StudyData } from '../src/toeic/data';
import { buildFeedbackPayload, feedbackHref } from '../src/toeic/feedback';
import { exportContent, PUBLIC_FORMS } from '../scripts/toeic-content.mjs';

const ids=['prac01','mock01','mock02'];
const catalog=(forms=ids)=>({schemaVersion:1,contentVersion:'v1',totalQuestions:600,forms:forms.map(id=>({id,title:id,role:id.startsWith('prac')?'practice':'mock',description:'demo',total:200,parts:[1,2,3,4,5,6,7].map(part=>({part,total:1}))}))});
afterEach(()=>vi.unstubAllGlobals());

describe('three-form public offering',()=>{
  it('accepts exactly the three selected forms and rejects duplicate or stale catalogs',async()=>{
    const request=vi.fn().mockResolvedValue({ok:true,json:async()=>catalog()});
    const data=new StudyData(new URL('https://example.test/site/assets/toeic/'),request);
    expect((await data.catalog()).forms.map(f=>f.id)).toEqual(ids);
    for(const forms of [['prac01','prac02','mock01'],['prac01','mock01','mock01'],[...ids,'mock03']]){
      request.mockResolvedValueOnce({ok:true,json:async()=>catalog(forms)});
      await expect(data.catalog()).rejects.toThrow();
    }
  });
  it.each(['prac02','mock03','mock04','mock05'])('blocks removed %s before data or feedback delivery',async id=>{
    const request=vi.fn();const data=new StudyData(new URL('https://example.test/site/assets/toeic/'),request);
    await expect(data.form(id,'v1')).rejects.toThrow('未開放');
    await expect(data.review({id} as never)).rejects.toThrow('未開放');
    expect(request).not.toHaveBeenCalled();
    expect(()=>buildFeedbackPayload({formId:id,questionNumber:1,category:'other',description:'test',contentVersion:'v1'},'DC-test')).toThrow();
    expect(()=>feedbackHref(new URL('https://example.test/site/toeic/'),id,1)).toThrow();
  });
  it('exports only the agreed forms and refuses to retain stale files in an existing output directory',async()=>{
    expect(PUBLIC_FORMS).toEqual(ids);
    const output=await mkdtemp(path.join(tmpdir(),'toeic-offering-'));
    try{
      await writeFile(path.join(output,'stale.json'),'preserve');
      await expect(exportContent({sourceRoot:'unused',mediaRoot:'unused',output})).rejects.toThrow('空目錄');
      expect(await readFile(path.join(output,'stale.json'),'utf8')).toBe('preserve');
    }finally{await rm(output,{recursive:true,force:true});}
  });
});
