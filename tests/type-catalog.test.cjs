/* eslint-disable @typescript-eslint/no-require-imports -- Exercise the storage module against isolated files. */
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const Module = require('node:module');
const ts = require('typescript');
const repo = path.resolve(__dirname, '..');
const initialCwd = process.cwd();
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'kokeni-types-'));
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
process.chdir(sandbox);
const data = require(path.join(repo, 'src/lib/catalog/data.ts'));
const types = require(path.join(repo, 'src/lib/catalog/typeCatalog.ts'));
const attributes = [{ label: { ka: 'მასალა', en: 'Material' }, value: { ka: 'ტყავი', en: 'Leather' } }];

test('type fields and example specifications survive create, edit, legacy callers and explicit clearing', async () => {
  await data.createGroupRecord({ nameKa: 'ჯგუფი', nameEn: 'Academic', isActive: true });
  const group = (await data.getCatalogSnapshot()).groups[0];
  const base = { groupId: group.id, nameKa: 'დიპლომის ყდა', nameEn: 'Diploma cover', isActive: true, showOnHome: true };
  await data.createCategoryRecord(base);
  await data.createCategoryRecord({ ...base, nameKa: 'ჩასადები', nameEn: 'Holder', showOnHome: false });
  let snapshot = await data.getCatalogSnapshot();
  const category = snapshot.categories.find(item => item.name.en === 'Diploma cover');
  const related = snapshot.categories.find(item => item.name.en === 'Holder');
  const homeBefore = await data.getHomeDirections('ka');
  const productInput = { categoryId: category.id, nameKa: 'ნიმუში', shortDescriptionKa: 'აღწერა', priceMode: 'contact', isPublished: true, imagesJson: JSON.stringify([{ id: 'image', src: '/uploads/products/example.webp', order: 1 }]), specificationsJson: JSON.stringify(attributes) };
  const product = await data.createProductRecord(productInput);
  await data.updateCategoryRecord({ ...base, id: category.id, order: 1, customizationJson: JSON.stringify(attributes), descriptionKa: 'აღწერა', descriptionEn: 'Description', illustration: 'cover', relatedCategoryIds: [related.id], coverProductId: product.id, catalogOrder: '2' });
  snapshot = await data.getCatalogSnapshot();
  let saved = snapshot.categories.find(item => item.id === category.id);
  assert.deepEqual(saved.customization, attributes);
  assert.deepEqual(saved.relatedCategoryIds, [related.id]);
  assert.equal(saved.description.en, 'Description');
  assert.equal(saved.catalogOrder, 2);
  assert.equal(types.typeCover(saved, snapshot.products).id, product.id);
  assert.deepEqual(await data.getHomeDirections('ka'), homeBefore);
  const legacyInput = { ...productInput };
  delete legacyInput.specificationsJson;
  await data.updateProductRecord({ ...legacyInput, id: product.id, order: 1 });
  await data.updateCategoryRecord({ ...base, id: category.id, order: 1 });
  snapshot = await data.getCatalogSnapshot();
  assert.deepEqual(snapshot.products[0].specifications, attributes);
  assert.deepEqual(snapshot.categories.find(item => item.id === category.id).customization, attributes);
  const stableCode = product.code;
  await data.updateProductRecord({ ...productInput, id: product.id, order: 1, nameKa: 'ახალი სახელი', specificationsJson: '[]' });
  await data.updateCategoryRecord({ ...base, id: category.id, order: 1, descriptionKa: '', descriptionEn: '', customizationJson: '[]', relatedCategoryIds: [], coverProductId: '', catalogOrder: '' });
  snapshot = await data.getCatalogSnapshot();
  saved = snapshot.categories.find(item => item.id === category.id);
  assert.deepEqual(saved.customization, []);
  assert.deepEqual(saved.relatedCategoryIds, []);
  assert.equal(saved.description, undefined);
  assert.equal(saved.coverProductId, undefined);
  assert.equal(saved.catalogOrder, undefined);
  assert.deepEqual(snapshot.products[0].specifications, []);
  assert.equal(snapshot.products[0].code, stableCode);
  await assert.rejects(() => data.updateCategoryRecord({ ...base, id: category.id, order: 1, relatedCategoryIds: [category.id] }), { code: 'invalid_related_types' });
  await assert.rejects(() => data.updateCategoryRecord({ ...base, id: category.id, order: 1, relatedCategoryIds: ['missing'] }), { code: 'invalid_related_types' });
  await assert.rejects(() => data.updateCategoryRecord({ ...base, id: category.id, order: 1, coverProductId: 'missing' }), { code: 'invalid_cover_product' });
  await assert.rejects(() => data.updateCategoryRecord({ ...base, id: category.id, order: 1, catalogOrder: '1.5' }), { code: 'invalid_order' });
  await assert.rejects(() => data.updateProductRecord({ ...productInput, id: product.id, order: 1, specificationsJson: '[{"label":{"ka":""},"value":{"ka":"x"}}]' }), { code: 'invalid_attributes' });
});

test('public selection hides inactive families and drafts; cover falls back; old records remain usable', () => {
  const groups = [{ id: 'a', isActive: true, order: 1 }, { id: 'b', isActive: false, order: 2 }];
  const categories = [{ id: 'x', groupId: 'a', isActive: true, order: 1, slug: 'diploma-cover', name: { ka: 'ყდა' }, coverProductId: 'draft' }, { id: 'hidden', groupId: 'b', isActive: true, order: 1 }, { id: 'off', groupId: 'a', isActive: false, order: 2 }];
  assert.deepEqual(types.publicTypes(groups, categories).map(item => item.id), ['x']);
  const products = [{ id: 'draft', categoryId: 'x', isPublished: false, order: 1, images: [{ src: 'draft' }] }, { id: 'live', categoryId: 'x', isPublished: true, order: 2, images: [{ src: 'live' }] }, { id: 'other', categoryId: 'hidden', isPublished: true, order: 1, images: [] }];
  assert.deepEqual(types.typeExamples(categories[0], products).map(item => item.id), ['live']);
  assert.equal(types.typeCover(categories[0], products).id, 'live');
  assert.equal(types.typePath('ka', categories[0]), '/ka/catalog/types/diploma-cover');
  assert.equal(types.localized({ ka: 'ყდა' }, 'en'), 'ყდა');
  assert.equal(types.parseAttributes(undefined), undefined);
  assert.throws(() => types.parseAttributes('{}'));
  assert.throws(() => types.parseAttributes(JSON.stringify(Array(25).fill(attributes[0]))));
});

after(() => { process.chdir(initialCwd); Module._load = originalLoad; fs.rmSync(sandbox, { recursive: true, force: true }); });
