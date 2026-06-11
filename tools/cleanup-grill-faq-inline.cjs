#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '../products/grills');
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.html'))) {
  const p = path.join(dir, f);
  let h = fs.readFileSync(p, 'utf8');
  h = h.replace(
    /<section style="padding: 3rem 0; background: #F8FAFC;">/g,
    '<section class="grills-faq-section">'
  );
  h = h.replace(
    /<div class="grills-faq-item" style="border: 1px solid #E5E7EB; border-radius: 12px; margin-bottom: 0.75rem; overflow: hidden;">/g,
    '<div class="grills-faq-item">'
  );
  h = h.replace(
    /<div class="grills-faq-question" onclick="toggleFaq\(this\)" style="padding: 1.25rem 1.5rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: #FFFFFF; font-weight: 600; color: #0F172A;">/g,
    '<div class="grills-faq-question" onclick="toggleFaq(this)">'
  );
  h = h.replace(
    /<div class="grills-faq-answer" style="padding: 0 1.5rem; max-height: 0; overflow: hidden; transition: all 0.3s;">/g,
    '<div class="grills-faq-answer">'
  );
  h = h.replace(/<p style="color: #475569; line-height: 1.7; padding-bottom: 1rem;">/g, '<p>');
  h = h.replace(
    /<h2 style="font-size: 1.75rem; font-weight: 700; color: #0F172A; margin-bottom: 1.5rem; text-align: center;">Frequently Asked Questions<\/h2>/g,
    '<h2>Frequently Asked Questions</h2>'
  );
  h = h.replace(
    /<h3 style="font-size: 1.35rem; font-weight: 700; color: #0F172A; margin: 0 0 1rem; text-align: center;">/g,
    '<h3>'
  );
  fs.writeFileSync(p, h);
  console.log('updated', f);
}
