/* eslint-disable @typescript-eslint/no-require-imports -- Load the TypeScript modules directly, as the other suites do. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const Module = require('node:module');
const ts = require('typescript');
const repo = path.resolve(__dirname, '..');
const originalLoad = Module._load;
Module._load = function (id, parent, main) {
  if (id === 'server-only') return {};
  if (id === 'next/cache') return { unstable_noStore() {} };
  if (id.startsWith('@/')) id = path.join(repo, 'src', id.slice(2));
  return originalLoad.call(this, id, parent, main);
};
Module._extensions['.ts'] = function (module, filename) {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
};
const composition = require(path.join(repo, 'src/lib/catalog/composition.ts'));
const types = require(path.join(repo, 'src/lib/catalog/typeCatalog.ts'));
const urls = require(path.join(repo, 'src/lib/catalog/urls.ts'));

const type = (slug, ka, extra = {}) => ({ id: `id-${slug}`, groupId: 'g', slug, order: 1, name: { ka, en: slug }, isActive: true, createdAt: '', updatedAt: '', ...extra });

test('composition: families in configured order, primary first, missing members skipped, empty families hidden', () => {
  const live = [
    type('diary', 'ყოველდღიური'), type('notebook', 'ბლოკნოტი'), type('menu', 'მენიუს ყდა'), type('receipt', 'ანგარიშის ჩასადები'),
    type('waiter-notebook', 'მიმტანის ბლოკნოტი'), type('diploma-cover', 'დიპლომის ყდები'), type('pen-case', 'კალმის ბუდე'),
  ];
  const result = composition.composeCatalog(live);
  assert.deepEqual(result.families.map(family => family.config.id), ['diploma', 'restaurant', 'notebooks']);
  assert.deepEqual(result.families.find(family => family.config.id === 'restaurant').members.map(member => member.slug), ['menu', 'receipt', 'waiter-notebook']);
  assert.deepEqual(result.families.find(family => family.config.id === 'notebooks').members.map(member => member.slug), ['notebook', 'diary']);
  assert.deepEqual(result.unplaced.map(item => item.slug), ['pen-case'], 'an unconfigured type is not dumped anywhere');
  assert.deepEqual(result.others, []);
  assert.ok(result.slots.some(slot => slot.family === 'notebooks' && !slot.resolved && slot.ref.includes('weekly-planner')), 'missing slots are reported');
});

test('composition: candidate slugs, legacy slugs, one placement per type, curated others, landing family', () => {
  const live = [
    type('ofitsialuri-dokumentis-qdebi', 'ოფიციალური დოკუმენტის ყდები'),
    type('menu-cover', 'მენიუს ყდა', { legacySlugs: ['menu'] }),
    type('document-and-card-holder', 'საბუთების ჩასადები'),
    type('passport-cover', 'პასპორტის ყდა'), type('birth-certificate-cover', 'დაბადების მოწმობის ყდა'),
    type('medal-case', 'მედლის ყუთი'),
  ];
  const result = composition.composeCatalog(live);
  const byId = Object.fromEntries(result.families.map(family => [family.config.id, family]));
  assert.equal(byId.credential.members[0].slug, 'ofitsialuri-dokumentis-qdebi');
  assert.equal(byId.restaurant.members.length, 1, 'a type matched by slug and legacy slug is placed once');
  assert.equal(byId.folders.members[0].slug, 'document-and-card-holder');
  assert.equal(byId['personal-documents'].landing, true);
  assert.deepEqual(byId['personal-documents'].members.map(member => member.slug), ['passport-cover', 'birth-certificate-cover']);
  assert.deepEqual(result.others.map(item => item.slug), ['medal-case']);
  assert.equal(composition.familyOf(result, 'id-passport-cover').config.id, 'personal-documents');
  assert.equal(composition.landingFamily(result, 'personal-documents').config.id, 'personal-documents');
  assert.equal(composition.landingFamily(result, 'folders'), undefined, 'primary families have no landing page');
  const twice = composition.composeCatalog([type('menu', 'მენიუ')], [
    { kind: 'primary', id: 'a', title: { ka: 'ა' }, lede: { ka: '' }, primary: ['menu'], siblings: [] },
    { kind: 'primary', id: 'b', title: { ka: 'ბ' }, lede: { ka: '' }, primary: ['menu'], siblings: [] },
  ], [['menu']]);
  assert.deepEqual(twice.families.map(family => family.config.id), ['a']);
  assert.ok(twice.slots.filter(slot => slot.duplicate).length === 2);
});

test('landing family slugs are reserved for item types', () => {
  assert.ok(urls.RESERVED_CATALOG_SLUGS.includes('personal-documents'));
  assert.equal(urls.familyPath('en', 'personal-documents'), '/en/catalog/personal-documents');
  assert.ok(composition.sameStem('დიპლომის ყდა', 'დიპლომის ყდები'));
  assert.ok(!composition.sameStem('საქაღალდეები', 'საბუთების ჩასადები'));
});

test('drawings: specific choices are kept, old generic defaults give way to the name', () => {
  const draw = (slug, ka, illustration) => types.illustrationFor({ slug, name: { ka }, illustration });
  assert.equal(draw('diary', 'ყოველდღიური', 'notebook'), 'diary');
  assert.equal(draw('waiter-notebook', 'მიმტანის ბლოკნოტი', 'notebook'), 'waiter');
  assert.equal(draw('receipt', 'რესტორნის ანგარიშის ჩასადები', 'holder'), 'receipt');
  assert.equal(draw('ofitsialuri-dokumentis-qdebi', 'ოფიციალური დოკუმენტის ყდები', 'cover'), 'credential');
  assert.equal(draw('document-and-card-holder', 'საბუთების ჩასადები'), 'folder');
  assert.equal(draw('id-card-holder', 'პირადობის ბარათის ჩასადები'), 'card');
  assert.equal(draw('birth-certificate-cover', 'დაბადების მოწმობის ყდა'), 'certificate');
  assert.equal(draw('marriage-certificate-cover', 'ქორწინების მოწმობის ყდა'), 'marriage');
  assert.equal(draw('something', 'რაღაც', 'binder'), 'binder', 'a specific drawing chosen in the admin wins');
  assert.equal(draw('something', 'რაღაც', 'holder'), 'folder', 'old generic value maps to its drawing');
  assert.equal(draw('something', 'რაღაც'), 'diploma');
  assert.ok(types.TYPE_DRAWINGS.every(item => types.typeIllustrations.includes(item.value)));
});

test('an item type named like a landing family gets a different slug', async () => {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'kokeni-composition-'));
  const cwd = process.cwd();
  process.chdir(sandbox);
  try {
    const data = require(path.join(repo, 'src/lib/catalog/data.ts'));
    await data.createGroupRecord({ nameKa: 'ჯგუფი', nameEn: 'Group', isActive: true });
    const group = (await data.getCatalogSnapshot()).groups[0];
    await data.createCategoryRecord({ groupId: group.id, nameKa: 'პირადი დოკუმენტები', nameEn: 'Personal documents', isActive: true, showOnHome: false });
    const saved = (await data.getCatalogSnapshot()).categories[0];
    assert.equal(saved.slug, 'personal-documents-2');
    await data.updateCategoryRecord({ groupId: group.id, id: saved.id, order: 1, nameKa: 'პირადი დოკუმენტები', nameEn: 'Personal documents', isActive: true, showOnHome: false, illustration: '' });
    assert.equal((await data.getCatalogSnapshot()).categories[0].illustration, undefined, 'empty drawing = automatic');
  } finally {
    process.chdir(cwd);
  }
});
