import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { generateToeicPages } from '../scripts/generate-toeic-pages.mjs';

describe('three-form website descriptions and choices',()=>{
  it('advertises600 questions and offers only the three selected forms across catalog and feedback',async()=>{
    await generateToeicPages(process.cwd());
    const catalog=new DOMParser().parseFromString(await readFile('toeic/index.html','utf8'),'text/html');
    expect(catalog.title).toContain('600 題');
    expect([...catalog.querySelectorAll('.form-card a')].map(a=>new URL(a.getAttribute('href')!,'https://example.test/toeic/').searchParams.get('form'))).toEqual(['prac01','mock01','mock02']);
    const feedback=new DOMParser().parseFromString(await readFile('toeic/feedback/index.html','utf8'),'text/html');
    expect([...feedback.querySelectorAll<HTMLOptionElement>('#feedback-form-id option')].map(o=>o.value)).toEqual(['','prac01','mock01','mock02']);
    const app=await readFile('toeic/app/index.html','utf8');
    expect(app).toContain('網站：三套免費');expect(app).toContain('模考 3～10');expect(app).toContain('兩套完整練習免費');
    for(const file of ['index.html','toeic/index.html','toeic/app/index.html','toeic-translation/index.html','src/pages.ts']){
      const html=await readFile(file,'utf8');expect(html).not.toMatch(/1,400|1400|七套免費|五套模考|免費體驗七套/);
    }
  });
});
