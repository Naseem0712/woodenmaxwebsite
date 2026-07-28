const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'products', 'grills.html');
const pageUrl = 'https://woodenmax.in/products/grills#window-grill-designs-gallery';
let html = fs.readFileSync(filePath, 'utf8');
let changed = 0;

html = html.replace(
  /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
  (full, inner) => {
    let data;
    try {
      data = JSON.parse(inner.trim());
    } catch (e) {
      return full;
    }
    if (data['@type'] !== 'ItemList' || data.name !== 'Window grill design gallery') {
      return full;
    }
    data.itemListElement.forEach((li) => {
      if (li.item && li.item['@type'] === 'ImageObject') {
        li.item.url = pageUrl;
        changed++;
      }
    });
    return '<script type="application/ld+json">\n' + JSON.stringify(data, null, 2) + '\n</script>';
  }
);

fs.writeFileSync(filePath, html);
console.log('Updated', changed, 'ImageObject url fields');
